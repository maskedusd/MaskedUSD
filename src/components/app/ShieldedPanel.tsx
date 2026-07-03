"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAccount, useChainId, usePublicClient, useReadContract, useWriteContract } from "wagmi";
import { toHex, parseEventLogs } from "viem";
import {
  Shield,
  Loader2,
  Download,
  ArrowUpFromLine,
  Lock,
  Copy,
  Check,
  Send,
  Inbox,
  RotateCw,
} from "lucide-react";
import {
  ERC20_ABI,
  SHIELDED_POOL_ABI,
  NOTE_MEMO_ABI,
  POOL_DEPLOY_BLOCK,
  addressesFor,
  poolLive,
  transfersLive,
} from "@/lib/contracts";
import { displayUnits, fromUnits, isValidAmount, toUnits } from "@/lib/format";
import { createShieldNote, proveShield } from "@/lib/shielded/client";
import { buildIndexer, fetchPoolLogs, proveUnshield, buildAssociation } from "@/lib/shielded/unshield";
import { selectTwoInputs, buildOutputs, proveTransfer } from "@/lib/shielded/transfer";
import { decodeMemoLogs, discoverReceivedNotes } from "@/lib/shielded/discovery";
import {
  addNote,
  loadNotes,
  toStored,
  updateNote,
  discoveredToStored,
  type StoredNote,
} from "@/lib/shielded/store";
import {
  loadPendingMemos,
  addPendingMemo,
  removePendingMemo,
  type PendingMemo,
} from "@/lib/shielded/memoQueue";
import { encodeAddress, decodeAddress, isValidAddress } from "@/lib/shielded/address";
import { encryptNote } from "@/lib/shielded/noteCrypto";
import type { Note } from "@/lib/shielded/notes";
import { useIdentity } from "@/components/web3/IdentityProvider";
import { useToast } from "@/components/web3/Toaster";
import Skeleton from "@/components/ui/Skeleton";

type Phase = "idle" | "proving" | "approving" | "shielding";

const short = (hex: string) => `${hex.slice(0, 6)}…${hex.slice(-4)}`;
const commitHex = (c: bigint) => `0x${c.toString(16).padStart(64, "0")}`;
const storedToNote = (n: StoredNote): Note => ({
  value: BigInt(n.value),
  ownerPriv: BigInt(n.ownerPriv),
  blinding: BigInt(n.blinding),
  assetId: BigInt(n.assetId),
});

export default function ShieldedPanel() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const addrs = addressesFor(chainId);
  const live = poolLive(addrs);
  const canTransfer = transfersLive(addrs);

  const { identity, locked, unlocking, error: idError, unlock } = useIdentity();
  const custodyKey = identity?.custodyKey;
  const myAddress = useMemo(
    () => (identity ? encodeAddress(identity.encPub, identity.spendPub) : null),
    [identity],
  );

  const [amount, setAmount] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [withdrawing, setWithdrawing] = useState<string | null>(null);
  const [notes, setNotes] = useState<StoredNote[]>([]);
  const [copied, setCopied] = useState(false);
  const [recipientAddr, setRecipientAddr] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [transferring, setTransferring] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [pending, setPending] = useState<PendingMemo[]>([]);

  const { writeContractAsync } = useWriteContract();
  const toast = useToast();

  const refreshNotes = useCallback(async () => {
    if (!address) {
      setNotes([]);
      setPending([]);
      return;
    }
    setPending(loadPendingMemos(chainId, address));
    if (!custodyKey) {
      setNotes([]);
      return;
    }
    try {
      setNotes(await loadNotes(chainId, address, custodyKey));
    } catch {
      // ciphertext present but undecryptable with this key: show nothing rather than wrong data.
      // Nothing is ever written here, so the encrypted notes are not lost.
      setNotes([]);
    }
  }, [address, chainId, custodyKey]);
  useEffect(() => {
    void refreshNotes();
  }, [refreshNotes]);

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
  const busy = phase !== "idle" || withdrawing !== null || transferring || scanning;

  const shieldedTotal = useMemo(
    () => notes.filter((n) => n.status !== "spent").reduce((s, n) => s + BigInt(n.value), 0n),
    [notes],
  );

  async function copyAddress() {
    if (!myAddress) return;
    try {
      await navigator.clipboard.writeText(myAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked — ignore */
    }
  }

  async function doShield() {
    if (!live || !address || !publicClient || !valid || insufficient || !custodyKey) return;
    const tid = toast.show({
      status: "pending",
      title: "Generating proof on your device",
      description: "This runs locally — keys never leave your browser (~5s)",
    });
    try {
      setPhase("proving");
      const note = createShieldNote(amountUnits);
      const commitmentHex = commitHex(note.commitment);
      await addNote(chainId, address, custodyKey, toStored(note, { status: "shielding" }));
      await refreshNotes();

      const { proof } = await proveShield(note);
      const proofHex = toHex(proof);

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
          chainId,
          address: addrs!.usdm,
          abi: ERC20_ABI,
          functionName: "approve",
          args: [addrs!.pool, amountUnits],
        });
        await publicClient.waitForTransactionReceipt({ hash: aHash });
      }

      setPhase("shielding");
      toast.update(tid, { title: "Shielding USDM", description: "Confirm in your wallet" });
      const sHash = await writeContractAsync({
        chainId,
        address: addrs!.pool,
        abi: SHIELDED_POOL_ABI,
        functionName: "shield",
        args: [note.commitment, amountUnits, proofHex],
      });
      toast.update(tid, { description: "Submitted — awaiting confirmation", hash: sHash, chainId });
      const receipt = await publicClient.waitForTransactionReceipt({ hash: sHash });

      let leafIndex: number | undefined;
      try {
        const evs = parseEventLogs({ abi: SHIELDED_POOL_ABI, eventName: "Shield", logs: receipt.logs });
        const mine = evs.find((e) => commitHex(e.args.commitment) === commitmentHex);
        if (mine) leafIndex = Number(mine.args.leafIndex);
      } catch {
        /* best-effort; recoverable by re-indexing */
      }
      await updateNote(chainId, address, custodyKey, commitmentHex, {
        status: "shielded",
        txHash: sHash,
        leafIndex,
      });
      await refreshNotes();
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
      await refreshNotes();
    } finally {
      setPhase("idle");
    }
  }

  async function doWithdraw(n: StoredNote) {
    if (!live || !address || !publicClient || !custodyKey) return;
    const tid = toast.show({
      status: "pending",
      title: "Preparing withdrawal",
      description: "Rebuilding the pool tree from on-chain logs…",
    });
    setWithdrawing(n.commitment);
    try {
      const logs = await fetchPoolLogs(publicClient, addrs!.pool, POOL_DEPLOY_BLOCK[chainId] ?? 0n);
      const ix = buildIndexer(logs);

      const note = storedToNote(n);
      const located = ix.locate([note])[0];
      if (!located) {
        toast.update(tid, {
          status: "error",
          title: "Note not found in the pool",
          description: "It may not be confirmed yet — try again in a moment.",
        });
        return;
      }
      if (located.spent) {
        await updateNote(chainId, address, custodyKey, n.commitment, { status: "spent" });
        await refreshNotes();
        toast.update(tid, { status: "error", title: "Already withdrawn", description: "This note has been spent." });
        return;
      }
      const leafIndex = located.leafIndex;
      if (n.leafIndex !== leafIndex) await updateNote(chainId, address, custodyKey, n.commitment, { leafIndex });

      const { root } = ix.witness(leafIndex);
      // D4 association set (no exclusion feed published yet: empty ledger + no maturation → root == commitment root).
      const association = buildAssociation(ix);
      const associationRoot = association.root;
      const accepted = (await publicClient.readContract({
        address: addrs!.pool,
        abi: SHIELDED_POOL_ABI,
        functionName: "acceptedAssociationRoot",
        args: [associationRoot],
      })) as boolean;
      if (!accepted) {
        toast.update(tid, {
          status: "error",
          title: "Withdrawals not open for this root",
          description: "A newer deposit changed the pool root — the operator must accept the current root.",
        });
        return;
      }

      toast.update(tid, { title: "Proving withdrawal", description: "Zero-knowledge proof in your browser (~10s)" });
      const { proof, nullifier } = await proveUnshield(ix, { ...note, leafIndex }, {
        to: address,
        payoutAmount: note.value,
        fee: 0n,
        feeRecipient: address,
        association,
      });

      toast.update(tid, { title: "Withdrawing", description: "Confirm in your wallet" });
      const hash = await writeContractAsync({
        chainId,
        address: addrs!.pool,
        abi: SHIELDED_POOL_ABI,
        functionName: "unshield",
        args: [root, associationRoot, nullifier, address, note.value, 0n, address, toHex(proof)],
      });
      toast.update(tid, { description: "Submitted — awaiting confirmation", hash, chainId });
      await publicClient.waitForTransactionReceipt({ hash });

      await updateNote(chainId, address, custodyKey, n.commitment, { status: "spent", txHash: hash });
      await refreshNotes();
      usdmBal.refetch();
      toast.update(tid, {
        status: "success",
        title: `Withdrew ${displayUnits(note.value)} USDM`,
        description: "Back to public USDM in your wallet.",
      });
    } catch (e) {
      const msg = (e as { shortMessage?: string })?.shortMessage ?? "Withdraw failed or was rejected";
      toast.update(tid, { status: "error", title: "Withdraw failed", description: msg });
    } finally {
      setWithdrawing(null);
    }
  }

  async function doTransfer() {
    if (!canTransfer || !address || !publicClient || !custodyKey || !identity) return;
    const recipient = recipientAddr.trim();
    if (!isValidAddress(recipient)) {
      toast.show({ status: "error", title: "Invalid address", description: "Enter a valid musd1… MaskedUSD address." });
      return;
    }
    if (!isValidAmount(transferAmount)) return;
    const amt = toUnits(transferAmount);
    const { encPub: rEncPub, spendPub: rSpendPub } = decodeAddress(recipient);

    const tid = toast.show({
      status: "pending",
      title: "Preparing private transfer",
      description: "Rebuilding the pool tree from on-chain logs…",
    });
    setTransferring(true);
    try {
      const logs = await fetchPoolLogs(publicClient, addrs!.pool, POOL_DEPLOY_BLOCK[chainId] ?? 0n);
      const ix = buildIndexer(logs);

      const myNotes = (await loadNotes(chainId, address, custodyKey))
        .filter((n) => n.status !== "spent")
        .map(storedToNote);
      const spendable = ix.spendable(myNotes);
      const inputs = selectTwoInputs(spendable, amt);
      if (!inputs) {
        toast.update(tid, {
          status: "error",
          title: "Need two notes to send",
          description:
            spendable.length < 2
              ? "A private transfer spends two shielded notes. Shield again to create a second note."
              : "Your two largest notes don't cover this amount. Consolidate or send less.",
        });
        return;
      }
      const inSum = inputs[0].note.value + inputs[1].note.value;
      const plan = buildOutputs(inSum, amt, 0n, rSpendPub);

      toast.update(tid, { title: "Proving transfer", description: "Zero-knowledge proof in your browser (~10s)" });
      const tp = await proveTransfer(ix, inputs, plan, 0n, address);

      toast.update(tid, { title: "Sending privately", description: "Confirm in your wallet" });
      const hash = await writeContractAsync({
        chainId,
        address: addrs!.pool,
        abi: SHIELDED_POOL_ABI,
        functionName: "transfer",
        args: [tp.root, tp.nullifiers[0], tp.nullifiers[1], tp.outCommitments[0], tp.outCommitments[1], 0n, address, toHex(tp.proof)],
      });
      toast.update(tid, { description: "Submitted — awaiting confirmation", hash, chainId });
      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      // mark the two spent inputs
      await updateNote(chainId, address, custodyKey, commitHex(inputs[0].commitment), { status: "spent", txHash: hash });
      await updateNote(chainId, address, custodyKey, commitHex(inputs[1].commitment), { status: "spent", txHash: hash });

      // store the change note (owned by us) with its on-chain leaf index
      if (plan.change.value > 0n) {
        let changeLeaf: number | undefined;
        try {
          const evs = parseEventLogs({ abi: SHIELDED_POOL_ABI, eventName: "PrivateTransfer", logs: receipt.logs });
          const mine = evs.find((e) => e.args.commitmentB === plan.change.commitment);
          if (mine) changeLeaf = Number(mine.args.leafIndexB);
        } catch {
          /* best-effort */
        }
        await addNote(
          chainId,
          address,
          custodyKey,
          toStored(
            { value: plan.change.value, ownerPriv: plan.change.ownerPriv, blinding: plan.change.blinding, assetId: 0n, commitment: plan.change.commitment },
            { status: "shielded", leafIndex: changeLeaf, txHash: hash },
          ),
        );
      }

      // C3: post the discovery memo as a SEPARATE, best-effort tx — the payment is already final.
      const wire = encryptNote(rEncPub, { value: amt, blinding: plan.recipient.blinding, assetId: 0n }, plan.recipient.commitment);
      const memoHex = toHex(wire);
      const recipientCommitHex = commitHex(plan.recipient.commitment);
      addPendingMemo(chainId, address, { commitment: recipientCommitHex, ciphertext: memoHex });
      setPending(loadPendingMemos(chainId, address));
      try {
        const mHash = await writeContractAsync({
          chainId,
          address: addrs!.noteMemo,
          abi: NOTE_MEMO_ABI,
          functionName: "post",
          args: [plan.recipient.commitment, memoHex],
        });
        await publicClient.waitForTransactionReceipt({ hash: mHash });
        removePendingMemo(chainId, address, recipientCommitHex);
        setPending(loadPendingMemos(chainId, address));
        toast.update(tid, {
          status: "success",
          title: `Sent ${displayUnits(amt)} USDM privately`,
          description: "The recipient can now discover it.",
        });
      } catch {
        toast.update(tid, {
          status: "success",
          title: `Sent ${displayUnits(amt)} USDM privately`,
          description: "Payment is final, but the discovery notice didn't post — use Resend below.",
        });
      }

      await refreshNotes();
      usdmBal.refetch();
      setTransferAmount("");
      setRecipientAddr("");
    } catch (e) {
      const msg = (e as { shortMessage?: string })?.shortMessage ?? "Transfer failed or was rejected";
      toast.update(tid, { status: "error", title: "Transfer failed", description: msg });
      await refreshNotes();
    } finally {
      setTransferring(false);
    }
  }

  async function doScan() {
    if (!canTransfer || !address || !publicClient || !custodyKey || !identity) return;
    setScanning(true);
    const tid = toast.show({ status: "pending", title: "Checking for received payments", description: "Scanning the pool + memos…" });
    try {
      const poolLogs = await fetchPoolLogs(publicClient, addrs!.pool, POOL_DEPLOY_BLOCK[chainId] ?? 0n);
      const ix = buildIndexer(poolLogs);
      const memoLogs = await fetchPoolLogs(publicClient, addrs!.noteMemo, POOL_DEPLOY_BLOCK[chainId] ?? 0n);
      const found = discoverReceivedNotes(decodeMemoLogs(memoLogs), ix, identity.encPriv, identity.spendPriv);

      const existing = new Set((await loadNotes(chainId, address, custodyKey)).map((n) => n.commitment.toLowerCase()));
      let added = 0;
      for (const d of found) {
        const stored = discoveredToStored(d);
        if (existing.has(stored.commitment.toLowerCase())) continue;
        await addNote(chainId, address, custodyKey, stored);
        added++;
      }
      await refreshNotes();
      toast.update(tid, {
        status: "success",
        title: added ? `Found ${added} received note${added > 1 ? "s" : ""}` : "No new payments",
        description: added ? "Added to your shielded balance." : "You're all caught up.",
      });
    } catch (e) {
      const msg = (e as { shortMessage?: string })?.shortMessage ?? "Scan failed";
      toast.update(tid, { status: "error", title: "Scan failed", description: msg });
    } finally {
      setScanning(false);
    }
  }

  async function resendMemo(m: PendingMemo) {
    if (!canTransfer || !address || !publicClient) return;
    const tid = toast.show({ status: "pending", title: "Resending payment notice", description: "Confirm in your wallet" });
    try {
      const hash = await writeContractAsync({
        chainId,
        address: addrs!.noteMemo,
        abi: NOTE_MEMO_ABI,
        functionName: "post",
        args: [BigInt(m.commitment), m.ciphertext as `0x${string}`],
      });
      await publicClient.waitForTransactionReceipt({ hash });
      removePendingMemo(chainId, address, m.commitment);
      setPending(loadPendingMemos(chainId, address));
      toast.update(tid, { status: "success", title: "Payment notice sent", description: "The recipient can now discover the note." });
    } catch (e) {
      const msg = (e as { shortMessage?: string })?.shortMessage ?? "rejected";
      toast.update(tid, { status: "error", title: "Resend failed", description: msg });
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

  const transferReady = isValidAddress(recipientAddr.trim()) && isValidAmount(transferAmount);

  return (
    <div className="w-full max-w-md rounded-3xl border border-ink/10 bg-surface p-6 shadow-xl shadow-accent/5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold text-ink">Shielded balance</h3>
        <span className="rounded-full bg-accent-soft px-3 py-1 text-[0.72rem] font-medium text-accent-deep">
          {live ? "Live" : "Coming next"}
        </span>
      </div>

      <div className="mb-5 rounded-2xl border border-ink/10 bg-bg px-4 py-3.5">
        <p className="text-[0.74rem] text-ink-dim">Held privately</p>
        <p className="font-display text-2xl text-ink">
          {locked ? <span className="text-ink-dim">•••••</span> : displayUnits(shieldedTotal)}{" "}
          <span className="font-mono text-base text-ink-muted">USDM</span>
        </p>
      </div>

      {!live ? (
        <p className="text-[0.82rem] leading-relaxed text-ink-muted">
          Shielding unlocks once the pool is live on this network. Switch to Base to use it.
        </p>
      ) : locked ? (
        <div className="rounded-2xl border border-ink/10 bg-bg px-5 py-6 text-center">
          <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-accent-soft">
            <Lock className="h-5 w-5 text-accent-deep" />
          </div>
          <p className="font-display text-[1.05rem] font-semibold text-ink">Unlock your private balance</p>
          <p className="mx-auto mt-1.5 max-w-xs text-[0.82rem] leading-relaxed text-ink-muted">
            Sign once to derive your viewing key. It decrypts your notes and reveals your MaskedUSD
            receiving address. The signature stays in your wallet — nothing is sent on-chain.
          </p>
          <button
            type="button"
            onClick={unlock}
            disabled={unlocking}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-accent py-3 text-[0.95rem] font-semibold text-white transition hover:bg-accent-deep disabled:cursor-not-allowed disabled:opacity-60"
          >
            {unlocking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
            {unlocking ? "Check your wallet…" : "Unlock"}
          </button>
          {idError && <p className="mt-2.5 text-[0.78rem] text-red-500">{idError}</p>}
        </div>
      ) : (
        <>
          {myAddress && (
            <div className="mb-4 rounded-2xl border border-ink/10 bg-bg px-4 py-3">
              <p className="font-mono text-[0.64rem] uppercase tracking-[0.16em] text-ink-dim">
                Your MaskedUSD address
              </p>
              <div className="mt-1 flex items-center justify-between gap-2">
                <span className="truncate font-mono text-[0.8rem] text-ink" title={myAddress}>
                  {myAddress.slice(0, 14)}…{myAddress.slice(-8)}
                </span>
                <button
                  type="button"
                  onClick={copyAddress}
                  className="inline-flex shrink-0 items-center gap-1 rounded-full bg-accent-soft px-2.5 py-1 text-[0.7rem] font-medium text-accent-deep transition hover:bg-accent/15"
                >
                  {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
              <p className="mt-1.5 text-[0.7rem] leading-relaxed text-ink-dim">
                Share this to receive private payments. It reveals nothing about your wallet or balance.
              </p>
            </div>
          )}

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
            {phase !== "idle" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />}
            {cta}
          </button>

          {phase === "proving" && (
            <p className="mt-2 text-center text-[0.75rem] text-ink-dim">
              Building a zero-knowledge proof in your browser — this can take a few seconds.
            </p>
          )}

          {/* Send privately */}
          {canTransfer && (
            <div className="mt-5 rounded-2xl border border-ink/10 bg-bg p-4">
              <p className="mb-2 font-mono text-[0.66rem] uppercase tracking-[0.16em] text-ink-dim">
                Send privately
              </p>
              <input
                placeholder="musd1… recipient address"
                aria-label="Recipient MaskedUSD address"
                value={recipientAddr}
                onChange={(e) => setRecipientAddr(e.target.value)}
                disabled={busy}
                spellCheck={false}
                className="w-full rounded-xl border border-ink/10 bg-surface px-3 py-2 font-mono text-[0.8rem] text-ink outline-none placeholder:text-ink-dim focus:border-accent/40 disabled:opacity-60"
              />
              <div className="mt-2 flex items-center gap-2">
                <input
                  inputMode="decimal"
                  placeholder="0.0"
                  aria-label="Amount to send"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  disabled={busy}
                  className="w-full rounded-xl border border-ink/10 bg-surface px-3 py-2 font-display text-lg text-ink outline-none placeholder:text-ink-dim focus:border-accent/40 disabled:opacity-60"
                />
                <button
                  type="button"
                  onClick={doTransfer}
                  disabled={busy || !transferReady}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-accent px-4 py-2.5 text-[0.85rem] font-semibold text-white transition hover:bg-accent-deep disabled:cursor-not-allowed disabled:bg-ink/15 disabled:text-ink-dim"
                >
                  {transferring ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Send
                </button>
              </div>
              {recipientAddr.trim() && !isValidAddress(recipientAddr.trim()) && (
                <p className="mt-1.5 text-[0.72rem] text-red-500">Not a valid musd1… address.</p>
              )}
              <p className="mt-2 text-[0.7rem] leading-relaxed text-ink-dim">
                Spends two of your shielded notes; only the recipient&apos;s key can spend what they
                receive. Posts an encrypted notice so they can find it. ~10s proof.
              </p>
            </div>
          )}

          {/* Pending discovery notices (re-postable) */}
          {pending.length > 0 && (
            <div className="mt-4 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4">
              <p className="font-mono text-[0.64rem] uppercase tracking-[0.16em] text-amber-600">
                Payment notice not posted
              </p>
              <p className="mt-1 text-[0.74rem] leading-relaxed text-ink-muted">
                These payments settled, but the recipient can&apos;t discover them until the notice is
                posted. Resend it:
              </p>
              <ul className="mt-2 space-y-1.5">
                {pending.map((m) => (
                  <li key={m.commitment} className="flex items-center justify-between gap-2 text-[0.76rem]">
                    <span className="font-mono text-ink-muted">{short(m.commitment)}</span>
                    <button
                      type="button"
                      onClick={() => resendMemo(m)}
                      disabled={busy}
                      className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[0.7rem] font-medium text-amber-700 transition hover:bg-amber-500/25 disabled:opacity-50"
                    >
                      <RotateCw className="h-3 w-3" /> Resend
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Notes + received scan */}
          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between">
              <p className="font-mono text-[0.66rem] uppercase tracking-[0.16em] text-ink-dim">Your notes</p>
              <div className="flex items-center gap-3">
                {canTransfer && (
                  <button
                    type="button"
                    onClick={doScan}
                    disabled={busy}
                    className="inline-flex items-center gap-1 text-[0.72rem] font-medium text-accent-deep hover:underline disabled:opacity-50"
                  >
                    {scanning ? <Loader2 className="h-3 w-3 animate-spin" /> : <Inbox className="h-3 w-3" />}
                    Check received
                  </button>
                )}
                {notes.length > 0 && (
                  <button
                    type="button"
                    onClick={exportNotes}
                    className="inline-flex items-center gap-1 text-[0.72rem] font-medium text-accent-deep hover:underline"
                  >
                    <Download className="h-3 w-3" /> Back up
                  </button>
                )}
              </div>
            </div>
            {notes.length === 0 ? (
              <p className="rounded-xl border border-dashed border-ink/10 bg-bg px-3 py-3 text-[0.76rem] text-ink-dim">
                No notes yet. Shield USDM above, or check for payments sent to your address.
              </p>
            ) : (
              <ul className="space-y-1.5">
                {notes
                  .slice()
                  .reverse()
                  .map((n) => (
                    <li
                      key={n.commitment}
                      className="flex items-center justify-between gap-2 rounded-xl border border-ink/8 bg-bg px-3 py-2 text-[0.78rem]"
                    >
                      <span className="flex items-center gap-1.5">
                        {n.received && (
                          <span className="rounded-full bg-accent-soft px-1.5 py-0.5 text-[0.6rem] font-medium text-accent-deep">
                            received
                          </span>
                        )}
                        <span className="font-mono text-ink-muted">{short(n.commitment)}</span>
                      </span>
                      <span className="flex items-center gap-2">
                        <span className="text-ink">{displayUnits(BigInt(n.value))} USDM</span>
                        {n.status === "shielded" ? (
                          <button
                            type="button"
                            onClick={() => doWithdraw(n)}
                            disabled={busy}
                            className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2.5 py-0.5 text-[0.7rem] font-medium text-accent-deep transition hover:bg-accent/15 disabled:opacity-50"
                          >
                            {withdrawing === n.commitment ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <ArrowUpFromLine className="h-3 w-3" />
                            )}
                            Withdraw
                          </button>
                        ) : (
                          <span
                            className={`rounded-full px-2 py-0.5 text-[0.66rem] font-medium ${
                              n.status === "spent" ? "bg-ink/10 text-ink-dim" : "bg-amber-500/10 text-amber-600"
                            }`}
                          >
                            {n.status}
                          </span>
                        )}
                      </span>
                    </li>
                  ))}
              </ul>
            )}
          </div>

        </>
      )}
    </div>
  );
}
