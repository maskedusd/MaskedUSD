import GridDistortion from "./GridDistortion";
import MaskIcon from "./MaskIcon";

const X_URL = "https://x.com/MaskedUSD";
const TELEGRAM_URL = "https://t.me/maskedusd";

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
          <nav className="glass pointer-events-auto mx-auto flex w-full min-w-0 max-w-5xl items-center justify-between gap-3 rounded-full py-2.5 pl-4 pr-2.5 sm:gap-4 sm:pl-5">
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

            <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
              <span className="hidden items-center gap-2 rounded-full border border-ink/10 px-3 py-1.5 font-mono text-[0.66rem] uppercase tracking-[0.12em] text-ink-muted sm:inline-flex">
                <span className="status-dot" aria-hidden="true" />
                Pre-launch
              </span>
              <a
                href={X_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden rounded-full px-3 py-2 font-mono text-xs uppercase tracking-wider text-ink-muted transition-colors hover:text-ink sm:inline-block"
              >
                X
              </a>
              <a
                href={TELEGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
              >
                Telegram
              </a>
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
          className="enter flex w-full items-center justify-between px-6 pb-5 font-mono text-[0.68rem] uppercase tracking-[0.18em] text-ink-dim sm:pb-6"
          style={{ transitionDelay: "780ms" }}
        >
          <span>Behind the Mask</span>
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
