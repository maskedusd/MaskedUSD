"use client";

import { useState } from "react";
import { useAccount, useChainId, usePublicClient, useWriteContract } from "wagmi";
import { SHIELDED_POOL_ABI, addressesFor, poolLive } from "@/lib/contracts";
import { useToast } from "@/components/web3/Toaster";

/// Guardian-only card (left column): accept the pool's current root as the association root so
/// shielded notes can be withdrawn. Renders nothing for everyone else — the guardian address is
/// public per-chain config, so this gates display only; the contract enforces the real authority.
export default function OperatorCard() {
  const { address } = useAccount();
  const chainId = useChainId();
  const addrs = addressesFor(chainId);
  const live = poolLive(addrs);
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();
  const toast = useToast();
  const [accepting, setAccepting] = useState(false);

  const isGuardian =
    !!address && !!addrs?.guardian && address.toLowerCase() === addrs.guardian.toLowerCase();
  if (!isGuardian || !live || !publicClient) return null;

  async function acceptCurrentRoot() {
    if (accepting) return;
    setAccepting(true);
    const tid = toast.show({ status: "pending", title: "Accepting association root", description: "Confirm in your wallet" });
    try {
      const root = (await publicClient!.readContract({
        address: addrs!.pool,
        abi: SHIELDED_POOL_ABI,
        functionName: "currentRoot",
      })) as bigint;
      const hash = await writeContractAsync({
        chainId,
        address: addrs!.pool,
        abi: SHIELDED_POOL_ABI,
        functionName: "acceptAssociationRoot",
        args: [root],
      });
      toast.update(tid, { description: "Submitted", hash, chainId });
      await publicClient!.waitForTransactionReceipt({ hash });
      toast.update(tid, { status: "success", title: "Association root accepted", description: "Withdrawals are open for the current root." });
    } catch (e) {
      const msg = (e as { shortMessage?: string })?.shortMessage ?? "rejected";
      toast.update(tid, { status: "error", title: "Accept failed", description: msg });
    } finally {
      setAccepting(false);
    }
  }

  return (
    <div className="w-full max-w-md rounded-3xl border border-ink/10 bg-surface p-6 shadow-xl shadow-accent/5">
      <p className="font-mono text-[0.64rem] uppercase tracking-[0.16em] text-ink-dim">Operator</p>
      <p className="mt-2 text-[0.8rem] leading-relaxed text-ink-muted">
        Accept the current association root so shielded notes can be withdrawn.
      </p>
      <button
        type="button"
        onClick={acceptCurrentRoot}
        disabled={accepting}
        className="mt-3 w-full rounded-xl border border-accent/30 bg-accent-soft py-2.5 text-[0.85rem] font-medium text-accent-deep transition hover:bg-accent/15 disabled:opacity-50"
      >
        {accepting ? "Accepting…" : "Accept current root"}
      </button>
    </div>
  );
}
