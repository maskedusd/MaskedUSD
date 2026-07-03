"use client";

import { useChainId, useReadContract } from "wagmi";
import { ERC20_ABI, VAULT_ABI, addressesFor, rampsLive } from "@/lib/contracts";
import { displayUnits } from "@/lib/format";
import Skeleton from "@/components/ui/Skeleton";

/// Proof-of-reserves at a glance: every USDM in existence is backed by an equal USDC balance in the
/// vault. `totalBacking == USDM totalSupply` is the protocol's 1:1 invariant — shown live when the
/// contracts are deployed, as the model statement otherwise.
export default function BackingStrip() {
  const chainId = useChainId();
  const addrs = addressesFor(chainId);
  const live = rampsLive(addrs);

  const backing = useReadContract({
    address: live ? addrs!.vault : undefined,
    abi: VAULT_ABI,
    functionName: "totalBacking",
    query: { enabled: live, refetchInterval: 15_000 },
  });
  const supply = useReadContract({
    address: live ? addrs!.usdm : undefined,
    abi: ERC20_ABI,
    functionName: "totalSupply",
    query: { enabled: live, refetchInterval: 15_000 },
  });

  const matched =
    backing.data !== undefined && supply.data !== undefined && backing.data === supply.data;

  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-2xl border border-ink/10 bg-surface px-5 py-3 text-[0.82rem]">
      <Stat
        label="USDM supply"
        value={live ? `${displayUnits(supply.data)} USDM` : "—"}
        loading={live && supply.isLoading}
      />
      <span className="hidden h-4 w-px bg-ink/10 sm:block" />
      <Stat
        label="USDC backing"
        value={live ? `${displayUnits(backing.data)} USDC` : "—"}
        loading={live && backing.isLoading}
      />
      <span className="hidden h-4 w-px bg-ink/10 sm:block" />
      <div className="flex items-center gap-1.5">
        <span
          className={`inline-block h-1.5 w-1.5 rounded-full ${
            live ? (matched ? "bg-emerald-500" : "bg-amber-500") : "bg-accent"
          }`}
        />
        <span className="text-ink-muted">
          {live ? (matched ? "Backed 1:1" : "Reconciling…") : "Backed 1:1 by design"}
        </span>
      </div>
    </div>
  );
}

function Stat({ label, value, loading }: { label: string; value: string; loading?: boolean }) {
  return (
    <div className="flex flex-col">
      <span className="text-[0.68rem] uppercase tracking-wide text-ink-dim">{label}</span>
      <span className="font-mono text-ink">{loading ? <Skeleton className="h-4 w-20" /> : value}</span>
    </div>
  );
}
