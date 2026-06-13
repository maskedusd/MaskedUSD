"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import MaskIcon from "../MaskIcon";

/**
 * Shared scaffolding for the interactive "phone screen" mockups used in the
 * HowItWorks steps. The screens are authored at a fixed 472×637 canvas and
 * scaled to fit whatever width the card column gives them (ResizeObserver →
 * CSS transform), so the same pixel-precise design works on mobile and desktop.
 *
 * Exports the frame plus the small atoms the three screens share: status bar,
 * app header, token badges, the shield glyph, and the press-able ActionButton.
 */

const W = 472;
const H = 637;

/* ── Status bar ────────────────────────────────────────────────────────────── */

function StatusBar() {
  return (
    <div className="flex items-center justify-between">
      <span className="font-display text-[13px] font-semibold text-ink">9:41</span>
      <div className="flex items-center gap-1.5">
        {/* signal */}
        <div className="flex items-end gap-[2px]">
          {[5, 8, 11, 14].map((h) => (
            <span
              key={h}
              style={{ height: h }}
              className="w-[3px] rounded-[1px] bg-ink"
            />
          ))}
        </div>
        {/* wifi */}
        <svg width="17" height="13" viewBox="0 0 17 13" fill="none" aria-hidden="true">
          <path
            d="M8.5 11.2l2.2-2.7a3.4 3.4 0 0 0-4.4 0l2.2 2.7zM8.5 4.2c2.3 0 4.4.9 6 2.4l1.4-1.7A11 11 0 0 0 8.5 2 11 11 0 0 0 1.1 4.9L2.5 6.6a8.7 8.7 0 0 1 6-2.4z"
            fill="currentColor"
            className="text-ink"
          />
        </svg>
        {/* battery */}
        <span className="flex items-center">
          <span className="flex h-[12px] w-[22px] items-center rounded-[3px] border-[1.5px] border-ink/80 p-[1.5px]">
            <span className="block h-full w-full rounded-[1px] bg-ink" />
          </span>
          <span className="ml-[1px] h-[4px] w-[2px] rounded-r-[1px] bg-ink/80" />
        </span>
      </div>
    </div>
  );
}

/* ── App header ────────────────────────────────────────────────────────────── */

function AppHeader() {
  return (
    <div className="mt-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <MaskIcon width={26} />
        <span className="font-display text-[17px] font-bold tracking-tight text-ink">
          MaskedUSD
        </span>
      </div>
      <span className="rounded-full border border-ink/15 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted">
        Base
      </span>
    </div>
  );
}

/* ── Token badges ──────────────────────────────────────────────────────────── */

/** White domino-mask glyph for the $USDM badge (MaskIcon is fixed-lavender). */
function WhiteMask({ width = 22 }: { width?: number }) {
  return (
    <svg
      viewBox="0 0 120 64"
      width={width}
      height={(width * 64) / 120}
      aria-hidden="true"
    >
      <path
        d="M14 14 C 8 14, 4 22, 4 32 C 4 46, 14 56, 28 56 L 50 56 C 56 56, 58 50, 60 50 C 62 50, 64 56, 70 56 L 92 56 C 106 56, 116 46, 116 32 C 116 22, 112 14, 106 14 C 96 14, 86 18, 78 22 C 72 25, 66 26, 60 26 C 54 26, 48 25, 42 22 C 34 18, 24 14, 14 14 Z"
        fill="#ffffff"
      />
      <ellipse cx="32" cy="34" rx="9" ry="6" fill="#8b6fe0" />
      <ellipse cx="88" cy="34" rx="9" ry="6" fill="#8b6fe0" />
    </svg>
  );
}

export function UsdcBadge() {
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#2775CA] font-display text-[15px] font-bold text-white">
      $
    </span>
  );
}

export function UsdmBadge() {
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent shadow-[0_8px_18px_-8px_rgba(107,79,207,0.7)]">
      <WhiteMask width={21} />
    </span>
  );
}

/** Masked shield for the shielded-balance header. */
export function ShieldGlyph({ size = 26 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="text-accent-deep"
    >
      <path
        d="M12 2.6l7 2.7v5.2c0 4.6-3.1 7.8-7 9.2-3.9-1.4-7-4.6-7-9.2V5.3l7-2.7z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="9.4" cy="11" r="1.15" fill="currentColor" />
      <circle cx="14.6" cy="11" r="1.15" fill="currentColor" />
    </svg>
  );
}

/* ── Action button (hover-grow, press, no-op) ──────────────────────────────── */

export function ActionButton({
  children,
  variant = "dark",
}: {
  children: ReactNode;
  variant?: "dark" | "light";
}) {
  const reduce = useReducedMotion();
  const base =
    "flex w-full items-center justify-center gap-2 rounded-full py-3.5 text-[15px] font-semibold";
  const skin =
    variant === "dark"
      ? "bg-ink text-white shadow-[0_16px_32px_-16px_rgba(27,20,56,0.6)]"
      : "border border-ink/12 bg-white text-ink shadow-[0_14px_30px_-18px_rgba(27,20,56,0.4)]";
  return (
    <motion.button
      type="button"
      whileHover={reduce ? undefined : { scale: 1.03 }}
      whileTap={reduce ? undefined : { scale: 0.96 }}
      transition={{ type: "spring", stiffness: 420, damping: 24 }}
      className={`${base} ${skin}`}
    >
      {children}
    </motion.button>
  );
}

/* ── Frame ─────────────────────────────────────────────────────────────────── */

export default function PhoneFrame({
  children,
  footer,
}: {
  children: ReactNode;
  footer?: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setScale(el.clientWidth / W);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={ref} className="relative w-full" style={{ aspectRatio: `${W} / ${H}` }}>
      <div
        className="absolute left-0 top-0 origin-top-left"
        style={{
          width: W,
          height: H,
          transform: `scale(${scale})`,
          opacity: scale ? 1 : 0,
          background:
            "linear-gradient(180deg, #ffffff 0%, #ffffff 26%, #f4effb 72%, #ece2f6 100%)",
        }}
      >
        <div className="flex h-full flex-col px-6 pb-5 pt-3.5">
          <StatusBar />
          <AppHeader />
          <div className="mt-5 flex min-h-0 flex-1 flex-col">{children}</div>
          {footer && (
            <p className="mt-3 text-center font-mono text-[10.5px] uppercase tracking-[0.16em] text-ink-dim">
              {footer}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
