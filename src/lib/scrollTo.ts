"use client";

import type Lenis from "lenis";

/**
 * Scroll to an in-page target and move keyboard focus there, so anchor links behave
 * the same with or without Lenis. Targets get tabIndex=-1 if they aren't focusable.
 */
export function scrollToTarget(hash: string, lenis?: Lenis | null) {
  const el = document.querySelector<HTMLElement>(hash);
  if (!el) return;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  // Move focus first (without scrolling) so keyboard users continue from the target.
  if (!el.hasAttribute("tabindex")) el.setAttribute("tabindex", "-1");
  el.focus({ preventScroll: true });
  if (lenis && !reduced) {
    lenis.start();
    lenis.scrollTo(el, { duration: 1.6 });
  } else {
    el.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
  }
  history.replaceState(null, "", hash);
}
