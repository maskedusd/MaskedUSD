import { parseAbiItem } from "viem";
import type { Addresses } from "./contracts";

/**
 * On-chain USDM history for one account, derived entirely from ERC-20 Transfer logs — no database,
 * no indexer service. The chain already is the log:
 *   mint      = Transfer(0x0 → user)            (MintRamp minted against a USDC deposit)
 *   redeem    = Transfer(user → 0x0)            (RedeemRamp burned; USDC released)
 *   shield    = Transfer(user → pool)           (USDM moved into the shielded pool)
 *   withdraw  = Transfer(pool → user)           (a shielded note unshielded back to public USDM)
 *   sent      = Transfer(user → other)          (plain public USDM transfer out)
 *   received  = Transfer(other → user)          (plain public USDM transfer in)
 * Private in-pool transfers are deliberately NOT here — they never touch the public ledger; the
 * history UI surfaces those from the user's own encrypted local note store instead.
 */

export const TRANSFER_EVENT = parseAbiItem(
  "event Transfer(address indexed from, address indexed to, uint256 value)",
);

export type HistoryKind = "mint" | "redeem" | "shield" | "withdraw" | "sent" | "received";

export interface HistoryItem {
  kind: HistoryKind;
  amount: bigint;
  /** the non-user side of the transfer (zero address for mint/redeem) */
  counterparty: `0x${string}`;
  txHash: `0x${string}`;
  blockNumber: bigint;
  /** unix seconds */
  timestamp: number;
}

const ZERO_ADDR = "0x0000000000000000000000000000000000000000";
// Public RPCs cap eth_getLogs ranges (Base's default is 2000 blocks) — scan in chunks.
const LOG_RANGE = 1999n;

interface TransferLog {
  args: { from?: `0x${string}`; to?: `0x${string}`; value?: bigint };
  transactionHash: `0x${string}` | null;
  blockNumber: bigint | null;
  logIndex: number | null;
}

interface HistoryReader {
  getBlockNumber: () => Promise<bigint>;
  getLogs: (a: {
    address: `0x${string}`;
    event: typeof TRANSFER_EVENT;
    args: { from?: `0x${string}` } | { to?: `0x${string}` };
    fromBlock: bigint;
    toBlock: bigint;
  }) => Promise<TransferLog[]>;
  getBlock: (a: { blockNumber: bigint }) => Promise<{ timestamp: bigint }>;
}

/** Fetch every USDM Transfer touching `user` (both directions), chunked under the RPC range cap. */
async function fetchUserTransfers(
  client: HistoryReader,
  token: `0x${string}`,
  user: `0x${string}`,
  fromBlock: bigint,
): Promise<TransferLog[]> {
  const head = await client.getBlockNumber();
  const out: TransferLog[] = [];
  for (let start = fromBlock; start <= head; start += LOG_RANGE + 1n) {
    const end = start + LOG_RANGE < head ? start + LOG_RANGE : head;
    const [sent, recv] = await Promise.all([
      client.getLogs({ address: token, event: TRANSFER_EVENT, args: { from: user }, fromBlock: start, toBlock: end }),
      client.getLogs({ address: token, event: TRANSFER_EVENT, args: { to: user }, fromBlock: start, toBlock: end }),
    ]);
    out.push(...sent, ...recv);
  }
  // A self-transfer would appear in both scans — dedupe by (tx, logIndex).
  const seen = new Set<string>();
  return out.filter((l) => {
    const k = `${l.transactionHash}:${l.logIndex}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

function classify(log: TransferLog, user: string, addrs: Addresses): HistoryItem | null {
  const from = (log.args.from ?? ZERO_ADDR).toLowerCase();
  const to = (log.args.to ?? ZERO_ADDR).toLowerCase();
  const me = user.toLowerCase();
  const pool = addrs.pool.toLowerCase();
  if (log.transactionHash === null || log.blockNumber === null) return null;

  let kind: HistoryKind;
  let counterparty: string;
  if (from === ZERO_ADDR && to === me) {
    kind = "mint";
    counterparty = ZERO_ADDR;
  } else if (from === me && to === ZERO_ADDR) {
    kind = "redeem";
    counterparty = ZERO_ADDR;
  } else if (from === me && to === pool) {
    kind = "shield";
    counterparty = addrs.pool;
  } else if (from === pool && to === me) {
    kind = "withdraw";
    counterparty = addrs.pool;
  } else if (from === me) {
    kind = "sent";
    counterparty = log.args.to ?? ZERO_ADDR;
  } else {
    kind = "received";
    counterparty = log.args.from ?? ZERO_ADDR;
  }

  return {
    kind,
    amount: log.args.value ?? 0n,
    counterparty: counterparty as `0x${string}`,
    txHash: log.transactionHash,
    blockNumber: log.blockNumber,
    timestamp: 0, // filled in below
  };
}

/** Build the account's full public USDM history, newest first, with block timestamps resolved. */
export async function loadHistory(
  client: HistoryReader,
  user: `0x${string}`,
  addrs: Addresses,
  fromBlock: bigint,
): Promise<HistoryItem[]> {
  const logs = await fetchUserTransfers(client, addrs.usdm, user, fromBlock);
  const items = logs
    .map((l) => classify(l, user, addrs))
    .filter((x): x is HistoryItem => x !== null);

  // Resolve timestamps once per unique block (history volumes are small; this stays cheap).
  const blocks = [...new Set(items.map((i) => i.blockNumber))];
  const stamps = new Map<bigint, number>();
  await Promise.all(
    blocks.map(async (bn) => {
      const b = await client.getBlock({ blockNumber: bn });
      stamps.set(bn, Number(b.timestamp));
    }),
  );
  for (const i of items) i.timestamp = stamps.get(i.blockNumber) ?? 0;

  items.sort((a, b) => b.timestamp - a.timestamp || Number(b.blockNumber - a.blockNumber));
  return items;
}
