"use client";

import { useConnect } from "wagmi";
import { Loader2 } from "lucide-react";
import MaskIcon from "@/components/MaskIcon";

// Real brand icons (downloaded to /public/wallets), matched to the configured connectors by id/name.
const WALLETS = [
  { label: "MetaMask", icon: "/wallets/metamask.svg", match: "metamask" },
  { label: "Coinbase Wallet", icon: "/wallets/coinbase.svg", match: "coinbase" },
  { label: "Phantom", icon: "/wallets/phantom.svg", match: "phantom" },
];

export default function WalletConnectModal() {
  const { connectors, connect, isPending, error } = useConnect();

  return (
    <div className="w-[min(92vw,23rem)] rounded-3xl border border-ink/10 bg-surface p-6 shadow-2xl shadow-accent/20">
      <div className="mb-1.5 flex items-center gap-2.5">
        <MaskIcon width={28} className="shrink-0" />
        <span className="font-display text-lg font-semibold text-ink">Connect a wallet</span>
      </div>
      <p className="mb-5 text-[0.85rem] leading-relaxed text-ink-muted">
        Connect to access the dashboard. Your keys never leave your wallet.
      </p>

      <div className="space-y-2">
        {WALLETS.map((w) => {
          const connector = connectors.find(
            (c) => c.id.toLowerCase().includes(w.match) || c.name.toLowerCase().includes(w.match),
          );
          return (
            <button
              key={w.label}
              type="button"
              disabled={!connector || isPending}
              onClick={() => connector && connect({ connector })}
              className="flex w-full items-center gap-3 rounded-2xl border border-ink/10 bg-bg px-4 py-3 text-left transition hover:border-accent/40 hover:bg-accent-soft disabled:cursor-not-allowed disabled:opacity-50"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={w.icon} alt="" width={28} height={28} className="h-7 w-7 shrink-0 rounded-lg" />
              <span className="text-[0.92rem] font-medium text-ink">{w.label}</span>
              {isPending && <Loader2 className="ml-auto h-4 w-4 animate-spin text-accent" />}
            </button>
          );
        })}
      </div>

      {error && (
        <p className="mt-3 text-center text-[0.78rem] text-red-500">
          {/not found|not detected|no provider|getProvider/i.test(error.message)
            ? "Wallet not detected — make sure it's installed and unlocked."
            : (error as { shortMessage?: string }).shortMessage ?? "Couldn't connect — try again."}
        </p>
      )}

      <p className="mt-4 text-center text-[0.7rem] leading-relaxed text-ink-dim">
        MaskedUSD runs on Base. Don&apos;t have a wallet? Install MetaMask, Coinbase Wallet, or
        Phantom.
      </p>
    </div>
  );
}
