"use client";

import { useRef } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  type Variants,
} from "framer-motion";

/**
 * "Roadmap" — a vertical timeline on a lavender band. A gradient rail runs down
 * the left; an accent progress line draws itself as you scroll (scroll-linked),
 * and each phase card slides in on view. The current phase pulses; shipped
 * phases carry a solid accent dot ("Shipped"); the rest are "Planned".
 *
 * Honesty: mainnet-live. No firm dates, no audited claims — phases 01–03 are
 * Shipped (factual), $MUSD (04) is in progress, and 05–08 are Planned
 * (forward-looking direction, not dated commitments).
 */

const EASE_OUT: [number, number, number, number] = [0.16, 0.84, 0.3, 1];

type Phase = {
  no: string;
  title: string;
  body: string;
  status: "done" | "now" | "planned";
};

const PHASES: Phase[] = [
  {
    no: "01",
    title: "Foundations",
    body: "Protocol architecture, dZK circuit design, and the brand & community taking shape.",
    status: "done",
  },
  {
    no: "02",
    title: "Public testnet",
    body: "The full flow — mint, shield, private transfers, and redeem — live end to end on Base Sepolia.",
    status: "done",
  },
  {
    no: "03",
    title: "Mainnet on Base",
    body: "$USDM is live: hold, shield, and redeem private dollars backed 1:1 by native USDC.",
    status: "done",
  },
  {
    no: "04",
    title: "$MUSD & ecosystem",
    body: "$MUSD launches on Clanker as the access layer, with integrations and utility expanding.",
    status: "now",
  },
  {
    no: "05",
    title: "Compliant privacy",
    body: "Association sets go live with selective disclosure — prove your funds are clean without exposing anyone else. Privacy regulators can live with.",
    status: "planned",
  },
  {
    no: "06",
    title: "Private payments",
    body: "Payment links, requests, and recurring transfers — so USDM is something you spend, not just hold.",
    status: "planned",
  },
  {
    no: "07",
    title: "Build on USDM",
    body: "An SDK and docs so any Base app can embed shielded USDM in a few lines. Privacy as a primitive.",
    status: "planned",
  },
  {
    no: "08",
    title: "Progressive decentralization",
    body: "The guardian moves to a multisig, then a timelock — narrowing trust toward the immutable core the contracts already guarantee.",
    status: "planned",
  },
];

export default function Roadmap() {
  const reduceMotion = useReducedMotion();
  const railRef = useRef<HTMLDivElement>(null);

  // Scroll-linked progress: the accent line grows from top as the section
  // moves through the viewport.
  const { scrollYProgress } = useScroll({
    target: railRef,
    offset: ["start 72%", "end 55%"],
  });
  const lineScale = useTransform(scrollYProgress, [0, 1], [0, 1]);

  const card: Variants = {
    hidden: { opacity: 0, x: reduceMotion ? 0 : 28 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: reduceMotion ? 0 : 0.65, ease: EASE_OUT },
    },
  };

  return (
    <section
      id="roadmap"
      className="relative w-full overflow-hidden bg-bg py-24 md:py-32"
    >
      {/* Ambient glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-[-6%] top-1/3 -z-10 h-[520px] w-[520px] rounded-full blur-[140px]"
        style={{
          background:
            "radial-gradient(circle, rgba(139,111,224,0.15) 0%, rgba(139,111,224,0) 70%)",
        }}
      />

      <div className="mx-auto w-full max-w-[1180px] px-5 sm:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: reduceMotion ? 0 : 0.7, ease: EASE_OUT }}
          className="max-w-2xl"
        >
          <span className="inline-flex items-center gap-2 font-mono text-[0.7rem] uppercase tracking-[0.22em] text-accent-deep">
            <span className="status-dot" aria-hidden="true" />
            Roadmap
          </span>
          <h2 className="mt-5 font-display text-3xl font-bold leading-[1.06] tracking-tight text-ink sm:text-4xl lg:text-5xl">
            Where we&apos;re headed.
          </h2>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-ink-muted sm:text-lg">
            A privacy stablecoin is infrastructure — so we&apos;re building it in
            the open, one deliberate phase at a time.
          </p>
        </motion.div>

        {/* Timeline */}
        <div ref={railRef} className="relative mt-16 pl-12 sm:pl-16">
          {/* Rail track */}
          <div
            aria-hidden="true"
            className="absolute bottom-2 left-[14px] top-2 w-px bg-ink/10 sm:left-[18px]"
          />
          {/* Rail progress (scroll-linked draw) */}
          <motion.div
            aria-hidden="true"
            className="absolute bottom-2 left-[14px] top-2 w-px origin-top bg-gradient-to-b from-accent via-accent-deep to-accent sm:left-[18px]"
            style={{ scaleY: reduceMotion ? 1 : lineScale }}
          />

          <div className="space-y-10 sm:space-y-12">
            {PHASES.map((phase) => (
              <motion.div
                key={phase.no}
                variants={card}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.6 }}
                className="relative"
              >
                {/* Node marker on the rail */}
                <span
                  aria-hidden="true"
                  className={`absolute top-1.5 flex h-[30px] w-[30px] -translate-x-[calc(100%+18px)] items-center justify-center rounded-full border sm:-translate-x-[calc(100%+22px)] ${
                    phase.status !== "planned"
                      ? "border-accent/40 bg-accent-soft"
                      : "border-ink/12 bg-surface"
                  }`}
                  style={{ left: "16px" }}
                >
                  <span
                    className={
                      phase.status === "now"
                        ? "status-dot"
                        : phase.status === "done"
                          ? "h-1.5 w-1.5 rounded-full bg-accent-deep"
                          : "h-1.5 w-1.5 rounded-full bg-ink-dim"
                    }
                  />
                </span>

                {/* Card — lifts & brightens on hover */}
                <motion.div
                  whileHover={reduceMotion ? undefined : { y: -4, scale: 1.012 }}
                  transition={{ type: "spring", stiffness: 340, damping: 26 }}
                  className="rounded-3xl border border-ink/[0.08] bg-surface/70 p-6 shadow-[0_24px_60px_-46px_rgba(107,79,207,0.5)] backdrop-blur-[8px] transition-[box-shadow,border-color] duration-300 hover:border-accent/25 hover:shadow-[0_38px_84px_-44px_rgba(107,79,207,0.62)] sm:p-7">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-medium text-accent-deep">
                      {phase.no}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[0.58rem] uppercase tracking-[0.14em] ${
                        phase.status !== "planned"
                          ? "border border-accent/25 bg-accent-soft text-accent-deep"
                          : "border border-ink/10 bg-bg-wash/60 text-ink-dim"
                      }`}
                    >
                      {phase.status === "done" ? "Shipped" : phase.status === "now" ? "In progress" : "Planned"}
                    </span>
                  </div>
                  <h3 className="mt-3 font-display text-xl font-bold tracking-tight text-ink sm:text-2xl">
                    {phase.title}
                  </h3>
                  <p className="mt-2 max-w-lg text-[0.95rem] leading-relaxed text-ink-muted">
                    {phase.body}
                  </p>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
