"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, LifeBuoy } from "lucide-react";

/**
 * SupportCTA — a compact band between the FAQ and the footer. A distinct
 * lavender-gradient card (so it reads as its own moment on the shared white
 * band) with a gently bobbing life-buoy, a sweeping sheen, and a "Get support"
 * button that routes to the full /support page.
 */

const EASE_OUT: [number, number, number, number] = [0.16, 0.84, 0.3, 1];

export default function SupportCTA() {
  const reduce = useReducedMotion();

  return (
    <section
      id="support"
      className="relative w-full overflow-hidden bg-surface py-16 md:py-20"
    >
      <div className="mx-auto w-full max-w-[1180px] px-5 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 26 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: reduce ? 0 : 0.7, ease: EASE_OUT }}
          className="relative overflow-hidden rounded-[32px] border border-accent/15 bg-gradient-to-br from-bg-wash via-[#eadff8] to-[#e0d0f4] px-7 py-10 shadow-[0_40px_100px_-55px_rgba(107,79,207,0.55)] sm:px-12 sm:py-12"
        >
          {/* sweeping sheen */}
          {!reduce && (
            <div
              aria-hidden="true"
              className="sheen pointer-events-none absolute inset-0 z-0 rounded-[32px]"
            />
          )}
          {/* soft accent glow */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-16 -top-16 z-0 h-64 w-64 rounded-full blur-[90px]"
            style={{
              background:
                "radial-gradient(circle, rgba(139,111,224,0.35) 0%, rgba(139,111,224,0) 70%)",
            }}
          />

          <div className="relative z-10 flex flex-col items-start gap-7 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-4 sm:gap-5">
              <span
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-accent/25 bg-surface/80 text-accent-deep shadow-[0_12px_30px_-14px_rgba(107,79,207,0.6)]"
                style={
                  reduce
                    ? undefined
                    : { animation: "soft-float 4.5s ease-in-out infinite" }
                }
              >
                <LifeBuoy size={26} strokeWidth={1.8} aria-hidden="true" />
              </span>
              <div>
                <span className="font-mono text-[0.66rem] uppercase tracking-[0.2em] text-accent-deep">
                  Support
                </span>
                <h2 className="mt-1.5 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
                  Need a hand?
                </h2>
                <p className="mt-2 max-w-md text-[0.95rem] leading-relaxed text-ink-muted">
                  Questions, stuck, or just want to dig deeper? The support hub
                  and community have you covered.
                </p>
              </div>
            </div>

            <Link
              href="/support"
              className="group inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-ink px-6 py-3.5 text-sm font-medium text-white shadow-[0_14px_32px_-14px_rgba(27,20,56,0.6)] transition-transform hover:-translate-y-0.5"
            >
              Get support
              <ArrowRight
                size={17}
                strokeWidth={2.2}
                className="transition-transform duration-200 group-hover:translate-x-1"
              />
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
