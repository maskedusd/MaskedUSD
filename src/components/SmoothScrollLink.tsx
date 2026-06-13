"use client";

import type { AnchorHTMLAttributes, ReactNode, MouseEvent } from "react";

type SmoothScrollLinkProps = {
  /** id of the in-page section to scroll to (without the leading #). */
  targetId: string;
  children: ReactNode;
} & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "onClick">;

/**
 * An in-page anchor that smooth-scrolls to a section WITHOUT pushing a
 * `/#section` hash onto the URL. We keep a real `href` (right-click / open in
 * new tab / a11y still work), but `preventDefault()` on click cancels the
 * browser's default hash-jump, and we scroll manually with `scrollIntoView`.
 * Honors prefers-reduced-motion by falling back to an instant jump.
 *
 * Cross-page: if the target isn't on the current page (e.g. these links are
 * reused in the header/footer on `/support`), it navigates to the home anchor
 * `/#id` instead, and the home page scrolls there on load.
 */
export default function SmoothScrollLink({
  targetId,
  children,
  ...rest
}: SmoothScrollLinkProps) {
  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const el = document.getElementById(targetId);
    if (!el) {
      // Not on this page — go to the home section.
      window.location.assign(`/#${targetId}`);
      return;
    }
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  };

  return (
    <a href={`#${targetId}`} onClick={handleClick} {...rest}>
      {children}
    </a>
  );
}
