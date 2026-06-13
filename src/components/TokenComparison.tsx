"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import MaskIcon from "./MaskIcon";

/**
 * TokenComparison — "Two tokens, one protocol."
 *
 * A clean, static side-by-side of the two MaskedUSD tokens: the $USDM product
 * panel (cooler white-lavender, left) and the $MUSD access/utility panel
 * (deeper lavender, right), framed in one box split by a center divider — a
 * single frame reinforces the "one protocol" thesis. On mobile the two panels
 * stack as separate cards.
 *
 * Framing: the two tokens are COMPLEMENTARY, not competitors — $MUSD is the
 * access/utility layer for the $USDM product ("not just a Clanker token").
 *
 * Honesty: $USDM mechanism is present-tense. $MUSD is pre-launch ("Launching on
 * Clanker") and its utility is labelled PLANNED; NO yield/APY numbers, no
 * live/deployed/audited claims.
 */

const EASE_OUT: [number, number, number, number] = [0.16, 0.84, 0.3, 1];

/* ── $USDM — the product (cooler white-lavender, left-aligned) ─────────────── */

function UsdmPanel() {
  return (
    <article className="flex h-full w-full flex-col p-7 sm:p-9 lg:p-10">
      <header className="flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-ink/10 bg-surface/80 shadow-[0_8px_22px_-14px_rgba(107,79,207,0.55)]">
          <MaskIcon width={26} />
        </span>
        <div>
          <p className="font-display text-xl font-bold tracking-tight text-ink">
            $USDM
          </p>
          <p className="font-mono text-[0.62rem] uppercase tracking-[0.16em] text-accent-deep">
            The product
          </p>
        </div>
      </header>

      <p className="mt-6 max-w-[22rem] text-[0.95rem] font-medium leading-snug text-ink">
        The private dollar you hold and spend.
      </p>
      <p className="mt-2 max-w-[22rem] text-sm leading-relaxed text-ink-muted">
        1:1 native-USDC-backed on Base, with balances and transfers shielded by
        dZK Proof.
      </p>

      <ul className="mt-6 space-y-2.5">
        {[
          "1:1 native-USDC-backed on Base",
          "Balances & transfers shielded by dZK Proof",
          "Redeemable to USDC, anytime",
        ].map((attr) => (
          <li
            key={attr}
            className="flex items-start gap-2.5 text-sm text-ink-muted"
          >
            <span
              aria-hidden="true"
              className="mt-[0.45rem] h-1.5 w-1.5 shrink-0 rounded-full bg-accent"
            />
            <span>{attr}</span>
          </li>
        ))}
      </ul>

      <span className="mt-auto inline-flex w-fit items-center gap-2 rounded-full border border-ink/10 bg-surface/70 px-3 py-1.5 font-mono text-[0.6rem] uppercase tracking-[0.14em] text-ink-dim">
        Backed &middot; Shielded &middot; Redeemable
      </span>
    </article>
  );
}

/* ── $MUSD — the access / utility layer (deeper lavender, right-aligned) ───── */

function MusdPanel() {
  return (
    <article className="flex h-full w-full flex-col items-end p-7 text-right sm:p-9 lg:p-10">
      <header className="flex flex-row-reverse items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-accent/25 bg-accent-soft shadow-[0_8px_22px_-14px_rgba(107,79,207,0.6)]">
          <MaskIcon width={26} />
        </span>
        <div>
          <p className="font-display text-xl font-bold tracking-tight text-ink">
            $MUSD
          </p>
          <p className="font-mono text-[0.62rem] uppercase tracking-[0.16em] text-accent-deep">
            Access &amp; utility
          </p>
        </div>
      </header>

      <p className="mt-6 max-w-[22rem] text-[0.95rem] font-medium leading-snug text-ink">
        The community and access layer for the protocol.
      </p>
      <p className="mt-2 max-w-[22rem] text-sm leading-relaxed text-ink-muted">
        Launching on Clanker. Holding $MUSD is how you plug into the $USDM
        product — not just a Clanker token.
      </p>

      <ul className="mt-6 space-y-2.5">
        {[
          "Community & distribution layer",
          "Fee discounts on USDC → $USDM (planned)",
          "Public, tradable token on Base",
        ].map((attr) => (
          <li
            key={attr}
            className="flex flex-row-reverse items-start gap-2.5 text-sm text-ink-muted"
          >
            <span
              aria-hidden="true"
              className="mt-[0.45rem] h-1.5 w-1.5 shrink-0 rounded-full bg-accent-deep"
            />
            <span>{attr}</span>
          </li>
        ))}
      </ul>

      <span className="mt-auto inline-flex w-fit items-center gap-2 rounded-full border border-accent/25 bg-accent-soft px-3 py-1.5 font-mono text-[0.6rem] uppercase tracking-[0.14em] text-accent-deep">
        Planned utility
      </span>
    </article>
  );
}

export default function TokenComparison() {
  const reduceMotion = useReducedMotion();

  const reveal: Variants = {
    hidden: { opacity: 0, y: reduceMotion ? 0 : 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: reduceMotion ? 0 : 0.7, ease: EASE_OUT },
    },
  };

  return (
    <section
      id="tokens"
      className="relative w-full overflow-hidden bg-bg py-24 md:py-32"
    >
      {/* Soft centred lavender glow tying the two sides together. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[560px] w-[820px] max-w-[120%] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[130px]"
        style={{
          background:
            "radial-gradient(circle, rgba(139,111,224,0.16) 0%, rgba(139,111,224,0.05) 50%, rgba(139,111,224,0) 74%)",
        }}
      />

      <div className="mx-auto w-full max-w-[1180px] px-5 sm:px-6">
        {/* ── Section header ──────────────────────────────────────────────── */}
        <motion.div
          variants={reveal}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.5 }}
          className="max-w-2xl"
        >
          <span className="inline-flex items-center gap-2 font-mono text-[0.7rem] uppercase tracking-[0.22em] text-accent-deep">
            <span className="status-dot" aria-hidden="true" />
            Two tokens, one protocol
          </span>
          <h2 className="mt-5 font-display text-3xl font-bold leading-[1.06] tracking-tight text-ink sm:text-4xl lg:text-5xl">
            $USDM &amp; $MUSD, side by side.
          </h2>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-ink-muted sm:text-lg">
            They&apos;re complementary, not competitors. $USDM is the private
            dollar you hold; $MUSD is the access and utility layer that plugs you
            into it — two roles in one protocol.
          </p>
        </motion.div>

        {/* ── Mobile (< md): stacked cards ────────────────────────────────── */}
        <motion.div
          variants={reveal}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="mt-12 grid gap-5 md:hidden"
        >
          <div className="overflow-hidden rounded-3xl border border-ink/10 bg-gradient-to-br from-surface to-bg-wash shadow-[0_30px_70px_-50px_rgba(107,79,207,0.5)]">
            <UsdmPanel />
          </div>
          <div className="overflow-hidden rounded-3xl border border-accent/20 bg-gradient-to-bl from-bg-wash to-[#e2d4f3] shadow-[0_30px_70px_-50px_rgba(107,79,207,0.6)]">
            <MusdPanel />
          </div>
        </motion.div>

        {/* ── md+ : static side-by-side, one frame split by a center divider ─ */}
        <motion.div
          variants={reveal}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="relative mt-14 hidden grid-cols-2 items-stretch overflow-hidden rounded-[28px] border border-ink/10 shadow-[0_50px_120px_-60px_rgba(107,79,207,0.5)] md:grid"
        >
          <div className="bg-gradient-to-br from-surface to-bg-wash">
            <UsdmPanel />
          </div>
          <div className="bg-gradient-to-bl from-bg-wash to-[#e2d4f3]">
            <MusdPanel />
          </div>
          {/* Center divider between the two halves. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-gradient-to-b from-accent/15 via-accent-deep/40 to-accent/15"
          />
        </motion.div>

        {/* Connective line — restates the thesis. */}
        <motion.p
          variants={reveal}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.5 }}
          className="mt-8 text-center font-mono text-[0.72rem] uppercase tracking-[0.16em] text-ink-dim"
        >
          $MUSD is the access layer for the $USDM product
        </motion.p>
      </div>
    </section>
  );
}
