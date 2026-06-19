"use client";

import MaskIcon from "@/components/MaskIcon";
import Footer from "@/components/Footer";
import ConnectButton from "@/components/web3/ConnectButton";
import MintRedeemCard from "@/components/app/MintRedeemCard";
import ShieldedPanel from "@/components/app/ShieldedPanel";

export default function AppPage() {
  return (
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
            Base Sepolia · testnet preview
          </div>
          <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Your private dollar
          </h1>
          <p className="mt-2 max-w-xl text-[0.95rem] leading-relaxed text-ink-muted">
            Mint USDM 1:1 against USDC, redeem any time, and shield it into a private balance. Backed
            1:1, non-custodial, immutable.
          </p>

          <div className="mt-9 grid items-start gap-6 md:grid-cols-2">
            <MintRedeemCard />
            <ShieldedPanel />
          </div>

          <p className="mt-8 max-w-2xl text-[0.74rem] leading-relaxed text-ink-dim">
            Design-stage preview — unaudited and not deployed to mainnet. Testnet contract addresses are
            wired in as they ship. Nothing here is financial advice or an offer.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
