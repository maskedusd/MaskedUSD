import { AlertTriangle } from "lucide-react";

/// Static "good to know" card (left column of /app): the withdrawal-cadence note and the
/// note-secret backup warning — moved out of the shielded panel to balance the two columns.
export default function AppNotices() {
  return (
    <div className="w-full rounded-3xl border border-ink/10 bg-surface p-6 shadow-xl shadow-accent/5">
      <p className="font-mono text-[0.64rem] uppercase tracking-[0.16em] text-ink-dim">Good to know</p>
      <p className="mt-3 text-[0.78rem] leading-relaxed text-ink-muted">
        Withdrawals require the operator to accept the current pool root; a deposit after yours can
        briefly pause exits until it&apos;s re-accepted.
      </p>
      <div className="mt-3 flex gap-2 rounded-2xl border border-dashed border-amber-500/30 bg-amber-500/5 px-4 py-3 text-[0.76rem] leading-relaxed text-ink-muted">
        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" aria-hidden="true" />
        <span>
          Your note secret is your money — it&apos;s encrypted in this browser under your wallet
          signature. Back it up — losing it means losing access to the note. Privacy for normal
          people; not a tool for evading the law.
        </span>
      </div>
    </div>
  );
}
