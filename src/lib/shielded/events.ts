//! viem log decoder — turn raw on-chain logs into the `PoolEvent`s the `PoolIndexer` consumes.
//!
//! The indexer core is decoder-agnostic; this is the thin viem layer that bridges `getLogs()` output
//! to it. Pure (no network): the consumer fetches logs however they like (viem `getLogs`, a subgraph,
//! a checkpoint) and feeds them here. Logs MUST be in on-chain order (block, then logIndex) so the
//! indexer's sequential leaf insert matches the chain — viem returns them ordered.

import { decodeEventLog, parseAbiItem } from "viem";
import { POOL_EVENTS, type PoolEvent } from "./indexer";

const ABI = [
  parseAbiItem(POOL_EVENTS.shield),
  parseAbiItem(POOL_EVENTS.transfer),
  parseAbiItem(POOL_EVENTS.unshield),
] as const;

/// The minimal shape of a log this decoder needs (viem `Log` is a superset).
export interface RawLog {
  topics: readonly `0x${string}`[];
  data: `0x${string}`;
}

/// Decode one log into a `PoolEvent`, or `null` if it isn't a pool event (foreign log / wrong topic).
export function decodePoolLog(log: RawLog): PoolEvent | null {
  let decoded;
  try {
    decoded = decodeEventLog({
      abi: ABI,
      data: log.data,
      topics: log.topics as [signature: `0x${string}`, ...args: `0x${string}`[]],
    });
  } catch {
    return null; // not one of our events (or malformed) — skip
  }
  const a = decoded.args as Record<string, bigint | string>;
  switch (decoded.eventName) {
    case "Shield":
      return {
        type: "shield",
        data: {
          commitment: a.commitment as bigint,
          leafIndex: Number(a.leafIndex as bigint),
          amount: a.amount as bigint,
        },
      };
    case "PrivateTransfer":
      return {
        type: "transfer",
        data: {
          nullifierA: a.nullifierA as bigint,
          nullifierB: a.nullifierB as bigint,
          commitmentA: a.commitmentA as bigint,
          commitmentB: a.commitmentB as bigint,
          leafIndexA: Number(a.leafIndexA as bigint),
          leafIndexB: Number(a.leafIndexB as bigint),
          fee: a.fee as bigint,
        },
      };
    case "Unshield":
      return { type: "unshield", data: { nullifier: a.nullifier as bigint } };
    default:
      return null;
  }
}

/// Decode a batch of logs (in on-chain order), dropping any that aren't pool events.
export function decodePoolLogs(logs: readonly RawLog[]): PoolEvent[] {
  const out: PoolEvent[] = [];
  for (const log of logs) {
    const ev = decodePoolLog(log);
    if (ev) out.push(ev);
  }
  return out;
}
