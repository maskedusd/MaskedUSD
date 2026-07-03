"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAccount, useChainId, usePublicClient, useReadContract, useWriteContract } from "wagmi";
import { base } from "wagmi/chains";
import { toHex, parseEventLogs } from "viem";
import {
  Shield,
  Loader2,
  Download,
  AlertTriangle,
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
import { makeLogsClient } from "@/lib/rpc";
import { selectTwoInputs, buildOutputs, proveTransfer } from "@/lib/shielded/transfer";
import { decodeMemoLogs, discoverReceivedNotes } from "@/lib/shielded/discovery";
import {
  addNote,
  loadNotes,
  removeNote,
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
import { useNotifications } from "@/components/web3/NotificationsProvider";
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
  // Log scans (getLogs over wide block ranges) go through range-capable public RPCs, not the general
  // (possibly getLogs-range-capped premium) transport. Everything else uses the wagmi publicClient.
  const logsClient = useMemo(() => makeLogsClient(chainId), [chainId]);
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
  const { notify } = useNotifications();

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

  // Reconcile the LOCAL note store against the ON-CHAIN tree: the store is optimistic, so it can hold
  // a phantom note (a shield that never landed) or an un-promoted one (a shield that landed but the
  // browser closed before we recorded it). We rebuild the pool from logs and, for each non-spent note:
  //   • present in the tree  → mark "shielded" + fix the leaf index (recovers interrupted shields)
  //   • absent from the tree → delete it (purges phantoms — this is what fixes the double-count)
  // Loss-safe: a note is only deleted when the chain proves its commitment was never inserted. A
  // short grace window protects a just-submitted, not-yet-mined shield from being purged mid-flight.
  const reconcileRef = useRef(false);
  const reconcileNotes = useCallback(async () => {
    if (reconcileRef.current || !address || !custodyKey || !publicClient || !poolLive(addrs)) return;
    let stored: StoredNote[];
    try {
      stored = await loadNotes(chainId, address, custodyKey);
    } catch {
      return;
    }
    const pending = stored.filter((n) => n.status !== "spent");
    if (pending.length === 0) return;
    reconcileRef.current = true;
    try {
      const logs = await fetchPoolLogs(logsClient, addrs!.pool, POOL_DEPLOY_BLOCK[chainId] ?? 0n);
      const ix = buildIndexer(logs);
      const leafByCommitment = new Map<string, number>();
      ix.leaves.forEach((c, i) => {
        const hex = `0x${c.toString(16).padStart(64, "0")}`;
        if (!leafByCommitment.has(hex)) leafByCommitment.set(hex, i);
      });
      let changed = false;
      for (const n of pending) {
        const onchain = leafByCommitment.get(n.commitment.toLowerCase());
        if (onchain === undefined) {
          if (Date.now() - n.createdAt < 120_000) continue; // in-flight grace — don't purge a fresh shield
          await removeNote(chainId, address, custodyKey, n.commitment);
          changed = true;
        } else if (n.status !== "shielded" || n.leafIndex !== onchain) {
          await updateNote(chainId, address, custodyKey, n.commitment, { status: "shielded", leafIndex: onchain });
          changed = true;
        }
      }
      if (changed) await refreshNotes();
    } catch {
      /* transient RPC error — try again next mount */
    } finally {
      reconcileRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, custodyKey, publicClient, chainId, addrs, refreshNotes]);

  useEffect(() => {
    void reconcileNotes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reconcileNotes, notes.length]);

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

  // Count only notes CONFIRMED on-chain ("shielded"). A "shielding" note is in-flight or a phantom
  // left by a failed shield — it must never inflate "Held privately" (that was the double-count bug).
  const shieldedTotal = useMemo(
    () => notes.filter((n) => n.status === "shielded").reduce((s, n) => s + BigInt(n.value), 0n),
    [notes],
  );

  // Nudge the guardian auto-accept endpoint (fire-and-forget). Called right after the actions that
  // change the pool root (shield / private send) so withdrawals re-open without anyone clicking, and
  // when a withdraw finds the root unaccepted. Safe to spam — the endpoint no-ops if already accepted
  // and only ever accepts the pool's own current root. Never blocks or throws into the UI.
  function nudgeRootAccept() {
    if (chainId !== base.id) return; // guardian service is mainnet-only
    void fetch("/api/operator/accept-root", { method: "POST", keepalive: true }).catch(() => {});
  }

  // Post the encrypted discovery notice to NoteMemo. This is the second, separate tx of a private
  // send, and the step whose failure leaves a payment UNDISCOVERABLE by the recipient until resent.
  // One automatic retry on a transient (non-rejection) error — duplicate posts are harmless because
  // discovery dedupes by commitment, so a retry after an ambiguous RPC error costs a fraction of a
  // cent at worst, never correctness. Returns true only once the post is confirmed on-chain.
  async function postDiscoveryMemo(commitment: bigint, ciphertext: `0x${string}`): Promise<boolean> {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const hash = await writeContractAsync({
          chainId,
          address: addrs!.noteMemo,
          abi: NOTE_MEMO_ABI,
          functionName: "post",
          args: [commitment, ciphertext],
        });
        const r = await publicClient!.waitForTransactionReceipt({ hash });
        if (r.status === "success") return true;
      } catch (e) {
        const msg = ((e as { shortMessage?: string })?.shortMessage ?? String(e)).toLowerCase();
        if (msg.includes("reject") || msg.includes("denied") || msg.includes("user ")) return false;
      }
      await new Promise((res) => setTimeout(res, 1500));
    }
    return false;
  }

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
    // Tracks whether the shield actually landed on-chain. The note secret is written BEFORE the tx
    // (so a browser crash mid-shield can never lose recoverable funds), so on ANY failure where the
    // shield did NOT land we must delete that note again — otherwise it lingers as a phantom balance.
    let shieldLanded = false;
    let commitmentHex: string | undefined;
    try {
      setPhase("proving");
      const note = createShieldNote(amountUnits);
      commitmentHex = commitHex(note.commitment);
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
        const aReceipt = await publicClient.waitForTransactionReceipt({ hash: aHash });
        if (aReceipt.status !== "success") {
          throw new Error("USDM approval reverted — nothing was shielded.");
        }
        // Right after an approve confirms, an RPC (or the wallet's own pre-sign simulation) can still
        // read the OLD allowance and reject the shield — the "fails the first time, works the second"
        // bug. Wait until the new allowance is actually readable (or ~15s) before sending the shield.
        toast.update(tid, { title: "Confirming approval", description: "Syncing on-chain state…" });
        for (let i = 0; i < 20; i++) {
          const current = (await publicClient.readContract({
            address: addrs!.usdm,
            abi: ERC20_ABI,
            functionName: "allowance",
            args: [address, addrs!.pool],
          })) as bigint;
          if (current >= amountUnits) break;
          await new Promise((r) => setTimeout(r, 750));
        }
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
      // A submitted tx can still REVERT — that used to be marked "shielded" anyway (phantom balance).
      if (receipt.status !== "success") {
        throw new Error("The shield transaction reverted on-chain — nothing was shielded.");
      }
      shieldLanded = true; // from here the note is real; never delete it on a later error.

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
      nudgeRootAccept(); // the tree changed → let the guardian service re-open withdrawals
      toast.update(tid, {
        status: "success",
        title: `Shielded ${displayUnits(amountUnits)} USDM`,
        description: "Held privately in your note. Back it up.",
      });
    } catch (e) {
      const msg = (e as { shortMessage?: string })?.shortMessage ?? "Shield failed or was rejected";
      toast.update(tid, { status: "error", title: "Shield failed", description: msg });
      // The shield never landed → delete the phantom note so it can't inflate the balance.
      if (!shieldLanded && commitmentHex) {
        try {
          await removeNote(chainId, address, custodyKey, commitmentHex);
        } catch {
          /* store already consistent, or key unavailable — reconcile will catch it */
        }
      }
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
      const logs = await fetchPoolLogs(logsClient, addrs!.pool, POOL_DEPLOY_BLOCK[chainId] ?? 0n);
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
        nudgeRootAccept(); // ask the guardian service to accept it now
        toast.update(tid, {
          status: "error",
          title: "Withdrawals re-opening",
          description: "A newer deposit changed the pool root. The operator is accepting it — try again in ~30s.",
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
      const logs = await fetchPoolLogs(logsClient, addrs!.pool, POOL_DEPLOY_BLOCK[chainId] ?? 0n);
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
            { status: "shielded", leafIndex: changeLeaf, txHash: hash, change: true },
          ),
        );
      }

      // C3: post the discovery memo as a SEPARATE, best-effort tx — the payment is already final.
      const wire = encryptNote(rEncPub, { value: amt, blinding: plan.recipient.blinding, assetId: 0n }, plan.recipient.commitment);
      const memoHex = toHex(wire);
      const recipientCommitHex = commitHex(plan.recipient.commitment);
      addPendingMemo(chainId, address, { commitment: recipientCommitHex, ciphertext: memoHex });
      setPending(loadPendingMemos(chainId, address));
      nudgeRootAccept(); // the transfer added output commitments → re-open withdrawals
      const posted = await postDiscoveryMemo(plan.recipient.commitment, memoHex);
      if (posted) {
        removePendingMemo(chainId, address, recipientCommitHex);
        setPending(loadPendingMemos(chainId, address));
        toast.update(tid, {
          status: "success",
          title: `Sent ${displayUnits(amt)} USDM privately`,
          description:
            plan.change.value > 0n
              ? `Done — it'll appear for the recipient automatically. ${displayUnits(plan.change.value)} USDM came back to you as change.`
              : "Done — it'll appear for the recipient automatically.",
        });
      } else {
        toast.update(tid, {
          status: "success",
          title: `Sent ${displayUnits(amt)} USDM — action needed`,
          description: "Payment is final, but the recipient can't see it yet. Tap “Resend notice” below.",
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

  // Discover privately-received notes. Runs automatically (on unlock + a visibility-gated poll) and
  // manually (the "Check received" button). INCREMENTAL: it caches the pool logs + a block cursor and
  // fetches only NEW blocks per run, so a background poll costs ~one small getLogs, not a full rescan
  // (that's what makes polling safe against RPC rate limits). New memos are matched against the full
  // (cached) tree — a memo is always posted after the commitment it references, so scanning only the
  // delta is correct. Silent runs show a toast ONLY when something new arrives.
  const scanCacheRef = useRef<{ nextFrom: bigint; poolLogs: Awaited<ReturnType<typeof fetchPoolLogs>> } | null>(null);
  const scanBusyRef = useRef(false);
  useEffect(() => {
    scanCacheRef.current = null; // pool logs are chain-specific — drop the cache on chain switch
  }, [chainId]);

  const scanReceived = useCallback(
    async (opts: { silent: boolean; reset?: boolean }): Promise<number> => {
      if (scanBusyRef.current) return 0;
      if (!poolLive(addrs) || !addrs?.noteMemo || !address || !publicClient || !custodyKey || !identity) return 0;
      scanBusyRef.current = true;
      if (!opts.silent) setScanning(true);
      const tid = opts.silent
        ? null
        : toast.show({ status: "pending", title: "Checking for received payments", description: "Scanning the pool + memos…" });
      try {
        if (opts.reset) scanCacheRef.current = null;
        const from = scanCacheRef.current ? scanCacheRef.current.nextFrom : POOL_DEPLOY_BLOCK[chainId] ?? 0n;
        const head = await logsClient.getBlockNumber();
        let added = 0;
        if (head >= from) {
          const newPool = await fetchPoolLogs(logsClient, addrs.pool, from, head);
          const newMemo = await fetchPoolLogs(logsClient, addrs.noteMemo, from, head);
          const allPool = [...(scanCacheRef.current?.poolLogs ?? []), ...newPool];
          const ix = buildIndexer(allPool);
          const found = discoverReceivedNotes(decodeMemoLogs(newMemo), ix, identity.encPriv, identity.spendPriv);
          const existing = new Set(
            (await loadNotes(chainId, address, custodyKey)).map((n) => n.commitment.toLowerCase()),
          );
          for (const d of found) {
            const stored = discoveredToStored(d);
            if (existing.has(stored.commitment.toLowerCase())) continue;
            await addNote(chainId, address, custodyKey, stored);
            // Persist a bell notification (deduped by commitment) so the user knows even if they're
            // not watching the notes list when the payment arrives.
            notify({
              id: `recv:${stored.commitment.toLowerCase()}`,
              kind: "received",
              title: `Received ${displayUnits(BigInt(stored.value))} USDM`,
              body: "A private payment arrived in your shielded balance.",
            });
            added++;
          }
          scanCacheRef.current = { nextFrom: head + 1n, poolLogs: allPool };
          if (added > 0) await refreshNotes();
        }
        if (tid) {
          toast.update(tid, {
            status: "success",
            title: added ? `Found ${added} received note${added > 1 ? "s" : ""}` : "No new payments",
            description: added ? "Added to your shielded balance." : "You're all caught up.",
          });
        } else if (added > 0) {
          toast.show({
            status: "success",
            title: `Received ${added} private payment${added > 1 ? "s" : ""}`,
            description: "Added to your shielded balance.",
          });
        }
        return added;
      } catch (e) {
        if (tid) {
          const msg = (e as { shortMessage?: string })?.shortMessage ?? "Scan failed";
          toast.update(tid, { status: "error", title: "Scan failed", description: msg });
        }
        return 0;
      } finally {
        scanBusyRef.current = false;
        if (!opts.silent) setScanning(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [addrs, address, publicClient, custodyKey, identity, chainId, refreshNotes],
  );

  function doScan() {
    void scanReceived({ silent: false, reset: true });
  }

  // Auto-discover: scan immediately once unlocked, then poll every 15s while the tab is visible, and
  // the instant it regains focus. Background polls are silent + incremental, so this stays cheap.
  useEffect(() => {
    if (!identity || !poolLive(addrs) || !address) return;
    void scanReceived({ silent: true });
    const interval = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
      void scanReceived({ silent: true });
    }, 15_000);
    const onVisible = () => {
      if (document.visibilityState === "visible") void scanReceived({ silent: true });
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [identity, address, chainId, scanReceived]);

  async function resendMemo(m: PendingMemo) {
    if (!canTransfer || !address || !publicClient) return;
    const tid = toast.show({ status: "pending", title: "Resending payment notice", description: "Confirm in your wallet" });
    const ok = await postDiscoveryMemo(BigInt(m.commitment), m.ciphertext as `0x${string}`);
    if (ok) {
      removePendingMemo(chainId, address, m.commitment);
      setPending(loadPendingMemos(chainId, address));
      toast.update(tid, { status: "success", title: "Payment notice posted", description: "The recipient can now discover the note with “Check received”." });
    } else {
      toast.update(tid, { status: "error", title: "Still couldn't post the notice", description: "Try again in a moment — the payment itself is already final and safe." });
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

  // A private send SPENDS two shielded notes — with fewer than two (or a total below the amount)
  // there is nothing to spend, so the Send button stays disabled instead of failing at proving.
  const spendableCount = notes.filter((n) => n.status === "shielded").length;
  const transferAmountUnits = isValidAmount(transferAmount) ? toUnits(transferAmount) : 0n;
  const transferReady =
    isValidAddress(recipientAddr.trim()) &&
    isValidAmount(transferAmount) &&
    spendableCount >= 2 &&
    transferAmountUnits <= shieldedTotal;

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
              {spendableCount < 2 ? (
                <p className="mt-2 text-[0.72rem] leading-relaxed text-amber-600">
                  Private sends spend two shielded notes — you have {spendableCount === 0 ? "none" : "one"}.
                  Shield USDM {spendableCount === 0 ? "twice (any split)" : "once more"} above to
                  enable sending.
                </p>
              ) : isValidAmount(transferAmount) && transferAmountUnits > shieldedTotal ? (
                <p className="mt-2 text-[0.72rem] leading-relaxed text-amber-600">
                  That&apos;s more than your shielded balance ({displayUnits(shieldedTotal)} USDM).
                </p>
              ) : null}
              <p className="mt-2 text-[0.7rem] leading-relaxed text-ink-dim">
                Spends two of your shielded notes; only the recipient&apos;s key can spend what they
                receive. Two confirmations: the transfer, then an encrypted notice so they can find it
                (~10s proof). The recipient sees it after they tap “Check received”.
              </p>
            </div>
          )}

          {/* Pending discovery notices (re-postable) — a settled payment the recipient can't see YET. */}
          {pending.length > 0 && (
            <div className="mt-4 rounded-2xl border-2 border-amber-500/50 bg-amber-500/10 p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" aria-hidden="true" />
                <p className="font-mono text-[0.66rem] font-semibold uppercase tracking-[0.14em] text-amber-700">
                  {pending.length === 1 ? "1 payment" : `${pending.length} payments`} awaiting notice
                </p>
              </div>
              <p className="mt-2 text-[0.78rem] leading-relaxed text-ink-muted">
                The transfer is <span className="font-medium text-ink">already final</span> — but a
                private payment needs a second step: an encrypted notice so the recipient can find it.
                That step didn&apos;t post. <span className="font-medium text-ink">Tap Resend</span> (one
                more wallet confirmation) or the recipient will never see it.
              </p>
              <ul className="mt-3 space-y-1.5">
                {pending.map((m) => (
                  <li key={m.commitment} className="flex items-center justify-between gap-2 text-[0.76rem]">
                    <span className="font-mono text-ink-muted">{short(m.commitment)}</span>
                    <button
                      type="button"
                      onClick={() => resendMemo(m)}
                      disabled={busy}
                      className="inline-flex items-center gap-1.5 rounded-full bg-amber-500 px-3 py-1 text-[0.74rem] font-semibold text-white transition hover:bg-amber-600 disabled:opacity-50"
                    >
                      <RotateCw className="h-3 w-3" /> Resend notice
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
                        {n.change && (
                          <span
                            title="Change returned to you from a private send — like the change from paying with a larger bill"
                            className="rounded-full border border-ink/10 bg-bg-wash px-1.5 py-0.5 text-[0.6rem] font-medium text-ink-muted"
                          >
                            change
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
