"use client";

import { useEffect, useState } from "react";
import Hero from "./Hero";
import SiteHeader from "./SiteHeader";

/**
 * Mounts the fixed site header + hero and plays the hero's gentle load-in on
 * first paint. (The terminal boot intro has been removed.)
 */
export default function IntroGate() {
  const [entered, setEntered] = useState(false);

  // Trigger the staggered `.enter` load-in on the next frame after mount.
  useEffect(() => {
    const id = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <>
      <SiteHeader entered={entered} />
      <Hero entered={entered} />
    </>
  );
}
