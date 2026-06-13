import GridDistortion from "./GridDistortion";
import MaskIcon from "./MaskIcon";
import SmoothScrollLink from "./SmoothScrollLink";
import { XIcon, TelegramIcon } from "./BrandIcons";

const X_URL = "https://x.com/MaskedUSD";
const TELEGRAM_URL = "https://t.me/maskedusd";

/** In-page sections wired into the header nav (scrolled to smoothly). */
const NAV_LINKS = [
  { id: "how-it-works", label: "How it works" },
  { id: "tokens", label: "Tokens" },
];

/**
 * The landing hero. `entered` flips true when the intro terminal hands off; the
 * `is-entered` class then eases each `.enter` / `.enter-fade` element in, with
 * per-element transition-delays for a staggered "load in".
 */
export default function Hero({ entered = true }: { entered?: boolean }) {
  return (
    <section
      className={`relative flex min-h-screen w-full flex-col overflow-hidden bg-bg ${
        entered ? "is-entered" : ""
      }`}
    >
      {/* Layer 0 — interactive distortion backdrop (lavender, brand-tuned) */}
      <div
        className="enter-fade absolute inset-0 z-0"
        style={{ transitionDelay: "0ms" }}
      >
        <GridDistortion
          imageSrc="/hero-lavender.png"
          grid={18}
          mouse={0.16}
          strength={0.12}
          relaxation={0.9}
        />
      </div>

      {/* Layer 1 — soft light scrim so the dark text stays legible */}
      <div className="hero-scrim pointer-events-none absolute inset-0 z-10" />

      {/* Layer 2 — content. Wrappers stay pointer-events-none so the cursor
          reaches the canvas; only the interactive controls opt back in. */}
      <div className="pointer-events-none relative z-20 flex min-h-screen flex-col">
        {/* Nav */}
        <header
          className="enter w-full px-4 pt-5 sm:px-6 sm:pt-6"
          style={{ transitionDelay: "120ms" }}
        >
          <nav className="glass pointer-events-auto relative mx-auto flex w-full min-w-0 max-w-5xl items-center justify-between gap-3 rounded-full py-2.5 pl-4 pr-2.5 sm:gap-4 sm:pl-5">
            <a
              href="/"
              className="flex min-w-0 items-center gap-2.5"
              aria-label="MaskedUSD home"
            >
              <MaskIcon width={34} className="shrink-0" />
              <span className="truncate font-display text-base font-semibold tracking-tight text-ink sm:text-lg">
                MaskedUSD
              </span>
            </a>

            {/* Centered section nav — smooth-scrolls without a /#hash. */}
            <div className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 md:flex">
              {NAV_LINKS.map((link) => (
                <SmoothScrollLink
                  key={link.id}
                  targetId={link.id}
                  className="rounded-full px-3.5 py-2 text-sm font-medium text-ink-muted transition-colors hover:text-ink"
                >
                  {link.label}
                </SmoothScrollLink>
              ))}
            </div>

            <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
              <a
                href={X_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="MaskedUSD on X"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-ink/[0.06] hover:text-ink"
              >
                <XIcon size={16} />
              </a>
              <a
                href={TELEGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="MaskedUSD on Telegram"
                className="mr-1 inline-flex h-9 w-9 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-ink/[0.06] hover:text-ink"
              >
                <TelegramIcon size={17} />
              </a>
              <button
                type="button"
                disabled
                aria-disabled="true"
                title="Launching soon"
                className="inline-flex cursor-not-allowed items-center gap-2 rounded-full border border-ink/10 bg-ink/[0.07] px-4 py-2 text-sm font-medium text-ink-dim"
              >
                Launch App
                <span
                  aria-hidden="true"
                  className="hidden font-mono text-[0.6rem] uppercase tracking-[0.12em] text-ink-dim/80 sm:inline"
                >
                  Soon
                </span>
              </button>
            </div>
          </nav>
        </header>

        {/* Hero body */}
        <div className="flex flex-1 items-center justify-center px-5 py-16">
          <div className="mx-auto max-w-2xl text-center">
            <span
              className="enter glass pointer-events-auto mx-auto mb-7 inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 font-mono text-[0.7rem] uppercase tracking-[0.12em] text-ink-muted"
              style={{ transitionDelay: "280ms" }}
            >
              <span className="status-dot" aria-hidden="true" />
              Building on Base
            </span>

            <h1
              className="enter font-display text-4xl font-bold leading-[1.05] tracking-tight text-ink sm:text-6xl lg:text-7xl"
              style={{ transitionDelay: "380ms" }}
            >
              Hold dollars.
              <br />
              Keep them <span className="text-accent-deep">private</span>.
            </h1>

            <p
              className="enter mx-auto mt-6 max-w-xl text-base leading-relaxed text-ink-muted sm:text-lg"
              style={{ transitionDelay: "520ms" }}
            >
              Privacy stablecoin infrastructure on Base. 1:1 USDC-backed{" "}
              <span className="font-medium text-ink">$USDM</span>, shielded by
              dZK Proof.
            </p>

            <div
              className="enter mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row"
              style={{ transitionDelay: "660ms" }}
            >
              <a
                href={TELEGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="pointer-events-auto inline-flex w-full items-center justify-center rounded-full bg-ink px-6 py-3 text-sm font-medium text-white shadow-[0_10px_28px_-12px_rgba(27,20,56,0.5)] transition-transform hover:-translate-y-0.5 sm:w-auto"
              >
                Join the community
              </a>
              <a
                href={X_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="glass pointer-events-auto inline-flex w-full items-center justify-center rounded-full px-6 py-3 text-sm font-medium text-ink transition-colors hover:border-accent sm:w-auto"
              >
                Follow @MaskedUSD
              </a>
            </div>
          </div>
        </div>

        {/* Footer row */}
        <footer
          className="enter relative flex w-full items-center justify-between px-6 pb-5 font-mono text-[0.68rem] uppercase tracking-[0.18em] text-ink-dim sm:pb-6"
          style={{ transitionDelay: "780ms" }}
        >
          <span>Behind the Mask</span>

          {/* Centered scroll cue — an animated down-arrow invites the user into
              the page; links to the first section below the hero. The overlay
              mirrors the footer's own padding + items-center so the cue aligns
              exactly with the side labels (rather than the footer's box). */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-6 pb-5 sm:pb-6">
            <SmoothScrollLink
              targetId="how-it-works"
              className="pointer-events-auto inline-flex items-center gap-2 text-ink-muted transition-colors hover:text-ink"
              aria-label="Scroll to how it works"
            >
              <span>Scroll down</span>
              <svg
                className="scroll-arrow"
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M12 5v14" />
                <path d="m19 12-7 7-7-7" />
              </svg>
            </SmoothScrollLink>
          </div>

          <span
            className="hidden items-center gap-2 sm:inline-flex"
            aria-hidden="true"
          >
            Move your cursor
            <span className="text-accent">✦</span>
          </span>
        </footer>
      </div>
    </section>
  );
}
