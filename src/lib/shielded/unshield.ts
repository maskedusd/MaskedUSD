// Browser-side unshield: rebuild the commitment tree from on-chain logs, then prove
// the unshield circuit for one note. v1 self-association — the association witness IS
// the commitment-tree membership, so association_root == the commitment root (which
// the guardian must have accepted on-chain before unshield() will succeed).
//
// indexer/events/notes are pure + SSR-safe; prove.ts (bb.js WASM) is lazy-imported.

import { PoolIndexer } from "./indexer";
import { decodePoolLogs, type RawLog } from "./events";
import { nullifier as noteNullifier } from "./notes";

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

/// Fetch all pool logs from `fromBlock` to head, chunked under the RPC's range cap and
/// globally ordered — safe to feed straight into buildIndexer.
export async function fetchPoolLogs(
  client: LogReader,
  pool: `0x${string}`,
  fromBlock: bigint,
): Promise<RawLog[]> {
  const head = await client.getBlockNumber();
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
  root: bigint; // == associationRoot (v1 self-association)
  nullifier: bigint;
}

/// Prove an unshield: withdraw `note`'s full value to `to`, paying `fee` to
/// `feeRecipient` (fee 0 / feeRecipient == to for a direct, relayer-less withdrawal).
/// payout + fee must equal the note's value (enforced in-circuit).
export async function proveUnshield(
  ix: PoolIndexer,
  note: UnshieldNote,
  opts: { to: `0x${string}`; payoutAmount: bigint; fee: bigint; feeRecipient: `0x${string}` },
): Promise<UnshieldResult> {
  const [{ generateHonkProof }, { toHex32 }] = await Promise.all([
    import("./prove"),
    import("./field"),
  ]);
  const circuit = (await unshieldCircuit()) as Parameters<typeof generateHonkProof>[0];

  const { root, path } = ix.witness(note.leafIndex);
  const nul = noteNullifier(note.ownerPriv, BigInt(note.leafIndex));
  const leaf = toHex32(BigInt(note.leafIndex));
  const inputs = {
    merkle_root_pub: toHex32(root),
    association_root: toHex32(root), // v1: pool tree doubles as the association set
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
    assoc_index: leaf,
    assoc_path: path.map(toHex32),
  };

  const { proof } = await generateHonkProof(circuit, inputs);
  return { proof, root, nullifier: nul };
}
