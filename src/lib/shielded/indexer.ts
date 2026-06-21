//! Note indexer — reconstruct the shielded-pool state from on-chain events so a client can find its
//! notes and build membership witnesses for proving.
//!
//! This is the PURE core: it reduces already-decoded `Shield` / `PrivateTransfer` / `Unshield` events
//! into the leaf list + spent-nullifier set, then answers "which of my notes are still spendable, and
//! what's their Merkle path?". Decoding raw logs (viem/ethers `getLogs` + the ABI fragments in
//! `POOL_EVENTS`) is a thin layer the consumer supplies — kept out so this stays dependency-light and
//! deterministically testable. The leaf order here MUST match the on-chain insert order (shield → 1
//! leaf; transfer → 2), so `treeRoot` / `buildPath` reproduce the chain's roots exactly.

import { TREE_DEPTH, buildPath, treeRoot, zerosChain, nullifier as noteNullifier, noteCommitment, type Note } from "./notes";

/// Human-readable event signatures (for viem/ethers decoding). Mirror `ShieldedPool` events.
export const POOL_EVENTS = {
  shield: "event Shield(uint256 indexed commitment, uint256 indexed leafIndex, uint256 amount)",
  transfer:
    "event PrivateTransfer(uint256 spentRoot, uint256 indexed nullifierA, uint256 indexed nullifierB, uint256 commitmentA, uint256 commitmentB, uint256 leafIndexA, uint256 leafIndexB, uint256 fee, address feeRecipient)",
  unshield: "event Unshield(uint256 indexed nullifier, address indexed to, uint256 amount, uint256 fee, address feeRecipient)",
} as const;

export interface ShieldEvent {
  commitment: bigint;
  leafIndex: number;
  amount: bigint;
}
export interface TransferEvent {
  nullifierA: bigint;
  nullifierB: bigint;
  commitmentA: bigint;
  commitmentB: bigint;
  leafIndexA: number;
  leafIndexB: number;
  fee: bigint;
}
export interface UnshieldEvent {
  nullifier: bigint;
}

export type PoolEvent =
  | { type: "shield"; data: ShieldEvent }
  | { type: "transfer"; data: TransferEvent }
  | { type: "unshield"; data: UnshieldEvent };

/// A note the caller owns, located in the tree and classified spent/unspent.
export interface LocatedNote {
  note: Note;
  leafIndex: number;
  commitment: bigint;
  nullifier: bigint;
  spent: boolean;
}

/// Rebuilds and holds shielded-pool state from a replayed event stream.
export class PoolIndexer {
  /// Leaves in insert order (index = on-chain leaf index). A `bigint` per inserted commitment.
  readonly leaves: bigint[] = [];
  /// Nullifiers revealed on-chain (spent notes).
  readonly spentNullifiers = new Set<bigint>();

  /// Apply one decoded event, inserting leaves at the indices the chain assigned. Throws if an event
  /// would insert a leaf out of sequence (a sign of dropped/reordered logs).
  apply(ev: PoolEvent): void {
    if (ev.type === "shield") {
      this.#insertAt(ev.data.leafIndex, ev.data.commitment);
    } else if (ev.type === "transfer") {
      this.spentNullifiers.add(ev.data.nullifierA);
      this.spentNullifiers.add(ev.data.nullifierB);
      this.#insertAt(ev.data.leafIndexA, ev.data.commitmentA);
      this.#insertAt(ev.data.leafIndexB, ev.data.commitmentB);
    } else {
      this.spentNullifiers.add(ev.data.nullifier);
    }
  }

  /// Apply a batch of events in order.
  applyAll(events: PoolEvent[]): void {
    for (const ev of events) this.apply(ev);
  }

  #insertAt(index: number, commitment: bigint): void {
    if (index !== this.leaves.length) {
      throw new Error(`leaf out of order: expected index ${this.leaves.length}, got ${index}`);
    }
    this.leaves.push(commitment);
  }

  /// Current commitment-tree root — equals the on-chain `currentRoot()` after the same events.
  get root(): bigint {
    return treeRoot(this.leaves);
  }

  /// Number of leaves inserted (== on-chain `nextLeafIndex()`).
  get nextLeafIndex(): number {
    return this.leaves.length;
  }

  isSpent(nullifier: bigint): boolean {
    return this.spentNullifiers.has(nullifier);
  }

  /// Locate the caller's notes in the tree (by matching commitments) and classify spent/unspent. A
  /// note not present in the tree is skipped (not yet on-chain, or wrong secrets).
  locate(notes: Note[]): LocatedNote[] {
    const indexByCommitment = new Map<bigint, number>();
    this.leaves.forEach((c, i) => {
      if (!indexByCommitment.has(c)) indexByCommitment.set(c, i);
    });
    const out: LocatedNote[] = [];
    for (const note of notes) {
      const commitment = noteCommitment(note);
      const leafIndex = indexByCommitment.get(commitment);
      if (leafIndex === undefined) continue;
      const nul = noteNullifier(note.ownerPriv, BigInt(leafIndex));
      out.push({ note, leafIndex, commitment, nullifier: nul, spent: this.spentNullifiers.has(nul) });
    }
    return out;
  }

  /// The caller's spendable (located + unspent) notes.
  spendable(notes: Note[]): LocatedNote[] {
    return this.locate(notes).filter((n) => !n.spent);
  }

  /// Membership witness (root + sibling path) for a leaf, to feed a transfer/unshield proof. The
  /// returned `root` is a known on-chain root by construction.
  witness(leafIndex: number): { root: bigint; path: bigint[] } {
    return buildPath(this.leaves, leafIndex);
  }
}

/// The empty-tree root (no events yet) — `zeros[TREE_DEPTH]`, matching the on-chain constructor.
export function emptyRoot(): bigint {
  return zerosChain()[TREE_DEPTH]!;
}
