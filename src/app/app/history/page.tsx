import type { Metadata } from "next";
import Footer from "@/components/Footer";
import AppHeader from "@/components/app/AppHeader";
import WalletGate from "@/components/web3/WalletGate";
import HistoryPanel from "@/components/app/HistoryPanel";

export const metadata: Metadata = {
  // Root template prefixes "MaskedUSD // " → renders "MaskedUSD // History".
  title: "History",
  description: "Your USDM activity — mints, redemptions, shields, withdrawals, and transfers.",
};

export default function HistoryPage() {
  return (
    <WalletGate>
      <div className="flex min-h-screen flex-col bg-bg text-ink">
        <AppHeader />
        <main className="flex-1">
          <div className="mx-auto max-w-5xl px-5 py-12 sm:py-16">
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-ink/10 bg-surface px-3 py-1 text-[0.72rem] font-medium text-ink-muted">
              <span className="status-dot inline-block h-1.5 w-1.5 rounded-full bg-accent" />
              Live on Base
            </div>
            <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              Your history
            </h1>
            <p className="mt-2 max-w-xl text-[0.95rem] leading-relaxed text-ink-muted">
              Every mint, redemption, shield, and transfer — public activity read straight from the
              chain, private activity decrypted only in your browser.
            </p>

            <div className="mt-7">
              <HistoryPanel />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </WalletGate>
  );
}
