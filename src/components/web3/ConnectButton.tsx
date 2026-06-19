"use client";

import { useEffect, useRef, useState } from "react";
import { useAccount, useConnect, useDisconnect, useChainId, useSwitchChain } from "wagmi";
import { baseSepolia } from "wagmi/chains";
import { truncateAddress } from "@/lib/format";

const DEFAULT_CHAIN = baseSepolia.id;

/// Wallet connect / account control for the dApp header. Lists the configured connectors when
/// disconnected; shows a truncated address + a network-switch nudge when connected.
export default function ConnectButton() {
  const { address, isConnected, chain } = useAccount();
  const { connectors, connect, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const wrongNetwork = isConnected && chain && chainId !== DEFAULT_CHAIN && chainId !== chain.id;

  if (!isConnected) {
    return (
      <div ref={ref} className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-1.5 text-[0.82rem] font-medium text-white transition hover:bg-accent-deep"
        >
          Connect wallet
        </button>
        {open && (
          <div className="absolute right-0 mt-2 w-52 overflow-hidden rounded-2xl border border-ink/10 bg-surface p-1.5 shadow-lg shadow-accent/10">
            {connectors.map((c) => (
              <button
                key={c.uid}
                type="button"
                disabled={isPending}
                onClick={() => {
                  connect({ connector: c });
                  setOpen(false);
                }}
                className="flex w-full items-center rounded-xl px-3 py-2 text-left text-[0.85rem] text-ink transition hover:bg-accent-soft disabled:opacity-50"
              >
                {c.name}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div ref={ref} className="relative flex items-center gap-2">
      {wrongNetwork && (
        <button
          type="button"
          onClick={() => switchChain({ chainId: baseSepolia.id })}
          className="rounded-full border border-amber-400/40 bg-amber-50 px-3 py-1.5 text-[0.78rem] font-medium text-amber-700 transition hover:bg-amber-100"
        >
          Switch to Base Sepolia
        </button>
      )}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 rounded-full border border-ink/10 bg-surface px-3.5 py-1.5 text-[0.82rem] font-medium text-ink transition hover:bg-accent-soft"
      >
        <span className="status-dot inline-block h-1.5 w-1.5 rounded-full bg-accent" />
        <span className="font-mono">{truncateAddress(address)}</span>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-44 overflow-hidden rounded-2xl border border-ink/10 bg-surface p-1.5 shadow-lg shadow-accent/10">
          <div className="px-3 py-1.5 text-[0.72rem] uppercase tracking-wide text-ink-dim">
            {chain?.name ?? "Unknown network"}
          </div>
          <button
            type="button"
            onClick={() => {
              disconnect();
              setOpen(false);
            }}
            className="flex w-full items-center rounded-xl px-3 py-2 text-left text-[0.85rem] text-ink transition hover:bg-accent-soft"
          >
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
}
