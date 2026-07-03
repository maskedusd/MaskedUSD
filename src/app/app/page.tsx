"use client";

import MaskIcon from "@/components/MaskIcon";
import Footer from "@/components/Footer";
import ConnectButton from "@/components/web3/ConnectButton";
import WalletGate from "@/components/web3/WalletGate";
import MintRedeemCard from "@/components/app/MintRedeemCard";
import ShieldedPanel from "@/components/app/ShieldedPanel";
import BackingStrip from "@/components/app/BackingStrip";
import NetworkNotice from "@/components/app/NetworkNotice";
import OperatorCard from "@/components/app/OperatorCard";
import AppNotices from "@/components/app/AppNotices";

export default function AppPage() {
  return (
    <WalletGate>
    <div className="flex min-h-screen flex-col bg-bg text-ink">
      <header className="glass sticky top-0 z-40 border-b border-ink/5">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3">
          <a href="/" className="flex items-center gap-2">
            <MaskIcon width={26} className="shrink-0" />
            <span className="font-display text-[1.05rem] font-semibold tracking-tight">MaskedUSD</span>
          </a>
          <ConnectButton />
        </div>
      </header>

      <main className="flex-1">
        <div className="mx-auto max-w-5xl px-5 py-12 sm:py-16">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-ink/10 bg-surface px-3 py-1 text-[0.72rem] font-medium text-ink-muted">
            <span className="status-dot inline-block h-1.5 w-1.5 rounded-full bg-accent" />
            Live on Base
          </div>
          <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Your private dollar
          </h1>
          <p className="mt-2 max-w-xl text-[0.95rem] leading-relaxed text-ink-muted">
            Mint USDM 1:1 against USDC, redeem any time, and shield it into a private balance. Backed
            1:1, non-custodial, immutable.
          </p>

          <div className="mt-7 space-y-3">
            <NetworkNotice />
            <BackingStrip />
          </div>

          {/* Left column stacks the public-side cards so the two columns stay visually balanced —
              the shielded panel on the right is tall, so mint/redeem alone left a big blank gap. */}
          <div className="mt-6 grid items-start gap-6 md:grid-cols-2">
            <div className="grid justify-items-stretch gap-6">
              <MintRedeemCard />
              <OperatorCard />
              <AppNotices />
            </div>
            <ShieldedPanel />
          </div>

          <p className="mt-8 max-w-2xl text-[0.74rem] leading-relaxed text-ink-dim">
            Live on Base — immutable, non-custodial contracts, verified on Basescan. Nothing here is
            financial advice or an offer.
          </p>
        </div>
      </main>

      <Footer />
    </div>
    </WalletGate>
  );
}
