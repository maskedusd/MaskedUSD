import type { NextConfig } from "next";

// COOP/COEP cross-origin isolation enables SharedArrayBuffer, which bb.js's WASM
// proving uses. Scope it tightly to the proving routes so site-wide isolation
// doesn't break the marketing pages' cross-origin assets or the wallet-connect
// popups on /app. (Single-thread proving works without it, but isolation is the
// safe default where proving runs.)
// Cross-origin isolation (-> SharedArrayBuffer, which bb.js's WASM proving uses).
// COEP *credentialless* rather than require-corp: it still isolates the document
// (SAB available) but lets subresources — the Turbopack-bundled bb.js worker chunk
// + the WASM it loads — load WITHOUT a CORP header (it only strips credentials from
// cross-origin loads). require-corp blocked the worker chunk because Next serves
// /_next/static/* without CORP and headers() can't reach those internal paths.
// Scoped to the proving route so the marketing pages + /app wallet-connect popups
// keep working un-isolated.
const ISOLATION = [
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Embedder-Policy", value: "credentialless" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      { source: "/proving-probe", headers: ISOLATION },
      { source: "/proving-probe/:path*", headers: ISOLATION },
    ];
  },
};

export default nextConfig;
