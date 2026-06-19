"use client";

import { useChainId } from "wagmi";
import { addressesFor, poolLive } from "@/lib/contracts";

const STEPS = [
  {
    title: "Shield",
    body: "Move public USDM into a private note. Only you hold the note secret — the deposit amount is public, the owner isn't.",
  },
  {
    title: "Send privately",
    body: "Transfer notes with a zero-knowledge proof. Amounts and parties stay private; the proof is generated in your browser.",
  },
  {
    title: "Unshield",
    body: "Withdraw back to public USDM, proving your funds belong to an approved association set — compliant by construction.",
  },
];

/// The shielded flow needs (a) the pool deployed on this chain and (b) in-browser proving (the
/// @maskedusd/sdk NoirJS + bb.js path). Until both land, this panel explains the flow honestly rather
/// than faking an interaction.
export default function ShieldedPanel() {
  const chainId = useChainId();
  const live = poolLive(addressesFor(chainId));

  return (
    <div className="w-full max-w-md rounded-3xl border border-ink/10 bg-surface p-6 shadow-xl shadow-accent/5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold text-ink">Shielded balance</h3>
        <span className="rounded-full bg-accent-soft px-3 py-1 text-[0.72rem] font-medium text-accent-deep">
          {live ? "Live" : "Coming next"}
        </span>
      </div>

      <ol className="space-y-3">
        {STEPS.map((s, i) => (
          <li key={s.title} className="flex gap-3">
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-soft font-mono text-[0.72rem] font-semibold text-accent-deep">
              {i + 1}
            </span>
            <div>
              <p className="text-[0.88rem] font-medium text-ink">{s.title}</p>
              <p className="text-[0.8rem] leading-relaxed text-ink-muted">{s.body}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-5 rounded-2xl border border-dashed border-ink/15 bg-bg px-4 py-3 text-[0.78rem] leading-relaxed text-ink-dim">
        Proofs are generated <span className="font-medium text-ink-muted">on your device</span> — keys
        never leave the browser. Shielding unlocks once the pool is deployed to this network and
        in-browser proving ships. Privacy is for everyday users; this is not a tool for evading the law.
      </div>
    </div>
  );
}
