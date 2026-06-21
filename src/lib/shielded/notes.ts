//! Shielded-note primitives — the JS mirror of `circuits/lib/src/lib.nr`.
//!
//! These MUST stay bit-exact with the Noir circuits AND the on-chain `PoseidonT3` /
//! `MerkleTreeWithHistory`, or proofs the client builds won't verify and the indexer will derive the
//! wrong commitments/roots. `poseidon-lite` implements circomlib's original Poseidon over BN254, the
//! same hasher the circuit's `poseidon::poseidon::bn254` and the vendored `PoseidonT3` use — the
//! equality is asserted against `circuits/VECTORS.md` ground truth in `test/vectors.test.ts`.
//!
//! Key model (identical to the circuit):
//!   ownerPubKey = H(ownerPrivKey)
//!   commitment  = H(value, ownerPubKey, blinding, assetId)
//!   nullifier   = H(ownerPrivKey, leafIndex)
//! Tree: binary Merkle, depth 32, node = H(left, right), empty leaf = 0.

import { poseidon1, poseidon2, poseidon4 } from "poseidon-lite";
import { assertCanonical } from "./field";

/// Merkle tree depth — must equal the circuits' `TREE_DEPTH` and the pool's `LEVELS`.
export const TREE_DEPTH = 32;

/// One past the largest valid note value. The circuits range-check `value < 2^128` (so JoinSplit sums
/// can't overflow the field); the SDK enforces the same so a bad note fails fast here, not as an opaque
/// proving error.
export const MAX_NOTE_VALUE = 1n << 128n;

/**
 * Throw unless every field of `note` is a valid circuit input: `value` in `[0, 2^128)` and
 * `ownerPriv` / `blinding` / `assetId` canonical BN254 elements. Catches malformed notes at the SDK
 * boundary instead of deep inside proving.
 */
export function assertValidNote(note: Note): void {
  if (note.value < 0n || note.value >= MAX_NOTE_VALUE) {
    throw new RangeError(`note.value must be in [0, 2^128): ${note.value}`);
  }
  assertCanonical(note.ownerPriv, "note.ownerPriv");
  assertCanonical(note.blinding, "note.blinding");
  assertCanonical(note.assetId, "note.assetId");
}

/// Two-input Poseidon — Merkle node / generic pair hash (circuit `hash2`, on-chain `PoseidonT3.hash`).
export function hash2(a: bigint, b: bigint): bigint {
  return poseidon2([a, b]);
}

/// ownerPubKey = H(ownerPrivKey)  (circuit `owner_pub_key`).
export function ownerPubKey(ownerPriv: bigint): bigint {
  return poseidon1([ownerPriv]);
}

/// Note commitment = H(value, ownerPubKey, blinding, assetId)  (circuit `commitment`).
export function commitment(value: bigint, ownerPub: bigint, blinding: bigint, assetId: bigint): bigint {
  return poseidon4([value, ownerPub, blinding, assetId]);
}

/// Nullifier = H(ownerPrivKey, leafIndex)  (circuit `nullifier`). Only the owner can derive it, and it
/// reveals nothing about which commitment it spends.
export function nullifier(ownerPriv: bigint, leafIndex: bigint): bigint {
  return poseidon2([ownerPriv, leafIndex]);
}

/// A shielded note (the secret the owner holds). `assetId` is 0 in single-asset v1.
export interface Note {
  value: bigint;
  ownerPriv: bigint;
  blinding: bigint;
  assetId: bigint;
}

/// Commitment of a note (the leaf inserted on-chain).
export function noteCommitment(note: Note): bigint {
  return commitment(note.value, ownerPubKey(note.ownerPriv), note.blinding, note.assetId);
}

/// Empty-subtree roots: `zeros[0] = 0`, `zeros[i] = hash2(zeros[i-1], zeros[i-1])`. Length
/// `TREE_DEPTH + 1`. These are the sibling values for empty positions in a membership path and MUST
/// match the on-chain tree's `zeros(i)` (circuit `zeros_chain`).
export function zerosChain(): bigint[] {
  const z: bigint[] = [0n];
  for (let i = 0; i < TREE_DEPTH; i++) {
    const prev = z[i]!;
    z.push(hash2(prev, prev));
  }
  return z;
}

/// Recompute the Merkle root from a leaf, its index, and the sibling path (length `TREE_DEPTH`).
/// Bit `i` of `index` (LSB-first) = 0 ⇒ the running hash is the left child at level `i`. Identical to
/// the circuit's `merkle_root` and the on-chain `_insert` fold.
export function merkleRoot(leaf: bigint, index: bigint, path: bigint[]): bigint {
  if (path.length !== TREE_DEPTH) throw new RangeError(`path must have ${TREE_DEPTH} siblings`);
  if (index < 0n || index >= 1n << BigInt(TREE_DEPTH)) throw new RangeError("index out of tree range");
  let cur = leaf;
  let idx = index;
  for (let i = 0; i < TREE_DEPTH; i++) {
    const sibling = path[i]!;
    const isRight = (idx & 1n) === 1n;
    const left = isRight ? sibling : cur;
    const right = isRight ? cur : sibling;
    cur = hash2(left, right);
    idx >>= 1n;
  }
  return cur;
}

/// Compute the current tree root from the full ordered leaf list (empty positions = zeros chain).
/// Equals the on-chain `currentRoot()` after the same inserts. Empty tree → `zeros[TREE_DEPTH]`.
export function treeRoot(leaves: bigint[]): bigint {
  const z = zerosChain();
  if (leaves.length === 0) return z[TREE_DEPTH]!;
  let level = leaves.slice();
  for (let d = 0; d < TREE_DEPTH; d++) {
    const next: bigint[] = [];
    for (let i = 0; i < level.length; i += 2) {
      const l = level[i]!;
      const r = i + 1 < level.length ? level[i + 1]! : z[d]!;
      next.push(hash2(l, r));
    }
    level = next;
  }
  return level[0]!;
}

/// Build the sibling path for a leaf at `index` from the full list of `leaves` currently in the tree
/// (the indexer's job, replayed from on-chain `Shield`/`PrivateTransfer` events). Empty positions use
/// the zeros chain. Returns `{ root, path }` so the caller can sanity-check membership before proving.
export function buildPath(leaves: bigint[], index: number): { root: bigint; path: bigint[] } {
  if (index < 0 || index >= leaves.length) throw new RangeError("index has no leaf");
  const z = zerosChain();
  const path: bigint[] = [];
  // level 0 holds the leaves; pad the working level to even length with the level's zero value
  let level = leaves.slice();
  let idx = index;
  for (let d = 0; d < TREE_DEPTH; d++) {
    const siblingIdx = idx ^ 1;
    path.push(siblingIdx < level.length ? level[siblingIdx]! : z[d]!);
    // hash up to the next level
    const next: bigint[] = [];
    for (let i = 0; i < level.length; i += 2) {
      const l = level[i]!;
      const r = i + 1 < level.length ? level[i + 1]! : z[d]!;
      next.push(hash2(l, r));
    }
    level = next;
    idx >>= 1;
  }
  const leaf = leaves[index]!;
  assertCanonical(leaf, "leaf");
  return { root: merkleRoot(leaf, BigInt(index), path), path };
}
