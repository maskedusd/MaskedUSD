"use client";

// Throwaway de-risk probe: proves a shield circuit entirely client-side inside the
// real Next.js build (NoirJS + bb.js UltraHonk WASM), to confirm the proving stack
// bundles + runs under Next 16 / Turbopack. NOT linked anywhere; remove once the
// real shield UI lands. bb.js is browser-only, so it's lazy-imported inside the
// effect (never at module top) to keep it out of SSR/prerender.

import { useEffect, useState } from "react";

type Probe =
  | { error: string }
  | {
      proveMs: number;
      verifyMs: number;
      verified: boolean;
      proofLen: number;
      publicInputs: string[];
      crossOriginIsolated: boolean;
      hasSAB: boolean;
    };

export const dynamic = "force-dynamic";

export default function ProvingProbe() {
  const [status, setStatus] = useState("starting");
  const [result, setResult] = useState<Probe | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setStatus("loading proving modules");
        const [{ generateHonkProof, verifyHonkProof }, { ownerPubKey, commitment }, { toHex32 }] =
          await Promise.all([
            import("@/lib/shielded/prove"),
            import("@/lib/shielded/notes"),
            import("@/lib/shielded/field"),
          ]);

        setStatus("fetching circuit");
        const shield = await fetch("/circuits/shield.json").then((r) => r.json());

        setStatus("proving (this can take several seconds)");
        const VALUE = 1_000_000n,
          OWNER_PRIV = 42n,
          BLINDING = 7n,
          ASSET_ID = 0n;
        const ownerPub = ownerPubKey(OWNER_PRIV);
        const c = commitment(VALUE, ownerPub, BLINDING, ASSET_ID);
        const inputs = {
          commitment: toHex32(c),
          value: VALUE.toString(),
          asset_id: ASSET_ID.toString(),
          owner_pub: toHex32(ownerPub),
          blinding: BLINDING.toString(),
        };

        const t0 = performance.now();
        const proof = await generateHonkProof(shield, inputs);
        const t1 = performance.now();
        const verified = await verifyHonkProof(shield, proof);
        const t2 = performance.now();

        const out: Probe = {
          proveMs: Math.round(t1 - t0),
          verifyMs: Math.round(t2 - t1),
          verified,
          proofLen: proof.proof.length,
          publicInputs: proof.publicInputs,
          crossOriginIsolated: self.crossOriginIsolated,
          hasSAB: typeof SharedArrayBuffer !== "undefined",
        };
        setResult(out);
        (window as unknown as { __probe: Probe }).__probe = out;
        setStatus("done");
      } catch (e) {
        const err = { error: String((e as Error)?.stack ?? e) };
        setResult(err);
        (window as unknown as { __probe: Probe }).__probe = err;
        setStatus("error");
      }
    })();
  }, []);

  return (
    <main style={{ padding: 24, fontFamily: "monospace", fontSize: 13 }}>
      <h1>shield proving probe</h1>
      <p>status: {status}</p>
      <pre id="probe-result" style={{ whiteSpace: "pre-wrap" }}>
        {result ? JSON.stringify(result, null, 2) : "…"}
      </pre>
    </main>
  );
}
