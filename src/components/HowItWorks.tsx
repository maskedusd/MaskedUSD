"use client";

import { motion } from "framer-motion";
import SectionWithMockup from "./SectionWithMockup";
import DepositMockup from "./mockups/DepositMockup";
import ShieldMockup from "./mockups/ShieldMockup";
import RedeemMockup from "./mockups/RedeemMockup";

/**
 * "How it works" — the section directly under the hero. A short section header
 * (mono eyebrow + display heading) followed by three alternating
 * SectionWithMockup blocks, one per step of the $USDM flow:
 *   01  deposit native USDC on Base → mint $USDM 1:1
 *   02  balances & transfers shielded by dZK Proof
 *   03  redeem $USDM back to USDC 1:1
 *
 * Honesty: present-tense mechanism only — no live/deployed/audited or
 * yield/APY claims, no $MUSD staking.
 */

const HEADING_EASE: [number, number, number, number] = [0.16, 0.84, 0.3, 1];

export default function HowItWorks() {
  return (
    <div id="how-it-works" className="relative w-full bg-surface">
      {/* Section header */}
      <div className="mx-auto w-full max-w-[1180px] px-5 pt-24 sm:px-6 md:pt-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.7, ease: HEADING_EASE }}
          className="max-w-2xl"
        >
          <span className="inline-flex items-center gap-2 font-mono text-[0.7rem] uppercase tracking-[0.22em] text-accent-deep">
            <span className="status-dot" aria-hidden="true" />
            How it works
          </span>
          <h2 className="mt-5 font-display text-3xl font-bold leading-[1.06] tracking-tight text-ink sm:text-4xl lg:text-5xl">
            Private dollars, in three steps.
          </h2>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-ink-muted sm:text-lg">
            Deposit, go private, redeem. The same dollar you put in, with a
            balance only you can see.
          </p>
        </motion.div>
      </div>

      {/* Step 01 — Deposit & mint */}
      <SectionWithMockup
        stepLabel="Step 01"
        title={
          <>
            Deposit USDC,
            <br />
            mint $USDM.
          </>
        }
        description="Send native USDC on Base and receive $USDM 1:1. Your dollars stay fully backed — one $USDM for every USDC held in reserve."
        mockup={<DepositMockup />}
        secondaryImageSrc="/howitworks/card.png"
      />

      {/* Step 02 — Shielded by dZK */}
      <SectionWithMockup
        stepLabel="Step 02"
        title={
          <>
            Shielded by
            <br />
            dZK Proof.
          </>
        }
        description="Once minted, your $USDM balance and transfers are shielded by dZK (delegated zero-knowledge) Proof. Private by default — amounts and counterparties stay off the public ledger, while the math still proves every transfer is valid."
        mockup={<ShieldMockup />}
        secondaryImageSrc="/howitworks/card.png"
        reverseLayout
      />

      {/* Step 03 — Redeem anytime */}
      <SectionWithMockup
        stepLabel="Step 03"
        title={
          <>
            Redeem back
            <br />
            to USDC, anytime.
          </>
        }
        description="Burn $USDM and withdraw native USDC 1:1, minus fees, whenever you want. No lockups, no waiting on permission — your exit is always open."
        mockup={<RedeemMockup />}
        secondaryImageSrc="/howitworks/card.png"
      />
    </div>
  );
}
