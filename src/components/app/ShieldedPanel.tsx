"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAccount, useChainId, usePublicClient, useReadContract, useWriteContract } from "wagmi";
import { toHex, parseEventLogs } from "viem";
import { Shield, Loader2, Download, AlertTriangle } from "lucide-react";
import { ERC20_ABI, SHIELDED_POOL_ABI, addressesFor, poolLive } from "@/lib/contracts";
import { displayUnits, fromUnits, isValidAmount, toUnits } from "@/lib/format";
import { createShieldNote, proveShield } from "@/lib/shielded/client";
import { addNote, loadNotes, toStored, updateNote, type StoredNote } from "@/lib/shielded/store";
import { useToast } from "@/components/web3/Toaster";
import Skeleton from "@/components/ui/Skeleton";

type Phase = "idle" | "proving" | "approving" | "shielding";

const short = (hex: string) => `${hex.slice(0, 6)}…${hex.slice(-4)}`;

export default function ShieldedPanel() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const addrs = addressesFor(chainId);
  const live = poolLive(addrs);

  const [amount, setAmount] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [notes, setNotes] = useState<StoredNote[]>([]);

  const { writeContractAsync } = useWriteContract();
  const toast = useToast();

  // local note store (per chain + owner)
  const refreshNotes = useCallback(() => {
    if (address) setNotes(loadNotes(chainId, address));
    else setNotes([]);
  }, [address, chainId]);
  useEffect(() => refreshNotes(), [refreshNotes]);

  const usdmBal = useReadContract({
    address: live ? addrs!.usdm : undefined,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address && live },
  });

  const valid = isValidAmount(amount);
  const amountUnits = valid ? toUnits(amount) : 0n;
  const balance = usdmBal.data;
  const insufficient = valid && balance !== undefined && amountUnits > balance;
  const busy = phase !== "idle";

  const shieldedTotal = useMemo(
    () => notes.filter((n) => n.status !== "spent").reduce((s, n) => s + BigInt(n.value), 0n),
    [notes],
  );

  async function doShield() {
    if (!live || !address || !publicClient || !valid || insufficient) return;
    const tid = toast.show({
      status: "pending",
      title: "Generating proof on your device",
      description: "This runs locally — keys never leave your browser (~5s)",
    });
    try {
      // 1. fresh note — persist the secret IMMEDIATELY (it is the only way to spend later)
      setPhase("proving");
      const note = createShieldNote(amountUnits);
      const commitmentHex = `0x${note.commitment.toString(16).padStart(64, "0")}`;
      addNote(chainId, address, toStored(note, { status: "shielding" }));
      refreshNotes();

      // 2. prove in-browser
      const { proof } = await proveShield(note);
      const proofHex = toHex(proof);

      // 3. approve USDM -> pool if needed
      const allowance = (await publicClient.readContract({
        address: addrs!.usdm,
        abi: ERC20_ABI,
        functionName: "allowance",
        args: [address, addrs!.pool],
      })) as bigint;
      if (allowance < amountUnits) {
        setPhase("approving");
        toast.update(tid, { title: "Approving USDM", description: "Confirm in your wallet" });
        const aHash = await writeContractAsync({
          address: addrs!.usdm,
          abi: ERC20_ABI,
          functionName: "approve",
          args: [addrs!.pool, amountUnits],
        });
        await publicClient.waitForTransactionReceipt({ hash: aHash });
      }

      // 4. shield()
      setPhase("shielding");
      toast.update(tid, { title: "Shielding USDM", description: "Confirm in your wallet" });
      const sHash = await writeContractAsync({
        address: addrs!.pool,
        abi: SHIELDED_POOL_ABI,
        functionName: "shield",
        args: [note.commitment, amountUnits, proofHex],
      });
      toast.update(tid, { description: "Submitted — awaiting confirmation", hash: sHash, chainId });
      const receipt = await publicClient.waitForTransactionReceipt({ hash: sHash });

      // 5. record leaf index from the Shield event, mark shielded
      let leafIndex: number | undefined;
      try {
        const evs = parseEventLogs({ abi: SHIELDED_POOL_ABI, eventName: "Shield", logs: receipt.logs });
        const mine = evs.find((e) => `0x${e.args.commitment.toString(16).padStart(64, "0")}` === commitmentHex);
        if (mine) leafIndex = Number(mine.args.leafIndex);
      } catch {
        /* leafIndex is best-effort; recoverable later by re-indexing */
      }
      updateNote(chainId, address, commitmentHex, { status: "shielded", txHash: sHash, leafIndex });
      refreshNotes();
      usdmBal.refetch();
      setAmount("");
      toast.update(tid, {
        status: "success",
        title: `Shielded ${displayUnits(amountUnits)} USDM`,
        description: "Held privately in your note. Back it up.",
      });
    } catch (e) {
      const msg = (e as { shortMessage?: string })?.shortMessage ?? "Shield failed or was rejected";
      toast.update(tid, { status: "error", title: "Shield failed", description: msg });
      // leave the note as "shielding" in storage so the secret isn't lost
      refreshNotes();
    } finally {
      setPhase("idle");
    }
  }

  function exportNotes() {
    const blob = new Blob([JSON.stringify(notes, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `maskedusd-notes-${chainId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const cta = useMemo(() => {
    if (!isConnected) return "Connect wallet first";
    if (!live) return "Not yet live on this network";
    if (!valid) return "Enter USDM amount";
    if (insufficient) return "Insufficient USDM";
    if (phase === "proving") return "Proving privately…";
    if (phase === "approving") return "Approve USDM…";
    if (phase === "shielding") return "Shielding…";
    return "Shield USDM";
  }, [isConnected, live, valid, insufficient, phase]);

  return (
    <div className="w-full max-w-md rounded-3xl border border-ink/10 bg-surface p-6 shadow-xl shadow-accent/5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold text-ink">Shielded balance</h3>
        <span className="rounded-full bg-accent-soft px-3 py-1 text-[0.72rem] font-medium text-accent-deep">
          {live ? "Live · testnet" : "Coming next"}
        </span>
      </div>

      {/* shielded total */}
      <div className="mb-5 rounded-2xl border border-ink/10 bg-bg px-4 py-3.5">
        <p className="text-[0.74rem] text-ink-dim">Held privately</p>
        <p className="font-display text-2xl text-ink">
          {displayUnits(shieldedTotal)} <span className="font-mono text-base text-ink-muted">USDM</span>
        </p>
      </div>

      {!live ? (
        <p className="text-[0.82rem] leading-relaxed text-ink-muted">
          Shielding unlocks once the pool is live on this network. Switch to Base Sepolia to try it on
          testnet.
        </p>
      ) : (
        <>
          {/* amount */}
          <div className="rounded-2xl border border-ink/10 bg-bg px-4 py-3.5">
            <div className="flex items-center justify-between">
              <input
                inputMode="decimal"
                placeholder="0.0"
                aria-label="USDM amount to shield"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={busy}
                className="w-full bg-transparent font-display text-2xl text-ink outline-none placeholder:text-ink-dim disabled:opacity-60"
              />
              <span className="ml-3 shrink-0 rounded-full bg-accent-soft px-3 py-1 font-mono text-[0.8rem] font-medium text-accent-deep">
                USDM
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between text-[0.74rem] text-ink-dim">
              <span className="inline-flex items-center gap-1">
                Public USDM:{" "}
                {usdmBal.isLoading ? <Skeleton className="h-3 w-10" /> : displayUnits(balance)}
              </span>
              {balance !== undefined && balance > 0n && (
                <button
                  type="button"
                  onClick={() => setAmount(fromUnits(balance))}
                  disabled={busy}
                  className="font-medium text-accent-deep hover:underline disabled:opacity-50"
                >
                  Max
                </button>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={doShield}
            disabled={!isConnected || !valid || insufficient || busy}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-accent py-3.5 text-[0.95rem] font-semibold text-white transition hover:bg-accent-deep disabled:cursor-not-allowed disabled:bg-ink/15 disabled:text-ink-dim"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />}
            {cta}
          </button>

          {phase === "proving" && (
            <p className="mt-2 text-center text-[0.75rem] text-ink-dim">
              Building a zero-knowledge proof in your browser — this can take a few seconds.
            </p>
          )}

          {/* notes */}
          {notes.length > 0 && (
            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between">
                <p className="font-mono text-[0.66rem] uppercase tracking-[0.16em] text-ink-dim">
                  Your notes
                </p>
                <button
                  type="button"
                  onClick={exportNotes}
                  className="inline-flex items-center gap-1 text-[0.72rem] font-medium text-accent-deep hover:underline"
                >
                  <Download className="h-3 w-3" /> Back up
                </button>
              </div>
              <ul className="space-y-1.5">
                {notes
                  .slice()
                  .reverse()
                  .map((n) => (
                    <li
                      key={n.commitment}
                      className="flex items-center justify-between rounded-xl border border-ink/8 bg-bg px-3 py-2 text-[0.78rem]"
                    >
                      <span className="font-mono text-ink-muted">{short(n.commitment)}</span>
                      <span className="flex items-center gap-2">
                        <span className="text-ink">{displayUnits(BigInt(n.value))} USDM</span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[0.66rem] font-medium ${
                            n.status === "shielded"
                              ? "bg-emerald-500/10 text-emerald-600"
                              : n.status === "spent"
                                ? "bg-ink/10 text-ink-dim"
                                : "bg-amber-500/10 text-amber-600"
                          }`}
                        >
                          {n.status}
                        </span>
                      </span>
                    </li>
                  ))}
              </ul>
            </div>
          )}

          <div className="mt-5 flex gap-2 rounded-2xl border border-dashed border-amber-500/30 bg-amber-500/5 px-4 py-3 text-[0.76rem] leading-relaxed text-ink-muted">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
            <span>
              Your note secret is your money — it&apos;s stored only in this browser. Back it up.
              Unaudited testnet preview; not for real funds, not a tool for evading the law.
            </span>
          </div>
        </>
      )}
    </div>
  );
}
