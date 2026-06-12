"use client";

import { useEffect, useState } from "react";
import Hero from "./Hero";
import IntroTerminal from "./IntroTerminal";

/* ── CONFIG ───────────────────────────────────────────────────────────────
 * SHOW_INTRO controls whether the terminal boot plays.
 *  - true  → plays on every mount / refresh (current behaviour).
 *  - false → skip the terminal; the hero just loads in on its own.
 * To make it once-per-session instead of every refresh, gate `introActive`
 * with a sessionStorage check (and set the flag in onDone).
 * ───────────────────────────────────────────────────────────────────────── */
const SHOW_INTRO = true;

/**
 * Coordinates the intro → landing handoff. The hero is always mounted (and is
 * in the SSR markup) but starts hidden; when the terminal begins its exit it
 * fires `onExitStart`, which flips `heroEntered` so the hero load-in animation
 * plays as the terminal dissolves. With no intro, the hero loads in on its own.
 */
export default function IntroGate() {
  const [introActive, setIntroActive] = useState(SHOW_INTRO);
  const [heroEntered, setHeroEntered] = useState(false);

  // No intro → still play the hero load-in on first paint.
  useEffect(() => {
    if (SHOW_INTRO) return;
    const id = requestAnimationFrame(() => setHeroEntered(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <>
      <Hero entered={heroEntered} />
      {introActive && (
        <IntroTerminal
          onExitStart={() => setHeroEntered(true)}
          onDone={() => setIntroActive(false)}
        />
      )}
    </>
  );
}
