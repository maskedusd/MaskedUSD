"use client";

import { useEffect, useRef, useState } from "react";
import { useAccount, useChainId, useDisconnect, useSwitchChain } from "wagmi";
import { base } from "wagmi/chains";
import { useRouter } from "next/navigation";
import { Check, ChevronDown, Copy, ExternalLink, LogOut } from "lucide-react";
import { truncateAddress } from "@/lib/format";
import { explorerAddressUrl } from "@/lib/explorer";

/// Header account control. Disconnected → renders nothing (the WalletGate overlay handles connecting).
/// Connected → a wallet button that opens a dropdown: full address (copyable), View on BaseScan, and a
/// red Disconnect that fully disconnects, flashes a toast, and returns to the landing page.
export default function ConnectButton() {
  const { address, isConnected, chain } = useAccount();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  if (!isConnected || !address) return null;

  // mainnet-live: anything other than Base is "wrong network"
  const wrongNetwork = chain != null && chainId !== base.id;

  async function copyAddress() {
    try {
      await navigator.clipboard.writeText(address!);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked — no-op */
    }
  }

  function handleDisconnect() {
    setOpen(false);
    disconnect();
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("maskedusd:flash", { detail: "Wallet disconnected" }));
    }
    router.push("/");
  }

  return (
    <div ref={ref} className="relative flex items-center gap-2">
      {wrongNetwork && (
        <button
          type="button"
          onClick={() => switchChain({ chainId: base.id })}
          className="rounded-full border border-amber-400/40 bg-amber-50 px-3 py-1.5 text-[0.78rem] font-medium text-amber-700 transition hover:bg-amber-100"
        >
          Switch to Base
        </button>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 rounded-full border border-ink/10 bg-surface px-3.5 py-1.5 text-[0.82rem] font-medium text-ink transition hover:bg-accent-soft"
      >
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
        <span className="font-mono">{truncateAddress(address)}</span>
        <ChevronDown className={`h-3.5 w-3.5 text-ink-dim transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-72 overflow-hidden rounded-2xl border border-ink/10 bg-surface p-2 shadow-xl shadow-accent/10">
          <p className="px-2 pb-1 pt-1 font-mono text-[0.64rem] uppercase tracking-[0.16em] text-ink-dim">
            {chain?.name ?? "Connected"}
          </p>

          {/* full address + copy */}
          <button
            type="button"
            onClick={copyAddress}
            className="flex w-full items-start gap-2 rounded-xl px-2 py-2 text-left transition hover:bg-accent-soft"
          >
            <span className="break-all font-mono text-[0.74rem] leading-snug text-ink">{address}</span>
            <span className="mt-0.5 shrink-0 text-ink-dim">
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
            </span>
          </button>

          <a
            href={explorerAddressUrl(chainId, address)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 flex items-center gap-2 rounded-xl px-2.5 py-2 text-[0.85rem] text-ink transition hover:bg-accent-soft"
          >
            <ExternalLink className="h-3.5 w-3.5 text-ink-muted" />
            View on BaseScan
          </a>

          <button
            type="button"
            onClick={handleDisconnect}
            className="mt-1 flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-[0.85rem] font-medium text-red-600 transition hover:bg-red-50"
          >
            <LogOut className="h-3.5 w-3.5" />
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
}
