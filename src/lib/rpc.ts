import { fallback, http, type Transport } from "viem";
import { base, baseSepolia } from "wagmi/chains";

/**
 * Resilient RPC transports. The app's log-scans (history, note discovery, reconcile) make many
 * eth_getLogs / eth_getBlock calls; a single public endpoint rate-limits (HTTP 429) under that load.
 * Fix, in layers:
 *   1. fallback([...])  — try endpoints in order; on any error (429/5xx/timeout) fail over to the next.
 *   2. { batch: true }  — coalesce concurrent JSON-RPC calls into one HTTP POST, cutting request COUNT
 *                         (the thing that trips rate limits) by an order of magnitude.
 *   3. NEXT_PUBLIC_BASE_RPC — optional premium endpoint (Alchemy/QuickNode/…) tried FIRST when set,
 *                         so adding one env var upgrades reliability everywhere with no code change.
 * Public endpoints are CORS-enabled and support eth_getLogs on Base.
 */

// Only endpoints VERIFIED to serve historical eth_getLogs over a ~2000-block range from the browser
// (the app's heaviest call). Others were dropped after testing: 1rpc caps getLogs at 50 blocks,
// publicnode requires a paid archive token, meowrpc doesn't support getLogs, llamarpc was down.
// The durable fix is a premium endpoint in NEXT_PUBLIC_BASE_RPC (Alchemy/QuickNode) — tried first.
const BASE_RPCS = [
  process.env.NEXT_PUBLIC_BASE_RPC, // optional premium, first if present
  "https://mainnet.base.org",
  "https://base.drpc.org",
].filter((u): u is string => typeof u === "string" && u.length > 0);

const BASE_SEPOLIA_RPCS = [
  process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC,
  "https://sepolia.base.org",
  "https://base-sepolia-rpc.publicnode.com",
].filter((u): u is string => typeof u === "string" && u.length > 0);

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
