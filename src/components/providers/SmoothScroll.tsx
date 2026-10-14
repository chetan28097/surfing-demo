"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { ReactLenis, type LenisRef } from "lenis/react";
import type { LenisOptions } from "lenis";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { useReducedMotion } from "@/lib/useReducedMotion";

// Stable identity: a new options object would make ReactLenis rebuild the instance.
const LENIS_OPTIONS: LenisOptions = { autoRaf: false, lerp: 0.09, smoothWheel: true, anchors: false };

/**
 * Lenis drives the scroll, GSAP's ticker drives Lenis, and every Lenis scroll event
 * updates ScrollTrigger, so scrubbed timelines read the same position Lenis renders.
 * With reduced motion we skip Lenis entirely and use native scrolling.
 */
export function SmoothScroll({ children }: { children: ReactNode }) {
  const reduced = useReducedMotion();
  const lenisRef = useRef<LenisRef>(null);

  useEffect(() => {
    if (reduced) return;
    // Resolve the instance every tick so a re-created Lenis is always the one driven.
    let bound: ReturnType<NonNullable<LenisRef["lenis"]>["on"]> | null = null;
    let boundTo: LenisRef["lenis"] = undefined;
    const update = (time: number) => {
      const lenis = lenisRef.current?.lenis;
      if (!lenis) return;
      if (lenis !== boundTo) {
        bound?.();
        bound = lenis.on("scroll", ScrollTrigger.update);
        boundTo = lenis;
      }
      lenis.raf(time * 1000);
    };

    gsap.ticker.add(update);
    gsap.ticker.lagSmoothing(0);
    ScrollTrigger.refresh();

    return () => {
      bound?.();
      gsap.ticker.remove(update);
      gsap.ticker.lagSmoothing(500, 33);
    };
  }, [reduced]);

  if (reduced) return <>{children}</>;

  return (
    <ReactLenis
      root
      ref={lenisRef}
      options={LENIS_OPTIONS}
    >
      {children}
    </ReactLenis>
  );
}
