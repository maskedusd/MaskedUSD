"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import { EyeOff, ShieldCheck, RefreshCw, Network } from "lucide-react";

/**
 * "Privacy" — combines the case for private dollars with a plain-language
 * explainer of how the privacy actually works (dZK Proof). Lavender band.
 *
 * Two beats:
 *   1. A four-card value grid (why private dollars matter for normal people).
 *   2. A two-column dZK explainer: copy on the left, an animated "shielded
 *      ledger" card on the right (masked fields + a proof-valid badge, with a
 *      sweeping sheen and a scan line).
 *
 * Honesty: privacy is framed for everyday users (payroll, savings, treasury) —
 * never as a way to obscure origins / evade. Mechanism is described as design,
 * with no live/deployed/audited or yield claims.
 */

const EASE_OUT: [number, number, number, number] = [0.16, 0.84, 0.3, 1];

const VALUES = [
  {
    icon: EyeOff,
    title: "Private by default",
    body: "Balances and transfers are shielded by dZK Proof from the moment you mint. Privacy isn't a toggle you remember to flip.",
  },
  {
    icon: ShieldCheck,
    title: "Fully backed",
    body: "Every $USDM is backed 1:1 by native USDC held in reserve. Private doesn't mean unbacked.",
  },
  {
    icon: RefreshCw,
    title: "Redeem anytime",
    body: "Burn $USDM for native USDC 1:1, minus fees. No lockups, no permission, no waiting.",
  },
  {
    icon: Network,
    title: "Built on Base",
    body: "Native USDC and low fees, secured by an Ethereum Layer 2. Familiar rails, quieter ledger.",
  },
];

const DZK_POINTS = [
  "Amounts & counterparties stay off the public ledger",
  "Validity is still provable to anyone — no trust required",
  "No mixer, no middleman holding your funds",
];

/* ── Animated shielded-ledger card ─────────────────────────────────────────── */

function ShieldedLedger() {
  const reduceMotion = useReducedMotion();

  const rows = [
    { label: "From", value: "0x9f4c…2e1a", masked: false },
    { label: "To", value: "••••••••••", masked: true },
    { label: "Amount", value: "•••••• USDM", masked: true },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 36 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: reduceMotion ? 0 : 0.9, ease: EASE_OUT }}
      className="relative mx-auto w-full max-w-[420px]"
    >
      {/* Floating dZK chip */}
      <div
        className={`absolute -right-3 -top-3 z-20 ${reduceMotion ? "" : "soft-float"}`}
        style={reduceMotion ? undefined : { animation: "soft-float 5s ease-in-out infinite" }}
      >
        <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-surface px-3 py-1.5 font-mono text-[0.62rem] uppercase tracking-[0.16em] text-accent-deep shadow-[0_10px_30px_-14px_rgba(107,79,207,0.6)]">
          <span className="status-dot" aria-hidden="true" />
          dZK Proof
        </span>
      </div>

      {/* The card */}
      <div className="relative overflow-hidden rounded-[26px] border border-ink/10 bg-surface/90 p-6 shadow-[0_50px_110px_-50px_rgba(107,79,207,0.5),0_12px_36px_-22px_rgba(27,20,56,0.18)] backdrop-blur-[12px] sm:p-7">
        {/* sweeping sheen */}
        {!reduceMotion && (
          <div
            aria-hidden="true"
            className="sheen pointer-events-none absolute inset-0 z-10 rounded-[26px]"
          />
        )}
        {/* scan line */}
        {!reduceMotion && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-5 top-0 z-10 h-12 rounded-full"
            style={{
              background:
                "linear-gradient(to bottom, rgba(139,111,224,0) 0%, rgba(139,111,224,0.18) 50%, rgba(139,111,224,0) 100%)",
              animation: "proof-scan 3.6s ease-in-out infinite",
            }}
          />
        )}

        <div className="relative z-0">
          <div className="mb-5 flex items-center justify-between">
            <span className="font-mono text-[0.62rem] uppercase tracking-[0.18em] text-ink-dim">
              Shielded transfer
            </span>
            <span className="font-mono text-[0.62rem] uppercase tracking-[0.18em] text-ink-dim">
              Base
            </span>
          </div>

          <div className="space-y-3.5">
            {rows.map((row, i) => (
              <motion.div
                key={row.label}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.6 }}
                transition={{
                  duration: reduceMotion ? 0 : 0.5,
                  delay: reduceMotion ? 0 : 0.25 + i * 0.12,
                  ease: EASE_OUT,
                }}
                className="flex items-center justify-between gap-4 rounded-2xl border border-ink/[0.06] bg-bg-wash/60 px-4 py-3"
              >
                <span className="font-mono text-[0.68rem] uppercase tracking-[0.14em] text-ink-dim">
                  {row.label}
                </span>
                <span
                  className={`font-mono text-sm ${
                    row.masked
                      ? "tracking-[0.12em] text-accent-deep"
                      : "text-ink"
                  }`}
                >
                  {row.value}
                </span>
              </motion.div>
            ))}
          </div>

          {/* Proof badge */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{
              duration: reduceMotion ? 0 : 0.6,
              delay: reduceMotion ? 0 : 0.7,
              ease: EASE_OUT,
            }}
            className="mt-5 flex items-center gap-2.5 rounded-2xl border border-accent/20 bg-accent-soft px-4 py-3"
          >
            <ShieldCheck
              className="shrink-0 text-accent-deep"
              size={18}
              strokeWidth={1.8}
              aria-hidden="true"
            />
            <span className="text-[0.82rem] font-medium text-ink">
              Proof valid
            </span>
            <span className="text-[0.82rem] text-ink-muted">
              · fully backed, amounts hidden
            </span>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

/* ── Section ───────────────────────────────────────────────────────────────── */

export default function WhyPrivacy() {
  const reduceMotion = useReducedMotion();

  const container: Variants = {
    hidden: {},
    visible: {
      transition: { staggerChildren: reduceMotion ? 0 : 0.1, delayChildren: 0.05 },
    },
  };
  const item: Variants = {
    hidden: { opacity: 0, y: reduceMotion ? 0 : 24 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: reduceMotion ? 0 : 0.65, ease: EASE_OUT },
    },
  };

  return (
    <section
      id="privacy"
      className="relative w-full overflow-hidden bg-bg py-24 md:py-32"
    >
      {/* Ambient lavender glows */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-[10%] top-[8%] -z-10 h-[520px] w-[520px] rounded-full blur-[130px]"
        style={{
          background:
            "radial-gradient(circle, rgba(139,111,224,0.16) 0%, rgba(139,111,224,0) 70%)",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-[8%] bottom-[6%] -z-10 h-[460px] w-[460px] rounded-full blur-[120px]"
        style={{
          background:
            "radial-gradient(circle, rgba(167,140,236,0.18) 0%, rgba(167,140,236,0) 70%)",
        }}
      />

      <div className="mx-auto w-full max-w-[1180px] px-5 sm:px-6">
        {/* Header */}
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.5 }}
          className="max-w-2xl"
        >
          <motion.span
            variants={item}
            className="inline-flex items-center gap-2 font-mono text-[0.7rem] uppercase tracking-[0.22em] text-accent-deep"
          >
            <span className="status-dot" aria-hidden="true" />
            Private by design
          </motion.span>
          <motion.h2
            variants={item}
            className="mt-5 font-display text-3xl font-bold leading-[1.06] tracking-tight text-ink sm:text-4xl lg:text-5xl"
          >
            Dollars that mind
            <br className="hidden sm:block" /> their own business.
          </motion.h2>
          <motion.p
            variants={item}
            className="mt-5 max-w-xl text-base leading-relaxed text-ink-muted sm:text-lg"
          >
            On most chains, your balance and every payment you make are public by
            default. MaskedUSD keeps the dollar — and makes the amounts your
            business.
          </motion.p>
        </motion.div>

        {/* Value grid */}
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5"
        >
          {VALUES.map(({ icon: Icon, title, body }) => (
            <motion.div
              key={title}
              variants={item}
              whileHover={reduceMotion ? undefined : { y: -6 }}
              transition={{ duration: 0.3, ease: EASE_OUT }}
              className="group rounded-3xl border border-ink/[0.08] bg-surface/70 p-6 shadow-[0_24px_60px_-44px_rgba(107,79,207,0.5)] backdrop-blur-[8px]"
            >
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-accent/20 bg-accent-soft text-accent-deep transition-colors group-hover:border-accent/40">
                <Icon size={21} strokeWidth={1.7} aria-hidden="true" />
              </span>
              <h3 className="mt-5 font-display text-lg font-bold tracking-tight text-ink">
                {title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                {body}
              </p>
            </motion.div>
          ))}
        </motion.div>

        {/* dZK explainer */}
        <div className="mt-20 grid items-center gap-12 md:mt-28 lg:grid-cols-2 lg:gap-16">
          <motion.div
            variants={container}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.4 }}
            className="max-w-xl"
          >
            <motion.span
              variants={item}
              className="font-mono text-[0.7rem] uppercase tracking-[0.22em] text-accent-deep"
            >
              How the privacy works
            </motion.span>
            <motion.h3
              variants={item}
              className="mt-4 font-display text-2xl font-bold leading-[1.1] tracking-tight text-ink sm:text-3xl lg:text-[2.4rem]"
            >
              Shielded by dZK Proof.
            </motion.h3>
            <motion.p
              variants={item}
              className="mt-5 text-base leading-relaxed text-ink-muted"
            >
              MaskedUSD uses{" "}
              <span className="font-medium text-ink">
                delegated zero-knowledge (dZK)
              </span>{" "}
              proofs. Your balance and the amounts you send stay off the public
              ledger — yet the math still proves, to anyone, that every transfer
              is valid and fully backed.
            </motion.p>
            <motion.p
              variants={item}
              className="mt-4 text-base leading-relaxed text-ink-muted"
            >
              It&apos;s privacy for normal people — payroll, savings, a quiet
              treasury — not a way to hide where money came from.
            </motion.p>

            <motion.ul variants={item} className="mt-7 space-y-3">
              {DZK_POINTS.map((point) => (
                <li
                  key={point}
                  className="flex items-start gap-3 text-[0.95rem] text-ink"
                >
                  <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent-deep">
                    <ShieldCheck size={13} strokeWidth={2} aria-hidden="true" />
                  </span>
                  <span>{point}</span>
                </li>
              ))}
            </motion.ul>
          </motion.div>

          <ShieldedLedger />
        </div>
      </div>
    </section>
  );
}
