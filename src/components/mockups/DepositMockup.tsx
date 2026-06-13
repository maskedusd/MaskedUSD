"use client";

import { useState, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowDown } from "lucide-react";
import PhoneFrame, { ActionButton, UsdcBadge, UsdmBadge } from "./PhoneFrame";

/**
 * Step 01 — Deposit & mint. Interactive twist: tapping the middle arrow swaps
 * the two tokens (USDC ⇄ $USDM) with a shared-layout slide; the arrow spins.
 * The "Deposit & mint" button grows on hover and depresses on click, but is
 * inert (this is a marketing mockup, not the live app).
 */

type Token = {
  id: string;
  badge: ReactNode;
  name: string;
  sub: string;
  amount: string;
  unit: string;
};

const USDC: Token = {
  id: "usdc",
  badge: <UsdcBadge />,
  name: "USDC",
  sub: "Native · Base",
  amount: "1,000.00",
  unit: "USDC",
};

const USDM: Token = {
  id: "usdm",
  badge: <UsdmBadge />,
  name: "$USDM",
  sub: "Backed 1:1 by USDC",
  amount: "1,000.00",
  unit: "$USDM",
};

function TokenRow({ token, reduce }: { token: Token; reduce: boolean }) {
  return (
    <motion.div
      layoutId={reduce ? undefined : `tok-${token.id}`}
      transition={{ type: "spring", stiffness: 360, damping: 30 }}
      className="flex items-center justify-between"
    >
      <div className="flex items-center gap-3">
        {token.badge}
        <div>
          <p className="font-display text-[16px] font-bold leading-tight text-ink">
            {token.name}
          </p>
          <p className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-ink-dim">
            {token.sub}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className="font-display text-[23px] font-bold leading-none text-ink">
          {token.amount}
        </p>
        <p className="mt-1 font-mono text-[9.5px] uppercase tracking-[0.12em] text-ink-dim">
          {token.unit}
        </p>
      </div>
    </motion.div>
  );
}

export default function DepositMockup() {
  const reduce = useReducedMotion() ?? false;
  const [swapped, setSwapped] = useState(false);
  const top = swapped ? USDM : USDC;
  const bottom = swapped ? USDC : USDM;

  return (
    <PhoneFrame footer="1:1 redeemable anytime">
      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-accent-deep">
        Deposit &amp; mint
      </p>
      <h4 className="mt-1.5 font-display text-[26px] font-bold tracking-tight text-ink">
        Mint $USDM
      </h4>

      <div className="relative mt-4">
        {/* You deposit (raised white) */}
        <div className="rounded-2xl border border-ink/[0.06] bg-white px-4 pb-3.5 pt-3 shadow-[0_18px_40px_-28px_rgba(27,20,56,0.45)]">
          <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-dim">
            You deposit
          </p>
          <TokenRow token={top} reduce={reduce} />
        </div>

        {/* Swap arrow */}
        <div className="relative z-10 -my-3.5 flex justify-center">
          <motion.button
            type="button"
            onClick={() => setSwapped((s) => !s)}
            animate={{ rotate: swapped ? 180 : 0 }}
            whileHover={reduce ? undefined : { scale: 1.18 }}
            whileTap={reduce ? undefined : { scale: 0.9 }}
            transition={{ type: "spring", stiffness: 400, damping: 22 }}
            aria-label="Swap tokens"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-ink/10 bg-white text-accent-deep shadow-[0_10px_24px_-10px_rgba(107,79,207,0.6)] hover:shadow-[0_14px_30px_-10px_rgba(107,79,207,0.7)]"
          >
            <ArrowDown size={16} strokeWidth={2.4} />
          </motion.button>
        </div>

        {/* You receive (flat lavender) */}
        <div className="rounded-2xl border border-ink/[0.06] bg-[#f1ebfa] px-4 pb-3.5 pt-3">
          <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-dim">
            You receive
          </p>
          <TokenRow token={bottom} reduce={reduce} />
        </div>
      </div>

      {/* Rate row */}
      <div className="mt-4 flex items-center justify-between font-mono text-[11px] text-ink-muted">
        <span>
          Rate <span className="text-ink">1 USDC = 1 $USDM</span>
        </span>
        <span>
          Network fee <span className="text-ink">—</span>
        </span>
      </div>

      <div className="flex-1" />

      <ActionButton variant="dark">Deposit &amp; mint</ActionButton>
    </PhoneFrame>
  );
}
