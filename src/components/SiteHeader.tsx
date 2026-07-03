"use client";

import { useState, type MouseEvent } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import { FileText } from "lucide-react";
import MaskIcon from "./MaskIcon";
import SmoothScrollLink from "./SmoothScrollLink";
import { XIcon, TelegramIcon } from "./BrandIcons";

const X_URL = "https://x.com/MaskedUSD";
const TELEGRAM_URL = "https://t.me/maskedusd";

/** In-page sections wired into the header nav (scrolled to smoothly). */
const NAV_LINKS = [
  { id: "how-it-works", label: "How it works" },
  { id: "privacy", label: "Privacy" },
  { id: "tokens", label: "Tokens" },
  { id: "roadmap", label: "Roadmap" },
  { id: "faq", label: "FAQ" },
];

const EASE_OUT: [number, number, number, number] = [0.16, 0.84, 0.3, 1];

/**
 * Fixed site header that overlays the whole page. It fades/drops in once the
 * intro terminal hands off (`entered`), then — as the user scrolls down — the
 * pill narrows (max-width 1024 → 780), pulling the logo, nav, and actions
 * together so the wide hero whitespace collapses into a compact bar. A soft
 * shadow fades in once you leave the very top.
 *
 * The wrapper is pointer-events-none so the cursor still reaches the hero's
 * distortion canvas in the transparent strip beside the pill; only the pill
 * itself is interactive.
 */
export default function SiteHeader({ entered = false }: { entered?: boolean }) {
  const reduceMotion = useReducedMotion();
  const pathname = usePathname();
  const { scrollY } = useScroll();
  const maxWidth = useTransform(scrollY, [0, 200], [1024, 780], { clamp: true });
  const [scrolled, setScrolled] = useState(false);
  const [roadmapOpen, setRoadmapOpen] = useState(false);

  useMotionValueEvent(scrollY, "change", (v) => {
    const next = v > 24;
    setScrolled((prev) => (prev === next ? prev : next));
  });

  // On the landing page, the logo scrolls to the top instead of reloading;
  // anywhere else (e.g. /support) it navigates home as usual.
  const handleLogo = (e: MouseEvent<HTMLAnchorElement>) => {
    if (pathname !== "/") return;
    e.preventDefault();
    window.scrollTo({
      top: 0,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    });
  };

  return (
    <motion.header
      initial={false}
      animate={{ opacity: entered ? 1 : 0, y: entered ? 0 : -14 }}
      transition={{ duration: reduceMotion ? 0 : 0.7, ease: EASE_OUT }}
      className="pointer-events-none fixed inset-x-0 top-0 z-40 w-full px-4 pt-4 sm:px-6"
    >
      <motion.nav
        style={{ maxWidth: reduceMotion ? 1024 : maxWidth }}
        className={`glass pointer-events-auto relative mx-auto flex w-full min-w-0 items-center justify-between gap-3 rounded-full py-1.5 pl-3.5 pr-1.5 transition-shadow duration-300 sm:gap-4 sm:pl-4 ${
          scrolled ? "shadow-[0_14px_44px_-20px_rgba(27,20,56,0.32)]" : ""
        }`}
      >
        <a
          href="/"
          onClick={handleLogo}
          className="flex min-w-0 items-center gap-2"
          aria-label="MaskedUSD home"
        >
          <MaskIcon width={26} className="shrink-0" />
          <span className="truncate font-display text-sm font-semibold tracking-tight text-ink sm:text-base">
            MaskedUSD
          </span>
        </a>

        {/* Centered section nav — smooth-scrolls without a /#hash. Roadmap additionally opens a
            hover dropdown with the Whitepaper link (also open on keyboard focus). */}
        <div className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-0.5 md:flex">
          {NAV_LINKS.map((link) =>
            link.id === "roadmap" ? (
              <div
                key={link.id}
                className="relative flex items-center"
                onMouseEnter={() => setRoadmapOpen(true)}
                onMouseLeave={() => setRoadmapOpen(false)}
                onFocus={() => setRoadmapOpen(true)}
                onBlur={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget as Node)) setRoadmapOpen(false);
                }}
              >
                <SmoothScrollLink
                  targetId={link.id}
                  className="rounded-full px-2.5 py-1.5 text-[0.8rem] font-medium text-ink-muted transition-colors hover:text-ink"
                >
                  {link.label}
                </SmoothScrollLink>
                <AnimatePresence>
                  {roadmapOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: reduceMotion ? 0 : 7, scale: reduceMotion ? 1 : 0.96, x: "-50%" }}
                      animate={{ opacity: 1, y: 0, scale: 1, x: "-50%" }}
                      exit={{ opacity: 0, y: reduceMotion ? 0 : 5, scale: reduceMotion ? 1 : 0.97, x: "-50%" }}
                      transition={{ duration: reduceMotion ? 0 : 0.18, ease: EASE_OUT }}
                      className="absolute left-1/2 top-full z-50 origin-top pt-2"
                    >
                      {/* pt-2 keeps the hover unbroken between the trigger and the panel */}
                      <div className="glass rounded-2xl p-1.5 shadow-[0_18px_50px_-22px_rgba(27,20,56,0.35)]">
                        <Link
                          href="/whitepaper"
                          onClick={() => setRoadmapOpen(false)}
                          className="flex items-center gap-2 whitespace-nowrap rounded-xl px-3.5 py-2 text-[0.8rem] font-medium text-ink-muted transition-colors hover:bg-ink/[0.06] hover:text-ink"
                        >
                          <FileText size={14} className="text-accent-deep" aria-hidden="true" />
                          Whitepaper
                        </Link>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <SmoothScrollLink
                key={link.id}
                targetId={link.id}
                className="rounded-full px-2.5 py-1.5 text-[0.8rem] font-medium text-ink-muted transition-colors hover:text-ink"
              >
                {link.label}
              </SmoothScrollLink>
            ),
          )}
        </div>

        <div className="flex shrink-0 items-center gap-0.5">
          <a
            href={X_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="MaskedUSD on X"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-ink/[0.06] hover:text-ink"
          >
            <XIcon size={15} />
          </a>
          <a
            href={TELEGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="MaskedUSD on Telegram"
            className="mr-0.5 inline-flex h-8 w-8 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-ink/[0.06] hover:text-ink"
          >
            <TelegramIcon size={16} />
          </a>
          <a
            href="/app"
            className="inline-flex items-center rounded-full bg-accent px-3.5 py-1.5 text-[0.82rem] font-medium text-white transition hover:bg-accent-deep"
          >
            Launch App
          </a>
        </div>
      </motion.nav>
    </motion.header>
  );
}
