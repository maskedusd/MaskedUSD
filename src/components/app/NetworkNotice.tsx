"use client";

import { useEffect, useRef, type ReactNode } from "react";
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
  const { switchChain, isPending: switching } = useSwitchChain();

  const supported = chainId === base.id || chainId === baseSepolia.id;

  // Auto-prompt the wallet to switch to Base as soon as it connects on an unsupported network —
  // the user just approves the wallet's own dialog instead of having to find the banner. Tracked
  // per chain id so someone who REJECTS the prompt isn't spammed on every render; for them the
  // banner below stays as the manual path.
  const promptedFor = useRef<number | null>(null);
  useEffect(() => {
    if (!isConnected) {
      promptedFor.current = null;
      return;
    }
    if (chainId === undefined || supported || promptedFor.current === chainId) return;
    promptedFor.current = chainId;
    switchChain({ chainId: base.id });
  }, [isConnected, chainId, supported, switchChain]);

  if (!isConnected) {
    return <Banner tone="info">Connect your wallet to mint, redeem, and shield USDM.</Banner>;
  }

  if (!supported) {
    return (
      <Banner tone="warn">
        <span>{switching ? "Approve the switch to Base in your wallet…" : "Unsupported network."}</span>
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
