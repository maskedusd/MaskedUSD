"use client";

import type { ReactNode } from "react";
import { useAccount, useSwitchChain } from "wagmi";
import { base, baseSepolia } from "wagmi/chains";
import { addressesFor, rampsLive } from "@/lib/contracts";

/// A single contextual banner above the dApp cards: connect prompt, unsupported-network warning, or a
/// pre-deploy preview notice. Returns null when everything is ready.
export default function NetworkNotice() {
  // useAccount().chainId is the chain the WALLET is actually on — including chains we never
  // configured (Ethereum mainnet, etc.). useChainId() would silently report the config default
  // (Base) in that case, which is exactly how a wrong-network tx once slipped through unnoticed.
  const { isConnected, chainId } = useAccount();
  const { switchChain } = useSwitchChain();

  if (!isConnected) {
    return <Banner tone="info">Connect your wallet to mint, redeem, and shield USDM.</Banner>;
  }

  const supported = chainId === base.id || chainId === baseSepolia.id;
  if (!supported) {
    return (
      <Banner tone="warn">
        <span>Unsupported network.</span>
        <button
          type="button"
          onClick={() => switchChain({ chainId: base.id })}
          className="font-medium underline underline-offset-2"
        >
          Switch to Base
        </button>
      </Banner>
    );
  }

  if (!rampsLive(addressesFor(chainId!))) {
    return (
      <Banner tone="info">
        MaskedUSD is not deployed on this network yet — this is a preview. Mint and redeem activate the
        moment contracts ship.
      </Banner>
    );
  }

  return null;
}

function Banner({ tone, children }: { tone: "info" | "warn"; children: ReactNode }) {
  const styles =
    tone === "warn"
      ? "border-amber-400/40 bg-amber-50 text-amber-800"
      : "border-accent/20 bg-accent-soft text-accent-deep";
  return (
    <div className={`flex flex-wrap items-center gap-x-2 gap-y-1 rounded-2xl border px-4 py-3 text-[0.85rem] ${styles}`}>
      {children}
    </div>
  );
}
