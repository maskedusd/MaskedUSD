"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { GripVertical } from "lucide-react";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import MaskIcon from "./MaskIcon";

/**
 * TokenComparison — "Two tokens, one protocol."
 *
 * A side-by-side-wipe between two REAL DOM panels (not images): the $USDM
 * product panel and the $MUSD access/utility panel. Both panels are full-size
 * and stacked; the TOP ($MUSD) panel is clipped with
 * `clip-path: inset(0 0 0 <inset>%)` so dragging the divider wipes between them.
 *
 * Each panel's content is anchored to its OWN half (md:w-1/2 + side margin), so
 * at the rest position (inset = 50%) you read $USDM on the left and $MUSD on the
 * right simultaneously — a clean side-by-side you can also wipe. Equal weight to
 * both tokens.
 *
 * Framing: the two tokens are COMPLEMENTARY, not competitors — $MUSD is the
 * access/utility layer for the $USDM product ("not just a Clanker token").
 *
 * Honesty: $USDM mechanism is present-tense. $MUSD utility is labelled PLANNED;
 * NO yield/APY numbers, no live/deployed/audited claims.
 *
 * Accessibility: the grip is a real slider — role="slider" with
 * aria-valuemin/max/now + aria-label and Arrow / Home / End / PageUp-Down
 * keyboard support. Both panels are real, screen-reader-accessible DOM
 * regardless of wipe position (clip-path hides pixels, not the a11y tree, and
 * the wipe is md+ only). Entrance motion respects prefers-reduced-motion.
 *
 * Responsive: on small screens a side-by-side wipe is too cramped, so the two
 * panels stack vertically as static cards (both fully visible, no wipe). The
 * interactive wipe slider appears on md+.
 */

const EASE_OUT: [number, number, number, number] = [0.16, 0.84, 0.3, 1];

// Slider travel + keyboard steps (in %). Kept off the very edges so a sliver of
// the under-panel always peeks through, hinting that it can be wiped further.
const MIN_INSET = 6;
const MAX_INSET = 94;
const STEP = 4;
const STEP_LARGE = 12;

const clamp = (n: number): number => Math.min(MAX_INSET, Math.max(MIN_INSET, n));

interface TokenPanelProps {
  /** Anchor the content column to its own side so both read at inset = 50. */
  align: "left" | "right";
}

/* ── $USDM — the product (cooler white-lavender) ──────────────────────────── */

function UsdmPanel({ align }: TokenPanelProps) {
  return (
    <article
      className={`flex h-full w-full flex-col p-7 sm:p-9 md:w-1/2 lg:p-10 ${
        align === "right" ? "md:ml-auto" : ""
      }`}
    >
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

/* ── $MUSD — the access / utility layer (deeper / warmer lavender) ────────── */

function MusdPanel({ align }: TokenPanelProps) {
  return (
    <article
      className={`flex h-full w-full flex-col p-7 text-right sm:p-9 md:w-1/2 md:items-end lg:p-10 ${
        align === "right" ? "md:ml-auto" : ""
      }`}
    >
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
  const [inset, setInset] = useState(50);
  const [dragging, setDragging] = useState(false);
  const trackRef = useRef<HTMLDivElement | null>(null);

  // Translate a clientX into an inset %, clamped to the handle's travel range.
  const insetFromClientX = useCallback((clientX: number): number => {
    const el = trackRef.current;
    if (!el) return 50;
    const rect = el.getBoundingClientRect();
    if (rect.width === 0) return 50;
    return clamp(((clientX - rect.left) / rect.width) * 100);
  }, []);

  // Pointer events unify mouse + touch + pen, and pointer capture keeps the drag
  // tracking even when the cursor leaves the handle / track.
  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.currentTarget.setPointerCapture?.(e.pointerId);
      setDragging(true);
      setInset(insetFromClientX(e.clientX));
    },
    [insetFromClientX],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!dragging) return;
      setInset(insetFromClientX(e.clientX));
    },
    [dragging, insetFromClientX],
  );

  const stopDragging = useCallback(() => setDragging(false), []);

  // Safety net: clear drag state if the pointer is released / cancelled anywhere.
  useEffect(() => {
    if (!dragging) return;
    window.addEventListener("pointerup", stopDragging);
    window.addEventListener("pointercancel", stopDragging);
    return () => {
      window.removeEventListener("pointerup", stopDragging);
      window.removeEventListener("pointercancel", stopDragging);
    };
  }, [dragging, stopDragging]);

  const onKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    switch (e.key) {
      case "ArrowLeft":
      case "ArrowDown":
        e.preventDefault();
        setInset((v) => clamp(v - STEP));
        break;
      case "ArrowRight":
      case "ArrowUp":
        e.preventDefault();
        setInset((v) => clamp(v + STEP));
        break;
      case "PageDown":
        e.preventDefault();
        setInset((v) => clamp(v - STEP_LARGE));
        break;
      case "PageUp":
        e.preventDefault();
        setInset((v) => clamp(v + STEP_LARGE));
        break;
      case "Home":
        e.preventDefault();
        setInset(MIN_INSET);
        break;
      case "End":
        e.preventDefault();
        setInset(MAX_INSET);
        break;
      default:
        break;
    }
  }, []);

  const reveal: Variants = {
    hidden: { opacity: 0, y: reduceMotion ? 0 : 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: reduceMotion ? 0 : 0.7, ease: EASE_OUT },
    },
  };

  const ariaNow = Math.round(inset);

  return (
    <section className="relative w-full overflow-hidden bg-bg py-24 md:py-32">
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

        {/* ── Mobile (< md): stacked static cards, both fully visible ──────── */}
        <motion.div
          variants={reveal}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="mt-12 grid gap-5 md:hidden"
        >
          <div className="overflow-hidden rounded-3xl border border-ink/10 bg-gradient-to-br from-surface to-bg-wash shadow-[0_30px_70px_-50px_rgba(107,79,207,0.5)]">
            <UsdmPanel align="left" />
          </div>
          <div className="overflow-hidden rounded-3xl border border-accent/20 bg-gradient-to-bl from-bg-wash to-[#e2d4f3] shadow-[0_30px_70px_-50px_rgba(107,79,207,0.6)]">
            <MusdPanel align="left" />
          </div>
        </motion.div>

        {/* ── md+ : side-by-side wipe ─────────────────────────────────────── */}
        <motion.div
          variants={reveal}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="mt-14 hidden md:block"
        >
          <div
            ref={trackRef}
            onPointerMove={onPointerMove}
            className={`relative aspect-[2.1/1] w-full select-none overflow-hidden rounded-[28px] border border-ink/10 shadow-[0_50px_120px_-60px_rgba(107,79,207,0.5)] lg:aspect-[2.4/1] ${
              dragging ? "cursor-ew-resize" : ""
            }`}
          >
            {/* BASE layer — $USDM, anchored left, always fully shown. */}
            <div className="absolute inset-0 bg-gradient-to-br from-surface to-bg-wash">
              <UsdmPanel align="left" />
            </div>

            {/* TOP layer — $MUSD, anchored right, clipped from the left edge by
                `inset` so the divider wipes between panels. The clip hides
                pixels only — the panel stays real DOM in the a11y tree. */}
            <div
              className="absolute inset-0 bg-gradient-to-bl from-bg-wash to-[#e2d4f3]"
              style={{ clipPath: `inset(0 0 0 ${inset}%)` }}
            >
              <MusdPanel align="right" />
            </div>

            {/* Divider line — purely decorative; the handle below is the control. */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 z-10 w-px -translate-x-1/2 bg-gradient-to-b from-accent/25 via-accent-deep/65 to-accent/25"
              style={{ left: `${inset}%` }}
            />

            {/* Grip handle — the real slider. */}
            <div
              role="slider"
              tabIndex={0}
              aria-label="Wipe between the $USDM and $MUSD token panels"
              aria-orientation="horizontal"
              aria-valuemin={MIN_INSET}
              aria-valuemax={MAX_INSET}
              aria-valuenow={ariaNow}
              aria-valuetext={`${ariaNow}% — right reveals $MUSD, left reveals $USDM`}
              onPointerDown={onPointerDown}
              onKeyDown={onKeyDown}
              style={{ left: `${inset}%` }}
              className="absolute top-1/2 z-20 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize touch-none items-center justify-center rounded-full border border-ink/10 bg-surface/90 text-ink-muted shadow-[0_10px_28px_-12px_rgba(27,20,56,0.5)] backdrop-blur-sm transition-colors hover:text-accent-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
            >
              <GripVertical className="h-5 w-5" aria-hidden="true" />
            </div>
          </div>

          {/* Connective line under the slider — restates the thesis. */}
          <p className="mt-6 text-center font-mono text-[0.72rem] uppercase tracking-[0.16em] text-ink-dim">
            Drag to compare &middot; $MUSD is the access layer for the $USDM
            product
          </p>
        </motion.div>
      </div>
    </section>
  );
}
