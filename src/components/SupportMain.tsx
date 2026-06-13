"use client";

import Link from "next/link";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Compass,
  HelpCircle,
  Megaphone,
  MessagesSquare,
} from "lucide-react";
import { XIcon, TelegramIcon } from "./BrandIcons";

/**
 * SupportMain — the body of the /support page. Pre-launch, community-first
 * support: channel cards (Telegram / X / FAQ / How it works), a "coming soon"
 * docs card, and a compact common-questions list that links back to the home
 * FAQ. Lavender hero → white channels band (the footer closes in lavender).
 *
 * Honesty: no fake email/phone/ticket system. The fastest real channel is the
 * Telegram; docs are explicitly "coming soon".
 */

const X_URL = "https://x.com/MaskedUSD";
const TELEGRAM_URL = "https://t.me/maskedusd";
const EASE_OUT: [number, number, number, number] = [0.16, 0.84, 0.3, 1];

type Channel = {
  icon: typeof MessagesSquare;
  title: string;
  desc: string;
  href?: string;
  external?: boolean;
  live?: boolean;
  soon?: boolean;
};

const CHANNELS: Channel[] = [
  {
    icon: MessagesSquare,
    title: "Community on Telegram",
    desc: "Ask questions and get help from the team and the community — usually the fastest answer.",
    href: TELEGRAM_URL,
    external: true,
    live: true,
  },
  {
    icon: Megaphone,
    title: "Updates on X",
    desc: "Follow @MaskedUSD for launch news, announcements, and progress.",
    href: X_URL,
    external: true,
  },
  {
    icon: HelpCircle,
    title: "Read the FAQ",
    desc: "The honest answers — what MaskedUSD is, what it isn't, and where it stands today.",
    href: "/#faq",
  },
  {
    icon: BookOpen,
    title: "How it works",
    desc: "Deposit, shield, redeem — see the $USDM flow in three quick steps.",
    href: "/#how-it-works",
  },
];

const QUESTIONS = [
  "Is MaskedUSD a mixer?",
  "Is $USDM live yet?",
  "How is $USDM backed?",
  "What's the difference between $USDM and $MUSD?",
  "What is dZK Proof?",
  "Is it audited?",
];

function ChannelCard({ ch }: { ch: Channel }) {
  const Icon = ch.icon;
  const inner = (
    <>
      <div className="flex items-center justify-between">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-accent/20 bg-accent-soft text-accent-deep transition-colors group-hover:border-accent/40">
          <Icon size={22} strokeWidth={1.8} aria-hidden="true" />
        </span>
        {ch.soon ? (
          <span className="rounded-full border border-ink/10 bg-bg-wash/60 px-2.5 py-1 font-mono text-[0.56rem] uppercase tracking-[0.14em] text-ink-dim">
            Coming soon
          </span>
        ) : ch.live ? (
          <span className="inline-flex items-center gap-1.5 font-mono text-[0.56rem] uppercase tracking-[0.14em] text-accent-deep">
            <span className="status-dot" aria-hidden="true" />
            Active
          </span>
        ) : ch.external ? (
          <ArrowUpRight
            size={18}
            className="text-ink-dim transition-all duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-ink"
          />
        ) : (
          <ArrowRight
            size={18}
            className="text-ink-dim transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-ink"
          />
        )}
      </div>
      <h3 className="mt-5 font-display text-lg font-bold tracking-tight text-ink">
        {ch.title}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-ink-muted">{ch.desc}</p>
    </>
  );

  const cardClass =
    "group block h-full rounded-3xl border border-ink/[0.08] bg-surface/70 p-6 shadow-[0_24px_60px_-46px_rgba(107,79,207,0.5)] backdrop-blur-[8px] transition-all duration-300 hover:-translate-y-1 hover:border-accent/25 hover:shadow-[0_38px_84px_-44px_rgba(107,79,207,0.6)]";

  if (ch.soon) {
    return (
      <div className={`${cardClass} cursor-not-allowed opacity-80`}>{inner}</div>
    );
  }
  if (ch.external) {
    return (
      <a
        href={ch.href}
        target="_blank"
        rel="noopener noreferrer"
        className={cardClass}
      >
        {inner}
      </a>
    );
  }
  return (
    <Link href={ch.href as string} className={cardClass}>
      {inner}
    </Link>
  );
}

export default function SupportMain() {
  const reduce = useReducedMotion();

  const container: Variants = {
    hidden: {},
    visible: {
      transition: { staggerChildren: reduce ? 0 : 0.09, delayChildren: 0.04 },
    },
  };
  const item: Variants = {
    hidden: { opacity: 0, y: reduce ? 0 : 22 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: reduce ? 0 : 0.6, ease: EASE_OUT },
    },
  };

  return (
    <main className="w-full">
      {/* ── Hero (lavender) ─────────────────────────────────────────────────── */}
      <section className="relative w-full overflow-hidden bg-bg pt-32 pb-20 md:pt-40 md:pb-28">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[560px] w-[900px] max-w-[120%] -translate-x-1/2 rounded-full blur-[150px]"
          style={{
            background:
              "radial-gradient(circle, rgba(139,111,224,0.2) 0%, rgba(139,111,224,0) 70%)",
          }}
        />
        <motion.div
          variants={container}
          initial="hidden"
          animate="visible"
          className="mx-auto w-full max-w-[1180px] px-5 sm:px-6"
        >
          <motion.div variants={item}>
            <Link
              href="/"
              className="group inline-flex items-center gap-1.5 font-mono text-[0.66rem] uppercase tracking-[0.18em] text-ink-dim transition-colors hover:text-ink"
            >
              <ArrowLeft
                size={13}
                className="transition-transform duration-200 group-hover:-translate-x-0.5"
              />
              Back to home
            </Link>
          </motion.div>

          <motion.span
            variants={item}
            className="mt-7 inline-flex items-center gap-2 font-mono text-[0.7rem] uppercase tracking-[0.22em] text-accent-deep"
          >
            <span className="status-dot" aria-hidden="true" />
            Support
          </motion.span>
          <motion.h1
            variants={item}
            className="mt-5 max-w-3xl font-display text-4xl font-bold leading-[1.05] tracking-tight text-ink sm:text-5xl lg:text-6xl"
          >
            How can we <span className="text-accent-deep">help?</span>
          </motion.h1>
          <motion.p
            variants={item}
            className="mt-5 max-w-xl text-base leading-relaxed text-ink-muted sm:text-lg"
          >
            We&apos;re pre-launch and building in the open. The quickest answers
            come from the community — browse the channels below, or reach out
            directly.
          </motion.p>

          <motion.div
            variants={item}
            className="mt-9 flex flex-col gap-3 sm:flex-row"
          >
            <a
              href={TELEGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-medium text-white shadow-[0_10px_28px_-12px_rgba(27,20,56,0.5)] transition-transform hover:-translate-y-0.5"
            >
              <TelegramIcon size={16} />
              Ask in the Telegram
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
          </motion.div>
        </motion.div>
      </section>

      {/* ── Channels (white) ────────────────────────────────────────────────── */}
      <section className="relative w-full overflow-hidden bg-surface py-20 md:py-28">
        <div className="mx-auto w-full max-w-[1180px] px-5 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: reduce ? 0 : 0.7, ease: EASE_OUT }}
            className="max-w-2xl"
          >
            <span className="font-mono text-[0.7rem] uppercase tracking-[0.22em] text-accent-deep">
              Where to get answers
            </span>
            <h2 className="mt-4 font-display text-3xl font-bold leading-[1.06] tracking-tight text-ink sm:text-4xl">
              Pick a channel.
            </h2>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-ink-muted">
              No ticket queues yet — we&apos;re small and pre-launch, so the
              Telegram is the fastest way to reach a human.
            </p>
          </motion.div>

          <motion.div
            variants={container}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5"
          >
            {CHANNELS.map((ch) => (
              <motion.div key={ch.title} variants={item}>
                <ChannelCard ch={ch} />
              </motion.div>
            ))}
            <motion.div variants={item}>
              <ChannelCard
                ch={{
                  icon: Compass,
                  title: "Docs",
                  desc: "Developer & protocol documentation. Landing alongside the testnet.",
                  soon: true,
                }}
              />
            </motion.div>

            {/* Common questions panel */}
            <motion.div
              variants={item}
              className="flex flex-col rounded-3xl border border-accent/15 bg-gradient-to-br from-bg-wash to-[#e7daf6] p-6 shadow-[0_24px_60px_-46px_rgba(107,79,207,0.5)] sm:col-span-2 lg:col-span-1"
            >
              <span className="font-mono text-[0.6rem] uppercase tracking-[0.16em] text-accent-deep">
                Common questions
              </span>
              <ul className="mt-4 space-y-2.5">
                {QUESTIONS.slice(0, 4).map((q) => (
                  <li key={q}>
                    <Link
                      href="/#faq"
                      className="group flex items-start gap-2 text-sm text-ink-muted transition-colors hover:text-ink"
                    >
                      <span className="mt-[0.5rem] h-1 w-1 shrink-0 rounded-full bg-accent/70" />
                      <span>{q}</span>
                    </Link>
                  </li>
                ))}
              </ul>
              <Link
                href="/#faq"
                className="group mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-accent-deep transition-colors hover:text-ink"
              >
                Browse all FAQs
                <ArrowRight
                  size={15}
                  className="transition-transform duration-200 group-hover:translate-x-1"
                />
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </main>
  );
}
