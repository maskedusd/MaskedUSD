"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Plus } from "lucide-react";

/**
 * "FAQ" — an animated single-open accordion on a white band. Each row expands
 * with a smooth height/opacity transition; the toggle icon rotates from + to ×.
 * This is also the page's regulatory-framing surface (mixer question, backing,
 * pre-launch status, audits).
 *
 * Honesty: pre-launch answers — no live/audited claims; the "mixer" answer
 * frames privacy for normal users; audits are explicitly "planned".
 */

const EASE_OUT: [number, number, number, number] = [0.16, 0.84, 0.3, 1];

const TELEGRAM_URL = "https://t.me/maskedusd";

const FAQS = [
  {
    q: "Is MaskedUSD a mixer?",
    a: "No. MaskedUSD is privacy infrastructure for everyday dollars — balances and transfers are shielded by zero-knowledge proofs that still prove every transfer is valid and fully backed. It's privacy for normal people, not a tool to obscure where funds came from.",
  },
  {
    q: "Is $USDM live yet?",
    a: "Not yet — we're pre-launch and building on Base. Follow @MaskedUSD on X or join the Telegram for launch updates.",
  },
  {
    q: "How is $USDM backed?",
    a: "1:1 by native USDC held in reserve. Every $USDM can be redeemed back to native USDC anytime — minus fees, with no lockups.",
  },
  {
    q: "What's the difference between $USDM and $MUSD?",
    a: "$USDM is the private dollar you hold and spend. $MUSD is the access & utility layer (launching on Clanker) that plugs you into the protocol. They're complementary, not competitors.",
  },
  {
    q: "What is dZK Proof?",
    a: "Delegated zero-knowledge proof. It lets your balance and transfers stay off the public ledger while the math still proves each transfer is valid — privacy without giving up verifiability.",
  },
  {
    q: "Is it audited?",
    a: "Independent security review and audits are planned before mainnet. We won't claim an audit we don't have — results will be published when they're complete.",
  },
];

export default function FAQ() {
  const reduceMotion = useReducedMotion();
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section
      id="faq"
      className="relative w-full overflow-hidden bg-surface py-24 md:py-32"
    >
      {/* faint lavender wash so the white band still feels brand-tinted */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[420px] w-[820px] max-w-[120%] -translate-x-1/2 rounded-full blur-[140px]"
        style={{
          background:
            "radial-gradient(circle, rgba(139,111,224,0.10) 0%, rgba(139,111,224,0) 72%)",
        }}
      />

      <div className="mx-auto grid w-full max-w-[1180px] gap-12 px-5 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
        {/* Header column */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: reduceMotion ? 0 : 0.7, ease: EASE_OUT }}
          className="lg:sticky lg:top-24 lg:self-start"
        >
          <span className="inline-flex items-center gap-2 font-mono text-[0.7rem] uppercase tracking-[0.22em] text-accent-deep">
            <span className="status-dot" aria-hidden="true" />
            FAQ
          </span>
          <h2 className="mt-5 font-display text-3xl font-bold leading-[1.06] tracking-tight text-ink sm:text-4xl lg:text-5xl">
            Questions,
            <br />
            answered.
          </h2>
          <p className="mt-5 max-w-md text-base leading-relaxed text-ink-muted sm:text-lg">
            The honest version — what MaskedUSD is, what it isn&apos;t, and where
            it stands today.
          </p>
          <a
            href={TELEGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-accent-deep transition-colors hover:text-ink"
          >
            Still curious? Ask in the Telegram
            <span aria-hidden="true">→</span>
          </a>
        </motion.div>

        {/* Accordion column */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: reduceMotion ? 0 : 0.7, ease: EASE_OUT }}
          className="divide-y divide-ink/[0.08] border-y border-ink/[0.08]"
        >
          {FAQS.map((faq, i) => {
            const isOpen = open === i;
            return (
              <div key={faq.q}>
                <h3>
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : i)}
                    aria-expanded={isOpen}
                    className="flex w-full items-center justify-between gap-5 py-5 text-left"
                  >
                    <span
                      className={`font-display text-lg font-semibold tracking-tight transition-colors sm:text-xl ${
                        isOpen ? "text-ink" : "text-ink/85"
                      }`}
                    >
                      {faq.q}
                    </span>
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-colors ${
                        isOpen
                          ? "border-accent/30 bg-accent-soft text-accent-deep"
                          : "border-ink/10 text-ink-muted"
                      }`}
                    >
                      <motion.span
                        animate={{ rotate: isOpen ? 135 : 0 }}
                        transition={{ duration: reduceMotion ? 0 : 0.3, ease: EASE_OUT }}
                        className="inline-flex"
                      >
                        <Plus size={17} strokeWidth={2} aria-hidden="true" />
                      </motion.span>
                    </span>
                  </button>
                </h3>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      key="content"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: reduceMotion ? 0 : 0.34, ease: EASE_OUT }}
                      className="overflow-hidden"
                    >
                      <p className="max-w-2xl pb-6 pr-10 text-[0.97rem] leading-relaxed text-ink-muted">
                        {faq.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
