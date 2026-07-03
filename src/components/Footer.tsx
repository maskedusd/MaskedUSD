"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import MaskIcon from "./MaskIcon";
import SmoothScrollLink from "./SmoothScrollLink";
import { XIcon, TelegramIcon, GitHubIcon } from "./BrandIcons";

/**
 * Footer — the closing band. Adapted from a generic 4-column footer to the
 * MaskedUSD brand: a deeper-lavender grounding band (alternates off the white
 * FAQ above), a final community CTA, brand + socials, an in-page "Explore"
 * column (smooth-scroll, no #hash), a real socials column, and a factual
 * "On Base" column. Everything reveals + staggers in on scroll; links and
 * socials animate on hover.
 *
 * Honesty: live on Base. No fake newsletter/contact details; socials are the real
 * X / Telegram; facts are present-tense, audits stay "planned" until published,
 * and the bottom bar carries the live / not-financial-advice disclaimer.
 */

const X_URL = "https://x.com/MaskedUSD";
const TELEGRAM_URL = "https://t.me/maskedusd";
const GITHUB_URL = "https://github.com/maskedusd";

const EASE_OUT: [number, number, number, number] = [0.16, 0.84, 0.3, 1];

const EXPLORE = [
  { label: "How it works", id: "how-it-works" },
  { label: "Privacy", id: "privacy" },
  { label: "Tokens", id: "tokens" },
  { label: "Roadmap", id: "roadmap" },
  { label: "FAQ", id: "faq" },
];

const USDM_BASESCAN = "https://basescan.org/token/0x09a4184daEdaCdcCcded6087f576E57a05950fef";

function ColTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-mono text-[0.66rem] uppercase tracking-[0.18em] text-ink-dim">
      {children}
    </p>
  );
}

export default function Footer() {
  const reduce = useReducedMotion();

  const container: Variants = {
    hidden: {},
    visible: {
      transition: { staggerChildren: reduce ? 0 : 0.08, delayChildren: 0.04 },
    },
  };
  const item: Variants = {
    hidden: { opacity: 0, y: reduce ? 0 : 18 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: reduce ? 0 : 0.6, ease: EASE_OUT },
    },
  };

  return (
    <footer className="relative w-full overflow-hidden border-t border-ink/[0.06] bg-bg-wash">
      {/* Ambient lavender glow rising from the bottom edge. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-40 left-1/2 -z-0 h-[520px] w-[880px] max-w-[120%] -translate-x-1/2 rounded-full blur-[140px]"
        style={{
          background:
            "radial-gradient(circle, rgba(139,111,224,0.18) 0%, rgba(139,111,224,0) 72%)",
        }}
      />

      <motion.div
        variants={container}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        className="relative z-10 mx-auto w-full max-w-[1180px] px-5 pb-10 pt-20 sm:px-6 md:pt-24"
      >
        {/* ── Final CTA strip ─────────────────────────────────────────────── */}
        <motion.div
          variants={item}
          className="flex flex-col gap-7 border-b border-ink/10 pb-14 md:flex-row md:items-end md:justify-between"
        >
          <div className="max-w-xl">
            <h2 className="font-display text-3xl font-bold leading-[1.08] tracking-tight text-ink sm:text-4xl">
              Hold dollars. <span className="text-accent-deep">Keep them private.</span>
            </h2>
            <p className="mt-3 text-base leading-relaxed text-ink-muted">
              $USDM is live on Base. Join the community and follow along as the
              ecosystem grows.
            </p>
          </div>
          <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
            <a
              href={TELEGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-medium text-white shadow-[0_10px_28px_-12px_rgba(27,20,56,0.5)] transition-transform hover:-translate-y-0.5"
            >
              <TelegramIcon size={16} />
              Join the community
            </a>
            <a
              href={X_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="glass inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-medium text-ink transition-colors hover:border-accent"
            >
              <XIcon size={14} />
              Follow @MaskedUSD
            </a>
          </div>
        </motion.div>

        {/* ── Columns ─────────────────────────────────────────────────────── */}
        <div className="mt-14 grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
          {/* Brand */}
          <motion.div variants={item}>
            <div className="flex items-center gap-2.5">
              <MaskIcon width={32} />
              <span className="font-display text-lg font-bold tracking-tight text-ink">
                MaskedUSD
              </span>
            </div>
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-ink-muted">
              Privacy stablecoin infrastructure on Base. 1:1 USDC-backed $USDM,
              shielded by dZK Proof.
            </p>
            <div className="mt-6 flex items-center gap-3">
              <a
                href={X_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="MaskedUSD on X"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-ink/10 bg-surface/60 text-ink-muted transition-all hover:scale-105 hover:border-accent/30 hover:text-ink"
              >
                <XIcon size={16} />
              </a>
              <a
                href={TELEGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="MaskedUSD on Telegram"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-ink/10 bg-surface/60 text-ink-muted transition-all hover:scale-105 hover:border-accent/30 hover:text-ink"
              >
                <TelegramIcon size={17} />
              </a>
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="MaskedUSD on GitHub"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-ink/10 bg-surface/60 text-ink-muted transition-all hover:scale-105 hover:border-accent/30 hover:text-ink"
              >
                <GitHubIcon size={17} />
              </a>
            </div>
          </motion.div>

          {/* Explore (in-page) */}
          <motion.div variants={item}>
            <ColTitle>Explore</ColTitle>
            <ul className="mt-5 space-y-3">
              {EXPLORE.map(({ label, id }) => (
                <li key={id}>
                  <SmoothScrollLink
                    targetId={id}
                    className="group inline-flex items-center gap-1 text-sm text-ink-muted transition-colors hover:text-ink"
                  >
                    {label}
                    <span className="-translate-x-1 text-accent opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100">
                      →
                    </span>
                  </SmoothScrollLink>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Community (external) */}
          <motion.div variants={item}>
            <ColTitle>Community</ColTitle>
            <ul className="mt-5 space-y-3">
              <li>
                <a
                  href={X_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-1.5 text-sm text-ink-muted transition-colors hover:text-ink"
                >
                  X / @MaskedUSD
                  <ArrowUpRight
                    size={13}
                    className="-translate-x-1 translate-y-0.5 opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:translate-y-0 group-hover:opacity-100"
                  />
                </a>
              </li>
              <li>
                <a
                  href={TELEGRAM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-2 text-sm text-ink-muted transition-colors hover:text-ink"
                >
                  Telegram
                  <span className="status-dot" aria-hidden="true" />
                </a>
              </li>
              <li>
                <a
                  href={GITHUB_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-1.5 text-sm text-ink-muted transition-colors hover:text-ink"
                >
                  GitHub
                  <ArrowUpRight
                    size={13}
                    className="-translate-x-1 translate-y-0.5 opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:translate-y-0 group-hover:opacity-100"
                  />
                </a>
              </li>
              <li>
                <a
                  href="/app"
                  className="inline-flex items-center gap-2 text-sm text-ink-muted transition hover:text-ink"
                >
                  Launch App
                  <span className="status-dot" aria-hidden="true" />
                </a>
              </li>
            </ul>
          </motion.div>

          {/* Resources */}
          <motion.div variants={item}>
            <ColTitle>Resources</ColTitle>
            <ul className="mt-5 space-y-3">
              <li>
                <a
                  href="/whitepaper"
                  className="group inline-flex items-center gap-1 text-sm text-ink-muted transition-colors hover:text-ink"
                >
                  Whitepaper
                  <span className="-translate-x-1 text-accent opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100">
                    →
                  </span>
                </a>
              </li>
              <li>
                <a
                  href="/support"
                  className="group inline-flex items-center gap-1 text-sm text-ink-muted transition-colors hover:text-ink"
                >
                  Support
                  <span className="-translate-x-1 text-accent opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100">
                    →
                  </span>
                </a>
              </li>
              <li>
                <a
                  href={USDM_BASESCAN}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-1.5 text-sm text-ink-muted transition-colors hover:text-ink"
                >
                  $USDM on Basescan
                  <ArrowUpRight
                    size={13}
                    className="-translate-x-1 translate-y-0.5 opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:translate-y-0 group-hover:opacity-100"
                  />
                </a>
              </li>
            </ul>
          </motion.div>
        </div>

        {/* ── Bottom bar ──────────────────────────────────────────────────── */}
        <motion.div
          variants={item}
          className="mt-14 flex flex-col gap-3 border-t border-ink/10 pt-6 font-mono text-[0.68rem] uppercase tracking-[0.14em] text-ink-dim sm:flex-row sm:items-center sm:justify-between"
        >
          <span>&copy; 2026 MaskedUSD &middot; Building on Base</span>
          <span>Live on Base &middot; Not financial advice</span>
        </motion.div>
      </motion.div>
    </footer>
  );
}
