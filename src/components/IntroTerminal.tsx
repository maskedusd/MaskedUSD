"use client";

import { useEffect, useMemo, useRef, useState } from "react";

/* ─────────────────────────────────────────────────────────────────────────
 * IntroTerminal — minimal-elegant mac-style terminal boot for MaskedUSD.
 *
 * A short, restrained splash: a dark mac terminal window sits on the light
 * lavender hero background, types four tight lines, then dissolves into the
 * landing page. Closer to a refined splash than a full terminal dump —
 * "polished" over "techy", the quickest path to the hero.
 *
 * COPY: the boot initializes the INTERFACE and states brand/design facts only
 * (chain = Base, 1:1 native USDC, $USDM shielded by dZK Proof, "private by
 * default"). It carries no launch-status claim, so it reads well whether shown
 * before or after launch. The leading mark on the facts line is a muted
 * lavender check (not success-green) to stay on-brand.
 *
 * Self-contained: React + Tailwind + inline styles only. No external deps, no
 * audio. prefers-reduced-motion and a hard failsafe are both honored.
 * ───────────────────────────────────────────────────────────────────────── */

/* ── CONFIG · SCRIPT ──────────────────────────────────────────────────────
 * Each line is an ordered list of tokens; `role` picks the syntax colour.
 *  - "input" lines render a fixed prompt then TYPE their tokens char-by-char.
 *  - "print" lines appear all at once after a short beat (command output).
 * Keep it to ~4 lines for the minimal-elegant feel.
 */
type TokenRole =
  | "prompt" // user@host (teal)
  | "cmd" // command word (light)
  | "flag" // flags / status value / confirm mark (soft indigo-lavender)
  | "out" // body / output (soft)
  | "accent" // brand words (lavender)
  | "comment"; // dim note / separators

type Token = { text: string; role: TokenRole };

type Line =
  | { kind: "input"; tokens: Token[] }
  | { kind: "print"; tokens: Token[] };

const PROMPT_TEXT = "guest@maskedusd";
const PROMPT_SEP = ":~$ ";
const WINDOW_TITLE = `${PROMPT_TEXT} — bash`;

const SCRIPT: Line[] = [
  {
    kind: "input",
    tokens: [
      { text: "masked", role: "cmd" },
      { text: " init", role: "out" },
      { text: " --interface", role: "flag" },
    ],
  },
  {
    kind: "print",
    tokens: [
      { text: "✔ ", role: "flag" },
      { text: "base", role: "accent" },
      { text: " · ", role: "comment" },
      { text: "1:1 native usdc", role: "accent" },
      { text: " · ", role: "comment" },
      { text: "$USDM shielded by dZK Proof", role: "accent" },
    ],
  },
  {
    kind: "print",
    tokens: [
      { text: "› ", role: "comment" },
      { text: "private by default", role: "accent" },
    ],
  },
  {
    kind: "print",
    tokens: [{ text: "welcome behind the mask.", role: "accent" }],
  },
];

/* ── CONFIG · TIMING (ms) ─────────────────────────────────────────────────
 * Tune the whole feel here. Total typing stays roughly ~1.9–2.4s.
 */
const TIMING = {
  startDelay: 260, // beat before the first character types
  charDelay: 24, // per-character typewriter speed (input lines)
  printDelay: 180, // beat before a printed output line appears
  betweenLines: 210, // gap after one line completes, before the next begins
  hold: 600, // dwell on the finished terminal before exiting
  exit: 680, // fade + scale-out duration
  reducedHold: 620, // dwell when prefers-reduced-motion (no typing)
  failsafe: 7000, // hard cap → always call onDone(), even if something stalls
} as const;

/* ── STYLES · COLOURS (tasteful, not rainbow) ─────────────────────────────── */
const COLOR: Record<TokenRole, string> = {
  prompt: "#33d6c4", // teal user@host
  cmd: "#ece7f7", // bright command
  flag: "#a8b4ff", // muted blue-violet flag / status value / confirm mark
  out: "#b6afca", // soft body / output
  accent: "#b8a4ff", // lavender brand words
  comment: "#6f6a86", // dim comment / separators
};

const SR_ONLY: React.CSSProperties = {
  position: "absolute",
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: "hidden",
  clip: "rect(0 0 0 0)",
  whiteSpace: "nowrap",
  border: 0,
};

/* ── HELPERS ──────────────────────────────────────────────────────────────── */
function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function lineLength(line: Line): number {
  return line.tokens.reduce((n, t) => n + t.text.length, 0);
}

const FULL_PROGRESS: number[] = SCRIPT.map((l) =>
  l.kind === "input" ? lineLength(l) : 1,
);

function dotStyle(color: string): React.CSSProperties {
  return {
    width: 12,
    height: 12,
    borderRadius: 9999,
    background: color,
    display: "inline-block",
    flex: "0 0 auto",
  };
}

/* ── COMPONENT ────────────────────────────────────────────────────────────── */
export default function IntroTerminal({ onDone }: { onDone: () => void }) {
  // Per-line reveal count: typed-character count for "input", 0/1 for "print".
  const [progress, setProgress] = useState<number[]>(() => SCRIPT.map(() => 0));
  const [activeLine, setActiveLine] = useState(0);
  const [done, setDone] = useState(false); // typing finished
  const [exiting, setExiting] = useState(false); // exit transition running
  const [statusMsg, setStatusMsg] = useState(""); // polite live-region text

  // onDone may be an unstable closure; keep the latest in a ref (updated in an
  // effect, never during render).
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  // onDone() must fire exactly once, ever.
  const finishedRef = useRef(false);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const reduced = useMemo(() => prefersReducedMotion(), []);

  useEffect(() => {
    const timers = timersRef.current;

    const schedule = (fn: () => void, ms: number) => {
      const id = setTimeout(fn, ms);
      timers.push(id);
      return id;
    };

    const finish = () => {
      if (finishedRef.current) return;
      finishedRef.current = true;
      onDoneRef.current();
    };

    const startExit = (holdMs: number) =>
      schedule(() => {
        setExiting(true);
        schedule(finish, TIMING.exit);
      }, holdMs);

    // Announce loading after mount so the live region actually fires.
    setStatusMsg("Loading MaskedUSD");

    // FAILSAFE — the page can never be permanently blocked. Route through the
    // exit so even a stall hands off with the same smooth fade (finishedRef
    // guards against any double onDone if a normal exit is already in flight).
    schedule(() => startExit(0), TIMING.failsafe);

    if (reduced) {
      // Reveal everything, brief hold, simple fade exit. Deferred via a 0ms
      // timer so we don't call setState synchronously inside the effect body.
      schedule(() => {
        setProgress(FULL_PROGRESS);
        setActiveLine(SCRIPT.length);
        setDone(true);
        startExit(TIMING.reducedHold);
      }, 0);
      return () => {
        timers.forEach(clearTimeout);
        timersRef.current = [];
      };
    }

    // Typewriter driver — walk the script line by line.
    const runLine = (index: number) => {
      if (index >= SCRIPT.length) {
        setDone(true);
        startExit(TIMING.hold);
        return;
      }
      setActiveLine(index);
      const line = SCRIPT[index];

      if (line.kind === "print") {
        schedule(() => {
          setProgress((p) => {
            const next = [...p];
            next[index] = 1;
            return next;
          });
          schedule(() => runLine(index + 1), TIMING.betweenLines);
        }, TIMING.printDelay);
        return;
      }

      // input line — type the tokens character by character.
      const total = lineLength(line);
      const step = (typed: number) => {
        if (typed > total) {
          schedule(() => runLine(index + 1), TIMING.betweenLines);
          return;
        }
        setProgress((p) => {
          const next = [...p];
          next[index] = typed;
          return next;
        });
        schedule(() => step(typed + 1), TIMING.charDelay);
      };
      step(1);
    };

    schedule(() => runLine(0), TIMING.startDelay);

    return () => {
      timers.forEach(clearTimeout);
      timersRef.current = [];
    };
  }, [reduced]);

  /* ── render ────────────────────────────────────────────────────────────── */
  const renderLine = (line: Line, index: number) => {
    const shown = progress[index];
    const isActive = index === activeLine;

    if (line.kind === "print") {
      // Reserve vertical space so later lines don't pop the layout.
      if (shown < 1) {
        return <div key={index} style={{ minHeight: "1.65em" }} aria-hidden />;
      }
      return (
        <div
          key={index}
          aria-hidden
          style={{
            minHeight: "1.65em",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        >
          {line.tokens.map((t, i) => (
            <span key={i} style={{ color: COLOR[t.role] }}>
              {t.text}
            </span>
          ))}
        </div>
      );
    }

    // input line: fixed prompt, then the command clipped to `shown` chars.
    let remaining = shown;
    return (
      <div
        key={index}
        aria-hidden
        style={{
          minHeight: "1.65em",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}
      >
        <span style={{ color: COLOR.prompt }}>{PROMPT_TEXT}</span>
        <span style={{ color: COLOR.comment }}>{PROMPT_SEP}</span>
        {line.tokens.map((t, i) => {
          if (remaining <= 0) return null;
          const slice = t.text.slice(0, remaining);
          remaining -= t.text.length;
          return (
            <span key={i} style={{ color: COLOR[t.role] }}>
              {slice}
            </span>
          );
        })}
        {isActive && !done ? <Cursor /> : null}
      </div>
    );
  };

  return (
    <div
      role="presentation"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1.25rem",
        // Near-black "boot screen" with the faintest purple lift. On exit it
        // fades to reveal the light lavender hero — an intentional dark→light
        // handoff.
        background:
          "radial-gradient(120% 100% at 50% 42%, #0a0712 0%, #050308 55%, #010102 100%)",
        opacity: exiting ? 0 : 1,
        transition: `opacity ${TIMING.exit}ms cubic-bezier(0.4, 0, 0.2, 1)`,
        pointerEvents: exiting ? "none" : "auto",
      }}
    >
      {/* Visually-hidden polite status for assistive tech. */}
      <span style={SR_ONLY} role="status" aria-live="polite">
        {done || exiting ? "MaskedUSD loaded" : statusMsg}
      </span>

      {/* Mac-style terminal window (entirely decorative). */}
      <div
        aria-hidden="true"
        className="font-mono"
        style={{
          width: "min(620px, 100%)",
          borderRadius: 14,
          overflow: "hidden",
          background: "#15111f",
          border: "1px solid rgba(184,164,255,0.22)",
          boxShadow:
            "0 40px 100px -30px rgba(123,79,207,0.5), 0 0 60px -20px rgba(139,111,224,0.35), inset 0 1px 0 rgba(255,255,255,0.05)",
          transform: exiting
            ? "translateY(-6px) scale(0.985)"
            : "translateY(0) scale(1)",
          transition: `transform ${TIMING.exit}ms cubic-bezier(0.4, 0, 0.2, 1)`,
          willChange: "transform, opacity",
        }}
      >
        {/* Title bar: 3 dots + centered title. */}
        <div
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            gap: 8,
            height: 42,
            padding: "0 16px",
            background: "#1d1730",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <span style={dotStyle("#ff5f57")} />
          <span style={dotStyle("#febc2e")} />
          <span style={dotStyle("#28c840")} />
          <span
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              textAlign: "center",
              fontSize: 13,
              letterSpacing: "0.01em",
              color: "#8c86a3",
              pointerEvents: "none",
            }}
          >
            {WINDOW_TITLE}
          </span>
        </div>

        {/* Terminal body. */}
        <div
          style={{
            padding: "20px 22px 22px",
            fontSize: 16,
            lineHeight: 1.65,
            color: COLOR.out,
            // Reserve full height up front so lines reveal without jumping.
            minHeight: `calc(${SCRIPT.length} * 1.65em + 2px)`,
          }}
        >
          {SCRIPT.map((line, i) => renderLine(line, i))}
        </div>
      </div>

      {/* Component-scoped blink keyframes (no global CSS required). */}
      <style>{`
        @keyframes introTerminalBlink { 0%, 49% { opacity: 1; } 50%, 100% { opacity: 0; } }
      `}</style>
    </div>
  );
}

/** Blinking block cursor at the active typing position. */
function Cursor() {
  return (
    <span
      className="intro-terminal-cursor"
      style={{
        display: "inline-block",
        width: "0.55em",
        height: "1.05em",
        marginLeft: 2,
        transform: "translateY(0.18em)",
        background: "#b8a4ff",
        borderRadius: 1,
        animation: "introTerminalBlink 1s steps(1) infinite",
        verticalAlign: "baseline",
      }}
    />
  );
}
