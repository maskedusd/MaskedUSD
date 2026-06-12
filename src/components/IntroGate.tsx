"use client";

import { useState } from "react";
import IntroTerminal from "./IntroTerminal";

/* ── CONFIG ───────────────────────────────────────────────────────────────
 * SHOW_INTRO controls whether the terminal boot plays.
 *  - true  → plays on every mount / refresh (current behaviour).
 *  - false → skip entirely, land straight on the page.
 * To make it once-per-session instead of every refresh, swap the initial
 * state below for a sessionStorage check (commented example included).
 * ───────────────────────────────────────────────────────────────────────── */
const SHOW_INTRO = true;

/**
 * Wraps the page so the terminal intro overlays the (already-mounted) hero and
 * hands off to it. `introActive` initializes to its final value during the
 * first render — including SSR — so the overlay is part of the initial HTML and
 * the hero never flashes before the intro appears.
 */
export default function IntroGate({ children }: { children: React.ReactNode }) {
  const [introActive, setIntroActive] = useState(SHOW_INTRO);

  // Once-per-session alternative (replace the line above):
  // const [introActive, setIntroActive] = useState(() => {
  //   if (!SHOW_INTRO || typeof window === "undefined") return SHOW_INTRO;
  //   return sessionStorage.getItem("musd:intro-seen") !== "1";
  // });
  // ...and in onDone: sessionStorage.setItem("musd:intro-seen", "1");

  return (
    <>
      {children}
      {introActive && (
        <IntroTerminal onDone={() => setIntroActive(false)} />
      )}
    </>
  );
}
