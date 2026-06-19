"use client";

import { useEffect, useMemo, useState } from "react";
import { useAccount, useChainId, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import {
  ERC20_ABI,
  MINT_RAMP_ABI,
  REDEEM_RAMP_ABI,
  addressesFor,
  rampsLive,
} from "@/lib/contracts";
import { displayUnits, fromUnits, isValidAmount, toUnits } from "@/lib/format";

type Mode = "mint" | "redeem";

export default function MintRedeemCard() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const addrs = addressesFor(chainId);
  const live = rampsLive(addrs);

  const [mode, setMode] = useState<Mode>("mint");
  const [amount, setAmount] = useState("");

  const usdcBal = useReadContract({
    address: addrs?.usdc,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!addrs?.usdc },
  });
  const usdmBal = useReadContract({
    address: live ? addrs!.usdm : undefined,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address && live },
  });
  const allowance = useReadContract({
    address: addrs?.usdc,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: address && live ? [address, addrs!.vault] : undefined,
    query: { enabled: !!address && live },
  });

  const valid = isValidAmount(amount);
  const amountUnits = valid ? toUnits(amount) : 0n;
  const balance = mode === "mint" ? usdcBal.data : usdmBal.data;
  const insufficient = valid && balance !== undefined && amountUnits > balance;
  const needsApproval =
    mode === "mint" && valid && allowance.data !== undefined && amountUnits > allowance.data;

  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
  const { isLoading: confirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  // refresh reads + clear the field after a confirmed tx
  useEffect(() => {
    if (isSuccess) {
      usdcBal.refetch();
      usdmBal.refetch();
      allowance.refetch();
      if (!needsApproval) setAmount("");
      reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccess]);

  useEffect(() => {
    reset();
  }, [mode, reset]);

  function submit() {
    if (!live || !address || !valid) return;
    if (mode === "mint") {
      if (needsApproval) {
        writeContract({ address: addrs!.usdc, abi: ERC20_ABI, functionName: "approve", args: [addrs!.vault, amountUnits] });
      } else {
        writeContract({ address: addrs!.mintRamp, abi: MINT_RAMP_ABI, functionName: "mint", args: [amountUnits] });
      }
    } else {
      writeContract({ address: addrs!.redeemRamp, abi: REDEEM_RAMP_ABI, functionName: "redeem", args: [amountUnits, address] });
    }
  }

  const busy = isPending || confirming;
  const cta = useMemo(() => {
    if (!isConnected) return "Connect wallet first";
    if (!live) return "Not yet deployed on this network";
    if (!valid) return mode === "mint" ? "Enter USDC amount" : "Enter USDM amount";
    if (insufficient) return "Insufficient balance";
    if (busy) return confirming ? "Confirming…" : "Check wallet…";
    if (mode === "mint") return needsApproval ? "Approve USDC" : "Mint USDM";
    return "Redeem USDC";
  }, [isConnected, live, valid, insufficient, busy, confirming, mode, needsApproval]);

  const disabled = !isConnected || !live || !valid || insufficient || busy;

  return (
    <div className="w-full max-w-md rounded-3xl border border-ink/10 bg-surface p-6 shadow-xl shadow-accent/5">
      {/* tabs */}
      <div className="mb-5 grid grid-cols-2 gap-1 rounded-full bg-bg-wash p-1">
        {(["mint", "redeem"] as Mode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => {
              setMode(m);
              setAmount("");
            }}
            className={`rounded-full py-2 text-[0.85rem] font-medium capitalize transition ${
              mode === m ? "bg-surface text-ink shadow-sm" : "text-ink-dim hover:text-ink-muted"
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      <p className="mb-2 text-[0.8rem] text-ink-muted">
        {mode === "mint" ? "Deposit USDC, receive USDM 1:1." : "Burn USDM, receive USDC 1:1."}
      </p>

      {/* amount input */}
      <div className="rounded-2xl border border-ink/10 bg-bg px-4 py-3.5">
        <div className="flex items-center justify-between">
          <input
            inputMode="decimal"
            placeholder="0.0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full bg-transparent font-display text-2xl text-ink outline-none placeholder:text-ink-dim"
          />
          <span className="ml-3 shrink-0 rounded-full bg-accent-soft px-3 py-1 font-mono text-[0.8rem] font-medium text-accent-deep">
            {mode === "mint" ? "USDC" : "USDM"}
          </span>
        </div>
        <div className="mt-2 flex items-center justify-between text-[0.74rem] text-ink-dim">
          <span>
            Balance: {displayUnits(balance)} {mode === "mint" ? "USDC" : "USDM"}
          </span>
          {balance !== undefined && balance > 0n && (
            <button
              type="button"
              onClick={() => setAmount(fromUnits(balance))}
              className="font-medium text-accent-deep hover:underline"
            >
              Max
            </button>
          )}
        </div>
      </div>

      {/* output preview */}
      <div className="mt-3 flex items-center justify-between px-1 text-[0.8rem] text-ink-muted">
        <span>You receive</span>
        <span className="font-mono text-ink">
          {valid ? amount : "0.0"} {mode === "mint" ? "USDM" : "USDC"}
        </span>
      </div>

      <button
        type="button"
        onClick={submit}
        disabled={disabled}
        className="mt-5 w-full rounded-2xl bg-accent py-3.5 text-[0.95rem] font-semibold text-white transition hover:bg-accent-deep disabled:cursor-not-allowed disabled:bg-ink/15 disabled:text-ink-dim"
      >
        {cta}
      </button>

      {isSuccess && !busy && (
        <p className="mt-3 text-center text-[0.78rem] text-emerald-600">Confirmed on-chain ✓</p>
      )}
      {error && (
        <p className="mt-3 text-center text-[0.78rem] text-red-500">
          {/* surface only the short reason, not the full stack */}
          {(error as { shortMessage?: string }).shortMessage ?? "Transaction rejected"}
        </p>
      )}
    </div>
  );
}
