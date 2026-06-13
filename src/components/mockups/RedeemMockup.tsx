"use client";

import { useState, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowDown } from "lucide-react";
import PhoneFrame, { ActionButton, UsdcBadge, UsdmBadge } from "./PhoneFrame";

/**
 * Step 03 — Redeem to USDC. Same interactive twist as Step 01: tapping the
 * middle arrow swaps the two tokens ($USDM ⇄ USDC) with a shared-layout slide
 * (the You redeem / You receive labels stay fixed); the arrow spins. The
 * "Redeem to USDC" button grows on hover and depresses on click, but is inert.
 */

type Token = {
  id: string;
  badge: ReactNode;
  name: string;
  sub: string;
  amount: string;
  unit: string;
  /** Tint the amount with the accent (used for the USDC "you receive" leg). */
  accent?: boolean;
};

const USDM: Token = {
  id: "usdm",
  badge: <UsdmBadge />,
  name: "$USDM",
  sub: "Available ••••",
  amount: "500.00",
  unit: "$USDM",
};

const USDC: Token = {
  id: "usdc",
  badge: <UsdcBadge />,
  name: "USDC",
  sub: "Native · Base",
  amount: "499.50",
  unit: "USDC",
  accent: true,
};

function TokenRow({ token, reduce }: { token: Token; reduce: boolean }) {
  return (
    <motion.div
      layoutId={reduce ? undefined : `redeem-${token.id}`}
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
        <p
          className={`font-display text-[23px] font-bold leading-none ${
            token.accent ? "text-accent-deep" : "text-ink"
          }`}
        >
          {token.amount}
        </p>
        <p className="mt-1 font-mono text-[9.5px] uppercase tracking-[0.12em] text-ink-dim">
          {token.unit}
        </p>
      </div>
    </motion.div>
  );
}

export default function RedeemMockup() {
  const reduce = useReducedMotion() ?? false;
  const [swapped, setSwapped] = useState(false);
  const top = swapped ? USDC : USDM;
  const bottom = swapped ? USDM : USDC;

  return (
    <PhoneFrame footer="No lockups · Redeem anytime">
      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-accent-deep">
        Redeem
      </p>
      <h4 className="mt-1.5 font-display text-[26px] font-bold tracking-tight text-ink">
        Redeem to USDC
      </h4>

      <div className="relative mt-4">
        {/* You redeem (raised white) */}
        <div className="rounded-2xl border border-ink/[0.06] bg-white px-4 pb-3.5 pt-3 shadow-[0_18px_40px_-28px_rgba(27,20,56,0.45)]">
          <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-dim">
            You redeem
          </p>
          <TokenRow token={top} reduce={reduce} />
        </div>

        {/* Swap arrow */}
        <div className="relative z-10 -my-3.5 flex justify-center">
          <motion.button
            type="button"
            onClick={() => setSwapped((s) => !s)}
            animate={{ rotate: swapped ? 180 : 0 }}
            whileTap={reduce ? undefined : { scale: 0.88 }}
            transition={{ type: "spring", stiffness: 400, damping: 22 }}
            aria-label="Swap tokens"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-ink/10 bg-white text-accent-deep shadow-[0_10px_24px_-10px_rgba(107,79,207,0.6)]"
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
          Rate <span className="text-ink">1 $USDM = 1 USDC</span>
        </span>
        <span>
          Redemption fee <span className="text-ink">0.10%</span>
        </span>
      </div>

      <div className="flex-1" />

      <ActionButton variant="dark">Redeem to USDC</ActionButton>
    </PhoneFrame>
  );
}
