//! D4 association-set core — client port (decision: docs/decisions/D4-association-sets.md in the
//! protocol repo). The browser builds the SAME association root the protocol SDK does, so the
//! `association_root` / `assoc_path` a wallet feeds the unshield circuit are bit-exact with what any
//! recomputing party (the co-signer, a watcher) would derive from the public inputs.
//!
//! The association set = the full on-chain COMMITMENT STREAM (every leaf — `Shield` deposits AND
//! `PrivateTransfer` outputs, in on-chain leafIndex order) minus a published exclusion ledger,
//! restricted to leaves matured past `D`. It reuses `./notes` (`treeRoot` / `buildPath`, the depth-32
//! circomlib Poseidon), the exact tree the on-chain pool and the unshield circuit use — so the
//! association root is a pure function of (commitment stream, exclusion ledger, maturation, asOf).
//!
//! Migration / testnet identity (the load-bearing property): with an EMPTY exclusion ledger and
//! maturation 0, `buildAssociationSet` returns a root EQUAL to the full commitment-tree root. That is
//! why the client can route through this path today — on testnet there is no ASP feed and no
//! maturation window, so the association root equals the commitment root the guardian has already
//! accepted on-chain, and unshield still verifies. When the exclusion feed turns on, the same code
//! produces the (subset) root + assoc_path with no further change.
//!
//! This is the client subset: the deterministic builder + witness + ledger fold. The co-signer-side
//! acceptance gate (`verifyAcceptance` / `checkMonotone` / watcher heuristics) lives in the protocol
//! SDK (`sdk/src/association.ts`) — it holds no keys here and the wallet never needs it.

import { treeRoot, buildPath } from "./notes";

/// Coded exclusion reasons (the published ledger carries the category only; human-readable evidence is
/// held privately for the auditor/appeal body — see D4 §2).
export type ExclusionCategory =
  | "sanctioned"
  | "hack-proceeds"
  | "law-enforcement"
  | "analytics-threshold";

/// One operation in the append-with-retraction exclusion ledger. `seq` is the CANONICAL order key (a
/// unique, strictly-increasing integer assigned at append time): the fold sorts by `seq`, so the active
/// set is independent of the order a party receives the ops. `at` is unix-seconds, for human/audit
/// reference ONLY — never the ordering key.
export type LedgerOp =
  | { op: "flag"; commitment: bigint; category: ExclusionCategory; seq: number; at: number }
  | { op: "retract"; commitment: bigint; seq: number; at: number };

/// A leaf in the on-chain commitment tree: its commitment and the block timestamp it was inserted (for
/// maturation). One per PHYSICAL insert — `Shield` (1 leaf) and `PrivateTransfer` (2 leaves) — in
/// on-chain leafIndex order.
export interface PoolLeaf {
  commitment: bigint;
  t0: number; // unix seconds of the inserting event's block
}

export interface BuildParams {
  /// The FULL commitment stream in on-chain insert order (Shield + PrivateTransfer outputs). Order is
  /// load-bearing: the approved-subset tree preserves it, so the root is deterministic.
  leaves: readonly PoolLeaf[];
  /// The ACTIVE excluded commitments (fold the ledger with `activeExclusions` first).
  excluded: ReadonlySet<bigint>;
  /// Maturation buffer D, in seconds — a leaf is eligible only once `t0 + D <= asOf`.
  maturationSeconds: number;
  /// The "as-of" wall-clock (integer unix seconds) the root is computed for.
  asOf: number;
}

export interface AssociationSet {
  root: bigint;
  /// The approved leaves, in canonical (insert) order — index i is the assoc leaf index.
  leaves: bigint[];
  asOf: number;
  maturationSeconds: number;
}

export interface AssociationWitness {
  root: bigint;
  index: number;
  path: bigint[];
}

/// Time inputs share the integer unix-seconds domain of on-chain block timestamps; a float/NaN/negative
/// value would let two honest parties recompute different roots, so reject it.
function assertTime(name: string, v: number): void {
  if (!Number.isInteger(v) || v < 0 || v > Number.MAX_SAFE_INTEGER) {
    throw new RangeError(`${name} must be an integer in [0, 2^53) unix seconds; got ${v}`);
  }
}

/// Fold an append-with-retraction ledger into the set of currently-excluded commitments. Ops are sorted
/// by their canonical `seq` first, so the result is independent of delivery order; a later `retract`
/// re-includes a commitment, a later `flag` re-excludes it.
export function activeExclusions(ops: readonly LedgerOp[]): Set<bigint> {
  const ordered = ops.slice().sort((a, b) => a.seq - b.seq);
  const set = new Set<bigint>();
  for (const op of ordered) {
    if (op.op === "flag") set.add(op.commitment);
    else set.delete(op.commitment);
  }
  return set;
}

/// Build the approved-subset association tree: every commitment-stream leaf matured past D, minus the
/// active exclusions, in canonical order. Deterministic in (leaves, excluded, maturationSeconds, asOf).
export function buildAssociationSet(p: BuildParams): AssociationSet {
  assertTime("asOf", p.asOf);
  assertTime("maturationSeconds", p.maturationSeconds);
  // Compare as a subtraction (`t0 <= asOf - D`), not an addition — the difference of two safe integers
  // is always exact, so this can't lose precision the way `t0 + D` could near 2^53.
  const cutoff = p.asOf - p.maturationSeconds;
  const leaves: bigint[] = [];
  for (const l of p.leaves) {
    assertTime("leaf.t0", l.t0);
    if (l.t0 <= cutoff && !p.excluded.has(l.commitment)) {
      leaves.push(l.commitment);
    }
  }
  return { root: treeRoot(leaves), leaves, asOf: p.asOf, maturationSeconds: p.maturationSeconds };
}

/// The membership witness (index + path) a wallet feeds into the unshield proof, or null if
/// `commitment` is not in this association set (e.g. excluded, or not yet matured). Uses the first
/// occurrence; on-chain membership is by commitment VALUE, so a path to any occurrence of a (rare)
/// duplicated commitment verifies equally.
export function associationWitness(set: AssociationSet, commitment: bigint): AssociationWitness | null {
  const index = set.leaves.indexOf(commitment);
  if (index < 0) return null;
  const { root, path } = buildPath(set.leaves, index);
  return { root, index, path };
}
