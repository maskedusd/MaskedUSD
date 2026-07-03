// Browser-side unshield: rebuild the commitment tree from on-chain logs, then prove
// the unshield circuit for one note. The membership witness (merkle_root_pub / path)
// is the full commitment tree; the association witness (association_root / assoc_path)
// comes from the D4 association set — the commitment stream minus the published
// exclusion ledger, matured past D (see ./association). On testnet there is no ASP feed
// and no maturation window, so by the lossless-migration identity the association root
// EQUALS the commitment root the guardian has accepted on-chain, and unshield() verifies.
//
// indexer/events/notes/association are pure + SSR-safe; prove.ts (bb.js WASM) is lazy-imported.

import { PoolIndexer } from "./indexer";
import { decodePoolLogs, type RawLog } from "./events";
import { nullifier as noteNullifier } from "./notes";
import {
  buildAssociationSet,
  associationWitness,
  activeExclusions,
  type AssociationSet,
  type LedgerOp,
} from "./association";

/// Replay the pool's Shield/PrivateTransfer/Unshield logs (in on-chain order) into a
/// fresh indexer that can produce a note's membership witness.
export function buildIndexer(logs: readonly RawLog[]): PoolIndexer {
  const ix = new PoolIndexer();
  ix.applyAll(decodePoolLogs(logs));
  return ix;
}

// Public RPCs (incl. sepolia.base.org bundled with viem) cap eth_getLogs at a 2000-
// block range, so a single deploy-block→head scan throws once the chain grows past
// that — which is day one. Chunk the scan and concatenate in (block, logIndex) order.
const LOG_RANGE = 1999n;

type PoolLog = RawLog & { blockNumber: bigint | null; logIndex: number | null };
interface LogReader {
  getBlockNumber: () => Promise<bigint>;
  getLogs: (a: {
    address: `0x${string}`;
    fromBlock: bigint;
    toBlock: bigint;
  }) => Promise<PoolLog[]>;
}

/// Fetch pool logs from `fromBlock` to `toBlock` (defaults to head), chunked under the RPC's range
/// cap and globally ordered — safe to feed straight into buildIndexer. Pass an explicit `toBlock`
/// for incremental scans so the caller controls the cursor (fetch only the delta each poll).
export async function fetchPoolLogs(
  client: LogReader,
  pool: `0x${string}`,
  fromBlock: bigint,
  toBlock?: bigint,
): Promise<RawLog[]> {
  const head = toBlock ?? (await client.getBlockNumber());
  const out: PoolLog[] = [];
  for (let start = fromBlock; start <= head; start += LOG_RANGE + 1n) {
    const end = start + LOG_RANGE < head ? start + LOG_RANGE : head;
    out.push(...(await client.getLogs({ address: pool, fromBlock: start, toBlock: end })));
  }
  // defensive: preserve strict on-chain order across chunks before tree reconstruction
  out.sort((a, b) => {
    const ab = a.blockNumber ?? 0n;
    const bb = b.blockNumber ?? 0n;
    if (ab !== bb) return ab < bb ? -1 : 1;
    return (a.logIndex ?? 0) - (b.logIndex ?? 0);
  });
  return out;
}

let circuitPromise: Promise<unknown> | null = null;
function unshieldCircuit(): Promise<unknown> {
  if (!circuitPromise) {
    circuitPromise = fetch("/circuits/unshield.json").then((r) => {
      if (!r.ok) throw new Error(`failed to load unshield circuit (${r.status})`);
      return r.json();
    });
  }
  return circuitPromise;
}

export interface UnshieldNote {
  value: bigint;
  ownerPriv: bigint;
  blinding: bigint;
  assetId: bigint;
  leafIndex: number;
}

export interface UnshieldResult {
  proof: Uint8Array;
  root: bigint; // the full commitment-tree root (merkle_root_pub)
  associationRoot: bigint; // the D4 association root (== root on testnet, see below)
  nullifier: bigint;
}

/// Inputs that define the association set beyond the commitment stream itself: the published exclusion
/// ledger and the maturation window. On testnet NEITHER is live — there is no ASP feed deployed and no
/// maturation window — so the default is the lossless-migration identity (empty ledger, maturation 0),
/// under which the association root EQUALS the commitment root. When the ASP feed turns on, pass the
/// folded exclusion ledger + the real maturation window + per-leaf insert timestamps; the same code
/// then yields the (subset) association root + assoc_path with no further change.
export interface AssociationContext {
  /// The exclusion ledger as published by the ASP (folded internally by seq). Empty on testnet.
  ledger?: readonly LedgerOp[];
  /// Maturation buffer D in seconds. 0 on testnet (no maturation window).
  maturationSeconds?: number;
  /// "As-of" unix seconds the root is computed for. Only consulted when maturationSeconds > 0.
  asOf?: number;
  /// Per-leaf-index insert timestamps (unix seconds). Only consulted when maturationSeconds > 0; with
  /// D = 0 every leaf is mature regardless, so timestamps are not needed.
  leafTimestamps?: readonly number[];
}

/// Build the current D4 association set from an indexer's commitment stream. With maturation disabled
/// (the testnet default) every leaf is mature and timestamps are irrelevant, so the result is the full
/// commitment set minus any active exclusions — equal to the commitment-tree root when the ledger is
/// empty. `associationWitness(set, commitment)` then yields the assoc_index / assoc_path to prove.
export function buildAssociation(ix: PoolIndexer, ctx: AssociationContext = {}): AssociationSet {
  const maturationSeconds = ctx.maturationSeconds ?? 0;
  const excluded = activeExclusions(ctx.ledger ?? []);
  if (maturationSeconds === 0) {
    // Maturation disabled: every leaf is mature, timestamps irrelevant.
    const leaves = ix.leaves.map((commitment) => ({ commitment, t0: 0 }));
    return buildAssociationSet({ leaves, excluded, maturationSeconds: 0, asOf: 0 });
  }
  const asOf = ctx.asOf ?? 0;
  const leaves = ix.leaves.map((commitment, i) => ({ commitment, t0: ctx.leafTimestamps?.[i] ?? 0 }));
  return buildAssociationSet({ leaves, excluded, maturationSeconds, asOf });
}

/// Prove an unshield: withdraw `note`'s full value to `to`, paying `fee` to
/// `feeRecipient` (fee 0 / feeRecipient == to for a direct, relayer-less withdrawal).
/// payout + fee must equal the note's value (enforced in-circuit).
///
/// The membership witness (merkle_root_pub / path) is the full commitment tree; the association witness
/// (association_root / assoc_index / assoc_path) comes from the D4 association set. Pass `opts.association`
/// when you have one already built (avoids rebuilding); otherwise the testnet identity is used (empty
/// ledger, no maturation → association root == commitment root).
export async function proveUnshield(
  ix: PoolIndexer,
  note: UnshieldNote,
  opts: {
    to: `0x${string}`;
    payoutAmount: bigint;
    fee: bigint;
    feeRecipient: `0x${string}`;
    association?: AssociationSet;
  },
): Promise<UnshieldResult> {
  const [{ generateHonkProof }, { toHex32 }] = await Promise.all([
    import("./prove"),
    import("./field"),
  ]);
  const circuit = (await unshieldCircuit()) as Parameters<typeof generateHonkProof>[0];

  const { root, path } = ix.witness(note.leafIndex);

  // Association witness: prove the note's commitment is in the (matured, non-excluded) association set.
  // Use the on-chain leaf value so the assoc path is for exactly the leaf the membership path proves.
  const commitment = ix.leaves[note.leafIndex];
  if (commitment === undefined) throw new Error(`no leaf at index ${note.leafIndex}`);
  const association = opts.association ?? buildAssociation(ix);
  const assoc = associationWitness(association, commitment);
  if (!assoc) {
    throw new Error(
      "this note is not in the current association set (excluded, or not yet matured) — it cannot be withdrawn",
    );
  }

  const nul = noteNullifier(note.ownerPriv, BigInt(note.leafIndex));
  const leaf = toHex32(BigInt(note.leafIndex));
  const inputs = {
    merkle_root_pub: toHex32(root),
    association_root: toHex32(assoc.root),
    nullifier: toHex32(nul),
    payout_amount: toHex32(opts.payoutAmount),
    payout_address: toHex32(BigInt(opts.to)),
    fee: toHex32(opts.fee),
    fee_recipient: toHex32(BigInt(opts.feeRecipient)),
    asset_id: toHex32(note.assetId),
    value: toHex32(note.value),
    owner_priv: toHex32(note.ownerPriv),
    blinding: toHex32(note.blinding),
    leaf_index: leaf,
    path: path.map(toHex32),
    assoc_index: toHex32(BigInt(assoc.index)),
    assoc_path: assoc.path.map(toHex32),
  };

  const { proof } = await generateHonkProof(circuit, inputs);
  return { proof, root, associationRoot: assoc.root, nullifier: nul };
}
