"use client";

import {
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { Check, Copy } from "lucide-react";
import MaskIcon from "./MaskIcon";

type TokenId = "usdm" | "musd";

/* ── Contract address field ────────────────────────────────────────────────
 * With an `address`: the live Base contract, truncated, solid border, click to
 * copy the full address ($USDM is live on Base mainnet). Without one: a
 * clearly-pending "TBA" slot (dashed = placeholder) — $MUSD until it deploys. */
function ContractField({
  align = "left",
  address,
}: {
  align?: "left" | "right";
  address?: `0x${string}`;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked — no-op */
    }
  }

  return (
    <div
      className={`flex flex-col gap-1.5 ${
        align === "right" ? "items-end" : "items-start"
      }`}
    >
      <span className="font-mono text-[0.56rem] uppercase tracking-[0.18em] text-ink-dim">
        Contract · Base
      </span>
      {address ? (
        <button
          type="button"
          onClick={copy}
          title={address}
          aria-label={`Copy contract address ${address}`}
          className="inline-flex items-center gap-2 rounded-lg border border-ink/15 bg-surface/60 px-3 py-1.5 font-mono text-[0.72rem] tracking-wider text-ink-muted transition-colors hover:border-accent/40 hover:text-ink"
        >
          {address.slice(0, 6)}…{address.slice(-4)}
          {copied ? (
            <Check size={12} className="text-accent-deep" />
          ) : (
            <Copy size={12} className="opacity-60" />
          )}
        </button>
      ) : (
        <span className="inline-flex items-center gap-2 rounded-lg border border-dashed border-ink/20 bg-surface/60 px-3 py-1.5 font-mono text-[0.72rem] tracking-wider text-ink-muted">
          <span className="text-ink-dim/60">0x</span>
          TBA
        </span>
      )}
    </div>
  );
}

/**
 * TokenComparison — "Two tokens, one protocol."
 *
 * A clean, static side-by-side of the two MaskedUSD tokens: the $USDM product
 * panel (cooler white-lavender, left) and the $MUSD access/utility panel
 * (deeper lavender, right), framed in one box split by a center divider — a
 * single frame reinforces the "one protocol" thesis. On mobile the two panels
 * stack as separate cards.
 *
 * Framing: the two tokens are COMPLEMENTARY, not competitors — but distinct.
 * $USDM is the backed product; $MUSD is a separate, volatile, UNBACKED
 * ecosystem/utility token (not a second stablecoin, can go to zero).
 *
 * Honesty: $USDM is live on Base (real contract address, copyable). $MUSD is
 * pre-launch ("Launching on Clanker"), utility labelled PLANNED, with a persistent
 * "volatile · not backed" disclaimer; NO yield/APY, no audited claims.
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

      <div className="mt-auto flex flex-col gap-4 pt-7">
        <ContractField align="left" address="0x09a4184daEdaCdcCcded6087f576E57a05950fef" />
        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-ink/10 bg-surface/70 px-3 py-1.5 font-mono text-[0.6rem] uppercase tracking-[0.14em] text-ink-dim">
          Backed &middot; Shielded &middot; Redeemable
        </span>
      </div>
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
        The ecosystem and access layer for the protocol.
      </p>
      <p className="mt-2 max-w-[22rem] text-sm leading-relaxed text-ink-muted">
        Launching on Clanker. A volatile, unbacked ecosystem token — not a
        second stablecoin. It plugs you into the protocol&apos;s utility and
        community.
      </p>

      <ul className="mt-6 space-y-2.5">
        {[
          "Ecosystem & access layer",
          "Capped fee discount on the ramp (planned)",
          "Volatile · not backed · can go to zero",
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

      <div className="mt-auto flex flex-col items-end gap-4 pt-7">
        <ContractField align="right" />
        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-accent/25 bg-accent-soft px-3 py-1.5 font-mono text-[0.6rem] uppercase tracking-[0.14em] text-accent-deep">
          Volatile &middot; Not backed
        </span>
      </div>
    </article>
  );
}

/* ── md+ card shell that enlarges / prioritizes on hover ───────────────────── */

function TokenCard({
  id,
  hovered,
  setHovered,
  reduceMotion,
  className,
  children,
}: {
  id: TokenId;
  hovered: TokenId | null;
  setHovered: Dispatch<SetStateAction<TokenId | null>>;
  reduceMotion: boolean;
  className: string;
  children: ReactNode;
}) {
  const isHover = hovered === id;
  const otherHover = hovered !== null && hovered !== id;
  return (
    <motion.div
      onHoverStart={() => setHovered(id)}
      onHoverEnd={() => setHovered((cur) => (cur === id ? null : cur))}
      animate={
        reduceMotion
          ? undefined
          : {
              scale: isHover ? 1.04 : otherHover ? 0.975 : 1,
              y: isHover ? -8 : 0,
              opacity: otherHover ? 0.72 : 1,
            }
      }
      transition={{ type: "spring", stiffness: 320, damping: 28 }}
      style={{ zIndex: isHover ? 2 : 1 }}
      className={`relative overflow-hidden rounded-[28px] border transition-shadow duration-300 ${className} ${
        isHover
          ? "shadow-[0_55px_130px_-42px_rgba(107,79,207,0.62)]"
          : "shadow-[0_30px_80px_-55px_rgba(107,79,207,0.5)]"
      }`}
    >
      {children}
    </motion.div>
  );
}

export default function TokenComparison() {
  const reduceMotion = useReducedMotion() ?? false;
  const [hovered, setHovered] = useState<TokenId | null>(null);

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
      className="relative w-full overflow-hidden bg-surface py-24 md:py-32"
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

        {/* ── md+ : two side-by-side cards that enlarge / prioritize on hover ─ */}
        <motion.div
          variants={reveal}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="mt-14 hidden grid-cols-2 items-stretch gap-4 md:grid lg:gap-5"
        >
          <TokenCard
            id="usdm"
            hovered={hovered}
            setHovered={setHovered}
            reduceMotion={reduceMotion}
            className="border-ink/10 bg-gradient-to-br from-surface to-bg-wash"
          >
            <UsdmPanel />
          </TokenCard>
          <TokenCard
            id="musd"
            hovered={hovered}
            setHovered={setHovered}
            reduceMotion={reduceMotion}
            className="border-accent/20 bg-gradient-to-bl from-bg-wash to-[#e2d4f3]"
          >
            <MusdPanel />
          </TokenCard>
        </motion.div>

        {/* Connective line — restates the thesis. */}
        <motion.p
          variants={reveal}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.5 }}
          className="mt-8 text-center font-mono text-[0.72rem] uppercase tracking-[0.16em] text-ink-dim"
        >
          $MUSD is a separate, volatile, unbacked token — not $USDM, not a stablecoin
        </motion.p>
      </div>
    </section>
  );
}
