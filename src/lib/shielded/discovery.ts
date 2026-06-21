// Receiver-side note discovery (Stage F). Scan the NoteMemo `Note` events, trial-decrypt each with our
// viewing key (a 1-byte view-tag skips ~255/256 foreign memos before any AEAD work), reconstruct the
// note's commitment under OUR spend key, and match it against the pool tree to recover the leaf index.
// What survives is a note we were paid and can now spend or withdraw.
//
// Pure (no network): the caller fetches NoteMemo logs (chunked getLogs) and passes them in, exactly
// like the pool indexer. SSR-safe — no bb.js.

import { decodeEventLog, hexToBytes, parseAbiItem } from "viem";
import type { RawLog } from "./events";
import type { PoolIndexer } from "./indexer";
import { tryDecryptNote } from "./noteCrypto";
import { commitment as noteCommitment, ownerPubKey } from "./notes";

const NOTE_EVENT = parseAbiItem("event Note(uint256 indexed commitment, bytes ciphertext)");

export interface DecodedMemo {
  commitment: bigint;
  ciphertext: Uint8Array;
}

/// Decode raw NoteMemo logs into {commitment, ciphertext}, dropping anything that isn't a Note event.
export function decodeMemoLogs(logs: readonly RawLog[]): DecodedMemo[] {
  const out: DecodedMemo[] = [];
  for (const log of logs) {
    try {
      const { args } = decodeEventLog({
        abi: [NOTE_EVENT],
        data: log.data,
        topics: log.topics as [signature: `0x${string}`, ...args: `0x${string}`[]],
      });
      const a = args as { commitment: bigint; ciphertext: `0x${string}` };
      out.push({ commitment: a.commitment, ciphertext: hexToBytes(a.ciphertext) });
    } catch {
      /* foreign / malformed log — skip */
    }
  }
  return out;
}

/// A note we've been paid, recovered from a memo and located in the pool tree. `ownerPriv` is our own
/// spendPriv — only we can spend it.
export interface DiscoveredNote {
  value: bigint;
  ownerPriv: bigint;
  blinding: bigint;
  assetId: bigint;
  commitment: bigint;
  leafIndex: number;
}

/// From decoded memos, recover the notes addressed to us (spendPriv) that are present in the tree `ix`.
/// A memo only yields a note if it decrypts AND the commitment it reconstructs under our spend key
/// equals the memo's indexed commitment (so a memo can't trick us into tracking a note we can't spend)
/// AND that commitment is actually in the pool (confirmed on-chain).
export function discoverReceivedNotes(
  memos: readonly DecodedMemo[],
  ix: PoolIndexer,
  encPriv: Uint8Array,
  spendPriv: bigint,
): DiscoveredNote[] {
  const myPub = ownerPubKey(spendPriv);
  const out: DiscoveredNote[] = [];
  const seen = new Set<bigint>();
  for (const m of memos) {
    const payload = tryDecryptNote(encPriv, m.ciphertext, m.commitment);
    if (!payload) continue; // not ours, or tampered
    const reconstructed = noteCommitment(payload.value, myPub, payload.blinding, payload.assetId);
    if (reconstructed !== m.commitment) continue; // memo's commitment isn't owned by our spend key
    if (seen.has(reconstructed)) continue;
    const leafIndex = ix.leaves.indexOf(reconstructed);
    if (leafIndex < 0) continue; // not yet confirmed in the pool
    seen.add(reconstructed);
    out.push({
      value: payload.value,
      ownerPriv: spendPriv,
      blinding: payload.blinding,
      assetId: payload.assetId,
      commitment: reconstructed,
      leafIndex,
    });
  }
  return out;
}
