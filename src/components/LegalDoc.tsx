"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { CalendarClock } from "lucide-react";

/**
 * LegalDoc — the shared presentation layer for long-form legal pages
 * (Privacy Policy, Terms of Service). Corporate-clean but unmistakably
 * MaskedUSD: a lavender header band, a mono "Legal" kicker, a sticky numbered
 * table of contents on desktop, and a comfortable reading column with numbered
 * sections. Content is data-driven (see LegalContent), so the two pages stay
 * visually identical and only differ in copy. Reduced-motion aware.
 */

const EASE_OUT: [number, number, number, number] = [0.16, 0.84, 0.3, 1];

export type LegalSection = {
  id: string;
  title: string;
  paragraphs: string[];
  bullets?: string[];
};

export type LegalContent = {
  kicker?: string;
  title: string;
  subtitle: string;
  updated: string;
  intro: string[];
  sections: LegalSection[];
};

function Kicker({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 font-mono text-[0.7rem] uppercase tracking-[0.22em] text-accent-deep">
      <span className="status-dot" aria-hidden="true" />
      {children}
    </span>
  );
}

export default function LegalDoc({ doc }: { doc: LegalContent }) {
  const reduce = useReducedMotion();

  const reveal: Variants = {
    hidden: { opacity: 0, y: reduce ? 0 : 18 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: reduce ? 0 : 0.6, ease: EASE_OUT },
    },
  };

  return (
    <main className="relative w-full overflow-hidden bg-bg text-ink">
      {/* ── Header band ─────────────────────────────────────────────────── */}
      <section className="relative border-b border-ink/[0.06] bg-bg-wash">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-[-8%] top-[-30%] -z-0 h-[440px] w-[440px] rounded-full blur-[130px]"
          style={{
            background:
              "radial-gradient(circle, rgba(139,111,224,0.16) 0%, rgba(139,111,224,0) 70%)",
          }}
        />
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.6 }}
          variants={reveal}
          className="relative z-10 mx-auto w-full max-w-[1180px] px-5 pb-14 pt-28 sm:px-6 sm:pt-32"
        >
          <Kicker>{doc.kicker ?? "Legal"}</Kicker>
          <h1 className="mt-5 font-display text-4xl font-bold leading-[1.04] tracking-tight text-ink sm:text-5xl">
            {doc.title}
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-ink-muted sm:text-lg">
            {doc.subtitle}
          </p>
          <span className="mt-7 inline-flex items-center gap-2 rounded-full border border-ink/10 bg-surface/70 px-3.5 py-1.5 font-mono text-[0.68rem] uppercase tracking-[0.14em] text-ink-dim backdrop-blur-sm">
            <CalendarClock size={13} className="text-accent-deep" aria-hidden="true" />
            Last updated {doc.updated}
          </span>
        </motion.div>
      </section>

      {/* ── Body: sticky TOC + reading column ───────────────────────────── */}
      <section className="mx-auto grid w-full max-w-[1180px] gap-12 px-5 py-16 sm:px-6 sm:py-20 lg:grid-cols-[236px_minmax(0,1fr)] lg:gap-16">
        {/* Table of contents (desktop) */}
        <aside className="hidden lg:block">
          <div className="sticky top-28">
            <p className="font-mono text-[0.64rem] uppercase tracking-[0.18em] text-ink-dim">
              On this page
            </p>
            <ol className="mt-4 space-y-2.5">
              {doc.sections.map((s, i) => (
                <li key={s.id} className="flex gap-2.5 text-[0.82rem] leading-snug">
                  <span className="font-mono text-[0.72rem] text-accent-deep/70">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <a
                    href={`#${s.id}`}
                    className="text-ink-muted transition-colors hover:text-accent-deep"
                  >
                    {s.title}
                  </a>
                </li>
              ))}
            </ol>
          </div>
        </aside>

        {/* Prose column */}
        <div className="min-w-0 max-w-2xl">
          {doc.intro.length > 0 && (
            <div className="space-y-4 border-b border-ink/[0.07] pb-10">
              {doc.intro.map((p, i) => (
                <p key={i} className="text-[0.98rem] leading-relaxed text-ink-muted">
                  {p}
                </p>
              ))}
            </div>
          )}

          <div className="space-y-12 pt-10">
            {doc.sections.map((s, i) => (
              <motion.section
                key={s.id}
                id={s.id}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
                variants={reveal}
                className="scroll-mt-28"
              >
                <div className="flex items-baseline gap-3">
                  <span className="font-mono text-sm font-medium text-accent-deep">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h2 className="font-display text-xl font-bold tracking-tight text-ink sm:text-2xl">
                    {s.title}
                  </h2>
                </div>
                <div className="mt-4 space-y-4">
                  {s.paragraphs.map((p, j) => (
                    <p key={j} className="text-[0.95rem] leading-relaxed text-ink-muted">
                      {p}
                    </p>
                  ))}
                  {s.bullets && s.bullets.length > 0 && (
                    <ul className="mt-2 space-y-2.5">
                      {s.bullets.map((b, j) => (
                        <li
                          key={j}
                          className="flex gap-3 text-[0.95rem] leading-relaxed text-ink-muted"
                        >
                          <span
                            aria-hidden="true"
                            className="mt-[0.55rem] h-1.5 w-1.5 shrink-0 rounded-full bg-accent/70"
                          />
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </motion.section>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
