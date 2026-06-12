"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import { motion, useReducedMotion, type Variants } from "framer-motion";

export interface SectionWithMockupProps {
  /** Section headline (rendered in font-display, ink). */
  title: ReactNode;
  /** Supporting copy under the title (ink-muted). */
  description: ReactNode;
  /** Foreground app-screen mockup (portrait, ~471x637). */
  primaryImageSrc: string;
  /** Descriptive alt for the primary mockup (it carries the step's mechanism). */
  primaryImageAlt: string;
  /** Decorative offset card image sitting behind the primary. */
  secondaryImageSrc: string;
  /** Optional small mono tag above the title, e.g. "STEP 01". */
  stepLabel?: string;
  /** Flip text/image columns so alternating sections read with rhythm. */
  reverseLayout?: boolean;
}

/**
 * Light, brand-adapted "section with mockup" block for the MaskedUSD landing
 * page. One column of copy, one column with a stacked image mockup: a glassy
 * lavender card holding the primary screen plus a soft, blurred lavender card
 * offset behind it. Cards parallax gently on scroll (whileInView) and the copy
 * staggers in. All motion collapses to a static reveal under
 * prefers-reduced-motion.
 *
 * Inverted from a dark original (bg-black / white text / #ffffff0a cards) to
 * our light brand (pale-lavender section, ink text, glass cards, lavender
 * glows). Structure, stagger, parallax and reverseLayout are preserved. The
 * per-step title is an <h3> (the HowItWorks section owns the <h2>).
 */

// Brand easing — typed cubic-bezier tuple so framer-motion v12 + strict TS is
// happy (a bare number[] is not assignable to the Easing union). Matches the
// .enter curve in globals.css.
const EASE_OUT: [number, number, number, number] = [0.16, 0.84, 0.3, 1];

export default function SectionWithMockup({
  title,
  description,
  primaryImageSrc,
  primaryImageAlt,
  secondaryImageSrc,
  stepLabel,
  reverseLayout = false,
}: SectionWithMockupProps) {
  const reduceMotion = useReducedMotion();

  // Parallax travel for the two cards; zeroed out when motion is reduced.
  const primaryShift = reduceMotion ? 0 : 36;
  const secondaryShift = reduceMotion ? 0 : -28;
  const floatShift = reduceMotion ? 0 : -10;

  const copyContainer: Variants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: reduceMotion ? 0 : 0.12,
        delayChildren: reduceMotion ? 0 : 0.04,
      },
    },
  };

  const copyItem: Variants = {
    hidden: { opacity: 0, y: reduceMotion ? 0 : 22 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: reduceMotion ? 0 : 0.7, ease: EASE_OUT },
    },
  };

  return (
    <section className="relative overflow-hidden py-20 md:py-28 lg:py-36">
      {/* Soft lavender radial accent — sits behind the mockup side, flips with
          the layout so the glow always backs the imagery. */}
      <div
        aria-hidden
        className={`pointer-events-none absolute top-1/2 -z-10 h-[640px] w-[640px] -translate-y-1/2 rounded-full blur-[120px] ${
          reverseLayout ? "left-[-12%]" : "right-[-12%]"
        }`}
        style={{
          background:
            "radial-gradient(circle, rgba(139,111,224,0.22) 0%, rgba(139,111,224,0.07) 45%, rgba(139,111,224,0) 72%)",
        }}
      />

      <div className="mx-auto w-full max-w-[1180px] px-5 sm:px-6">
        <div
          className={`grid items-center gap-12 md:grid-cols-2 md:gap-10 lg:gap-16 ${
            reverseLayout ? "md:[&>*:first-child]:order-2" : ""
          }`}
        >
          {/* ── Copy column ─────────────────────────────────────────────── */}
          <motion.div
            variants={copyContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.4 }}
            className="max-w-xl"
          >
            {stepLabel && (
              <motion.span
                variants={copyItem}
                className="mb-5 inline-flex items-center gap-2 rounded-full border border-ink/10 bg-surface/60 px-3 py-1.5 font-mono text-[0.66rem] uppercase tracking-[0.18em] text-accent-deep"
              >
                {stepLabel}
              </motion.span>
            )}

            <motion.h3
              variants={copyItem}
              className="font-display text-3xl font-bold leading-[1.08] tracking-tight text-ink sm:text-4xl lg:text-[2.6rem]"
            >
              {title}
            </motion.h3>

            <motion.p
              variants={copyItem}
              className="mt-5 max-w-md text-base leading-relaxed text-ink-muted sm:text-[1.05rem]"
            >
              {description}
            </motion.p>
          </motion.div>

          {/* ── Mockup column ───────────────────────────────────────────── */}
          <div className="relative flex justify-center md:justify-end">
            <div className="relative w-full max-w-[472px]">
              {/* Decorative offset card — soft lavender gradient, blurred,
                  drifts opposite the primary for layered depth. */}
              <motion.div
                aria-hidden
                initial={{ opacity: 0, y: 0 }}
                whileInView={{ opacity: 1, y: secondaryShift }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: reduceMotion ? 0 : 1.1, ease: EASE_OUT }}
                className={`absolute top-10 hidden aspect-[472/500] w-[88%] rounded-[32px] sm:block ${
                  reverseLayout ? "left-[-9%]" : "right-[-9%]"
                }`}
                style={{
                  background:
                    "linear-gradient(160deg, rgba(167,140,236,0.55) 0%, rgba(139,111,224,0.32) 45%, rgba(246,242,251,0.65) 100%)",
                  filter: "blur(2px)",
                  boxShadow: "0 40px 90px -45px rgba(107,79,207,0.55)",
                }}
              >
                {/* Secondary image, faint, to give the back card texture. */}
                <div className="relative h-full w-full overflow-hidden rounded-[32px] opacity-45">
                  <Image
                    src={secondaryImageSrc}
                    alt=""
                    fill
                    sizes="(max-width: 768px) 80vw, 420px"
                    className="object-cover"
                  />
                </div>
              </motion.div>

              {/* Primary card — glassy white-lavender, holds the app screen.
                  Parallaxes up, then settles with a gentle float. */}
              <motion.div
                initial={{ opacity: 0, y: primaryShift }}
                whileInView={{ opacity: 1, y: floatShift }}
                viewport={{ once: true, amount: 0.25 }}
                transition={{ duration: reduceMotion ? 0 : 1, ease: EASE_OUT }}
                className="relative aspect-[472/637] w-full overflow-hidden rounded-[28px] border border-ink/10 bg-surface/70 p-2.5 backdrop-blur-[15px]"
                style={{
                  boxShadow:
                    "0 50px 110px -50px rgba(107,79,207,0.5), 0 12px 36px -22px rgba(27,20,56,0.18)",
                }}
              >
                <div className="relative h-full w-full overflow-hidden rounded-[20px] bg-bg-wash">
                  <Image
                    src={primaryImageSrc}
                    alt={primaryImageAlt}
                    fill
                    sizes="(max-width: 768px) 92vw, 460px"
                    className="object-cover"
                  />
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Hairline radial divider, mirrors the original's bottom gradient rule. */}
      <div
        aria-hidden
        className="pointer-events-none mx-auto mt-20 h-px w-full max-w-[1180px] md:mt-28"
        style={{
          background:
            "radial-gradient(closest-side, rgba(139,111,224,0.4) 0%, rgba(139,111,224,0.12) 55%, rgba(139,111,224,0) 100%)",
        }}
      />
    </section>
  );
}
