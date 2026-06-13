"use client";

import { useEffect, useState } from "react";
import Hero from "./Hero";
import IntroTerminal from "./IntroTerminal";
import SiteHeader from "./SiteHeader";

/* ── CONFIG ───────────────────────────────────────────────────────────────
 * SHOW_INTRO is the master switch for the terminal boot.
 *  - true  → plays ONCE, the first time a visitor ever loads the site, then
 *            never again (a flag is stored in localStorage).
 *  - false → never play; the hero just loads in on its own.
 * Clearing the `STORAGE_KEY` localStorage entry re-arms the intro.
 * ───────────────────────────────────────────────────────────────────────── */
const SHOW_INTRO = true;
const STORAGE_KEY = "maskedusd:introSeen";

/**
 * Coordinates the intro → landing handoff. The hero is always mounted (and is
 * in the SSR markup) but starts hidden; when the terminal begins its exit it
 * fires `onExitStart`, which flips `heroEntered` so the hero load-in animation
 * plays as the terminal dissolves.
 *
 * The terminal is decided on the client (localStorage isn't available during
 * SSR), so SSR renders WITHOUT it — that way returning visitors (the common
 * case) never see a terminal flash. On a first visit the effect arms it and
 * records the flag, so it only ever plays once.
 */
export default function IntroGate() {
  const [introActive, setIntroActive] = useState(false);
  const [heroEntered, setHeroEntered] = useState(false);

  useEffect(() => {
    let seen = false;
    try {
      seen = localStorage.getItem(STORAGE_KEY) === "1";
    } catch {
      // localStorage blocked (private mode / SSR-ish) — treat as already seen
      // so we never trap the user behind a terminal that can't be remembered.
      seen = true;
    }

    if (!SHOW_INTRO || seen) {
      // Skip the terminal — just play the hero load-in on the next frame.
      const id = requestAnimationFrame(() => setHeroEntered(true));
      return () => cancelAnimationFrame(id);
    }

    // First visit: remember it now (so a mid-boot refresh won't replay it),
    // then play the terminal.
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
    setIntroActive(true);
  }, []);

  return (
    <>
      <SiteHeader entered={heroEntered} />
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
