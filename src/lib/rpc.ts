import { createPublicClient, fallback, http, type Transport } from "viem";
import { base, baseSepolia } from "wagmi/chains";

/**
 * RPC transports, split by call type — because no single Base endpoint is good at everything:
 *
 *  • GENERAL calls (balances, receipts, reads, writes, the frequent 15s poll's block reads) →
 *    `transports` below. Alchemy first when NEXT_PUBLIC_BASE_RPC is set (high limits kill the 429s
 *    those bursty calls caused), then public fallbacks. NOTE: Alchemy's free tier caps eth_getLogs
 *    at a 10-block range, so log scans must NOT use this transport.
 *
 *  • LOG SCANS (eth_getLogs over ~2000-block chunks: history, note discovery, reconcile) →
 *    `makeLogsClient()`. Only endpoints verified to serve a wide getLogs range (base.org, drpc).
 *    Excludes Alchemy-free (10-block cap), 1rpc (50-block), publicnode (archive token), meowrpc.
 *
 * All transports batch concurrent JSON-RPC into single POSTs and fail over on error.
 */

const nonEmpty = (u: string | undefined): u is string => typeof u === "string" && u.length > 0;

// General: premium (Alchemy) first when configured, then range-capable publics as fallback.
const BASE_RPCS = [process.env.NEXT_PUBLIC_BASE_RPC, "https://mainnet.base.org", "https://base.drpc.org"].filter(nonEmpty);
const BASE_SEPOLIA_RPCS = [process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC, "https://sepolia.base.org"].filter(nonEmpty);

// Log scans: public endpoints that allow a ~2000-block eth_getLogs range (deliberately no Alchemy).
const BASE_LOG_RPCS = ["https://mainnet.base.org", "https://base.drpc.org"];
const BASE_SEPOLIA_LOG_RPCS = ["https://sepolia.base.org"];

function resilient(urls: string[]): Transport {
  return fallback(
    urls.map((u) => http(u, { batch: { wait: 16 }, retryCount: 2, timeout: 12_000 })),
    { retryCount: 1 },
  );
}

export const baseTransport = resilient(BASE_RPCS);
export const baseSepoliaTransport = resilient(BASE_SEPOLIA_RPCS);

export const transports = {
  [base.id]: baseTransport,
  [baseSepolia.id]: baseSepoliaTransport,
};

const baseLogsTransport = resilient(BASE_LOG_RPCS);
const baseSepoliaLogsTransport = resilient(BASE_SEPOLIA_LOG_RPCS);

/// A viem client dedicated to log scans (getLogs / getBlock / getBlockNumber). Always uses
/// range-capable public endpoints regardless of the premium RPC configured for general calls, so a
/// 10-block-capped premium endpoint can never break a 2000-block chunk scan.
export function makeLogsClient(chainId: number) {
  return chainId === baseSepolia.id
    ? createPublicClient({ chain: baseSepolia, transport: baseSepoliaLogsTransport })
    : createPublicClient({ chain: base, transport: baseLogsTransport });
}
