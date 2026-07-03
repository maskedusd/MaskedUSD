"use client";

import { useCallback, useEffect, useState } from "react";
import { useAccount, useChainId, usePublicClient } from "wagmi";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ArrowUpFromLine,
  ExternalLink,
  Flame,
  Loader2,
  Lock,
  RotateCw,
  Shield,
  Sparkles,
} from "lucide-react";
import { addressesFor, rampsLive, POOL_DEPLOY_BLOCK } from "@/lib/contracts";
import { loadHistory, type HistoryItem, type HistoryKind } from "@/lib/history";
import { makeLogsClient } from "@/lib/rpc";
import { displayUnits, truncateAddress } from "@/lib/format";
import { explorerTxUrl } from "@/lib/explorer";
import { useIdentity } from "@/components/web3/IdentityProvider";
import { loadNotes, type StoredNote } from "@/lib/shielded/store";

/**
 * HistoryPanel — the /app/history body. Two honest sections:
 *  1. On-chain activity — mints, redeems, shields, withdrawals, and public USDM transfers, derived
 *     live from Transfer logs (see src/lib/history.ts). No database; the chain is the log.
 *  2. Private activity — from the user's own ENCRYPTED LOCAL note store (received / spent notes).
 *     Private transfers never touch the public ledger, so this exists only in this browser and
 *     only unlocks with the user's identity signature. We do not (and cannot) log it server-side.
 */

const KIND_META: Record<HistoryKind, { label: string; icon: typeof Shield; sign: "+" | "−" | "" }> = {
  mint: { label: "Minted", icon: Sparkles, sign: "+" },
  redeem: { label: "Redeemed", icon: Flame, sign: "−" },
  shield: { label: "Shielded", icon: Shield, sign: "−" },
  withdraw: { label: "Withdrew", icon: ArrowUpFromLine, sign: "+" },
  sent: { label: "Sent", icon: ArrowUpRight, sign: "−" },
  received: { label: "Received", icon: ArrowDownLeft, sign: "+" },
};

function fmtDate(unix: number): string {
  if (!unix) return "—";
  return new Date(unix * 1000).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Row({
  icon: Icon,
  title,
  detail,
  amount,
  when,
  txHash,
  chainId,
}: {
  icon: typeof Shield;
  title: string;
  detail?: string;
  amount: string;
  when: string;
  txHash?: string;
  chainId: number;
}) {
  const url = explorerTxUrl(chainId, txHash);
  return (
    <li className="flex items-center gap-3.5 px-5 py-4">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent-soft">
        <Icon className="h-4 w-4 text-accent-deep" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[0.9rem] font-medium text-ink">{title}</p>
        <p className="truncate text-[0.74rem] text-ink-dim">
          {when}
          {detail ? ` · ${detail}` : ""}
        </p>
      </div>
      <span className="shrink-0 font-mono text-[0.88rem] text-ink">{amount}</span>
      {url ? (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="View transaction on Basescan"
          className="shrink-0 rounded-lg border border-ink/10 p-1.5 text-ink-dim transition-colors hover:border-accent/40 hover:text-ink"
        >
          <ExternalLink size={12} aria-hidden="true" />
        </a>
      ) : (
        <span className="w-[27px] shrink-0" aria-hidden="true" />
      )}
    </li>
  );
}

export default function HistoryPanel() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const addrs = addressesFor(chainId);
  const live = rampsLive(addrs);
  const { identity, locked, unlock, unlocking } = useIdentity();

  const [items, setItems] = useState<HistoryItem[] | null>(null);
  const [notes, setNotes] = useState<StoredNote[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!address || !publicClient || !live) return;
    setLoading(true);
    setError(null);
    try {
      // Log scans need a wide-getLogs-range endpoint (public), not the general premium transport.
      const list = await loadHistory(makeLogsClient(chainId), address, addrs!, POOL_DEPLOY_BLOCK[chainId] ?? 0n);
      setItems(list);
    } catch {
      setError("Couldn't load on-chain history — the RPC may be busy. Try refresh.");
    } finally {
      setLoading(false);
    }
  }, [address, publicClient, live, addrs, chainId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Private activity — decryptable only with the unlocked identity; stays in this browser.
  useEffect(() => {
    let stale = false;
    (async () => {
      if (!address || !identity) {
        setNotes([]);
        return;
      }
      try {
        const n = await loadNotes(chainId, address, identity.custodyKey);
        if (!stale) setNotes(n);
      } catch {
        if (!stale) setNotes([]);
      }
    })();
    return () => {
      stale = true;
    };
  }, [address, chainId, identity]);

  if (!isConnected) return null;

  const privateRows = [...notes].sort((a, b) => b.createdAt - a.createdAt);

  return (
    <div className="space-y-8">
      {/* ── On-chain activity ─────────────────────────────────────────────── */}
      <section className="rounded-3xl border border-ink/10 bg-surface shadow-xl shadow-accent/5">
        <div className="flex items-center justify-between px-5 pb-1 pt-5">
          <div>
            <h2 className="font-display text-lg font-semibold text-ink">On-chain activity</h2>
            <p className="text-[0.74rem] text-ink-dim">
              Mints, redemptions, shields, and public transfers — read live from Base.
            </p>
          </div>
          <button
            type="button"
            onClick={refresh}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-full border border-ink/10 px-3 py-1.5 text-[0.76rem] font-medium text-ink-muted transition-colors hover:border-accent/40 hover:text-ink disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCw size={13} />}
            Refresh
          </button>
        </div>

        {!live ? (
          <p className="px-5 pb-6 pt-3 text-[0.85rem] text-ink-muted">
            Not deployed on this network — switch to Base to see your history.
          </p>
        ) : loading && items === null ? (
          <div className="flex items-center gap-2.5 px-5 pb-6 pt-3 text-[0.85rem] text-ink-muted">
            <Loader2 className="h-4 w-4 animate-spin text-accent-deep" />
            Scanning the chain…
          </div>
        ) : error ? (
          <p className="px-5 pb-6 pt-3 text-[0.85rem] text-ink-muted">{error}</p>
        ) : items && items.length === 0 ? (
          <p className="px-5 pb-6 pt-3 text-[0.85rem] text-ink-muted">
            No activity yet — mint some USDM on the dashboard and it shows up here.
          </p>
        ) : (
          <ul className="mt-2 divide-y divide-ink/[0.05]">
            {items?.map((it) => {
              const meta = KIND_META[it.kind];
              const detail =
                it.kind === "sent" || it.kind === "received"
                  ? truncateAddress(it.counterparty)
                  : it.kind === "shield" || it.kind === "withdraw"
                    ? "Shielded pool"
                    : it.kind === "mint"
                      ? "USDC deposited 1:1"
                      : "USDC released 1:1";
              return (
                <Row
                  key={`${it.txHash}-${it.kind}-${it.blockNumber}`}
                  icon={meta.icon}
                  title={`${meta.label} USDM`}
                  detail={detail}
                  amount={`${meta.sign}${displayUnits(it.amount)}`}
                  when={fmtDate(it.timestamp)}
                  txHash={it.txHash}
                  chainId={chainId}
                />
              );
            })}
          </ul>
        )}
      </section>

      {/* ── Private activity (local) ──────────────────────────────────────── */}
      <section className="rounded-3xl border border-ink/10 bg-surface shadow-xl shadow-accent/5">
        <div className="px-5 pb-1 pt-5">
          <h2 className="font-display text-lg font-semibold text-ink">Private activity</h2>
          <p className="text-[0.74rem] text-ink-dim">
            Your shielded notes — stored encrypted in this browser only. Private transfers never
            appear on the public ledger, and we keep no server-side copy.
          </p>
        </div>

        {locked ? (
          <div className="px-5 pb-6 pt-3">
            <button
              type="button"
              onClick={unlock}
              disabled={unlocking}
              className="inline-flex items-center gap-2 rounded-2xl bg-accent px-5 py-2.5 text-[0.85rem] font-semibold text-white transition hover:bg-accent-deep disabled:opacity-60"
            >
              {unlocking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock size={14} />}
              {unlocking ? "Check your wallet…" : "Unlock to view"}
            </button>
            <p className="mt-2.5 text-[0.72rem] text-ink-dim">
              One signature — it derives your viewing key locally; nothing is sent on-chain.
            </p>
          </div>
        ) : privateRows.length === 0 ? (
          <p className="px-5 pb-6 pt-3 text-[0.85rem] text-ink-muted">
            No private notes in this browser yet — shield some USDM or receive a private payment.
          </p>
        ) : (
          <ul className="mt-2 divide-y divide-ink/[0.05]">
            {privateRows.map((n) => (
              <Row
                key={n.commitment}
                icon={n.received ? ArrowDownLeft : Shield}
                title={
                  n.received
                    ? "Received privately"
                    : n.status === "spent"
                      ? "Note spent (sent or withdrawn)"
                      : n.change
                        ? "Change from a private send"
                        : "Shielded note"
                }
                detail={n.status === "spent" ? "spent" : "spendable"}
                amount={`${n.received ? "+" : ""}${displayUnits(BigInt(n.value))}`}
                when={fmtDate(Math.floor(n.createdAt / 1000))}
                txHash={n.txHash}
                chainId={chainId}
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
