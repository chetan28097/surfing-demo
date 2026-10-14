"use client";

import { useRef, type MouseEvent } from "react";
import { useLenis } from "lenis/react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { journey } from "@/lib/journey";
import { scrollToTarget } from "@/lib/scrollTo";
import { site } from "@/content/site";
import { BookButton } from "@/components/ui/Booking";

/**
 * Hero + ocean dive. A 520vh track with a sticky viewport. One ScrollTrigger scrubs the
 * text beats and writes progress into the journey store, which the camera rig reads.
 */
export function Journey() {
  const root = useRef<HTMLElement>(null);
  const lenis = useLenis();

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: root.current,
            start: "top top",
            end: "bottom bottom",
            scrub: true,
            onUpdate: (self) => {
              journey.dive = self.progress;
            },
          },
        });

        // timeline length = 1, so positions read as scroll progress
        tl.to("[data-beat='hero']", { yPercent: -18, autoAlpha: 0, duration: 0.14 }, 0.02)
          .to("[data-beat='cue']", { autoAlpha: 0, duration: 0.04 }, 0)
          .fromTo("[data-beat='surface']", { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 0.06 }, 0.3)
          .to("[data-beat='surface']", { autoAlpha: 0, y: -40, duration: 0.06 }, 0.5)
          .fromTo("[data-beat='read']", { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 0.07 }, 0.64)
          .to("[data-beat='read']", { autoAlpha: 0, y: -30, duration: 0.06 }, 0.9)
          .to("[data-beat='depth']", { scaleY: 1, duration: 1, transformOrigin: "top" }, 0)
          .set({}, {}, 1);
      });

      // Hero pointer parallax for the camera (fine pointers only).
      const fine = window.matchMedia("(pointer: fine)").matches;
      const onMove = (e: PointerEvent) => {
        journey.pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
        journey.pointer.y = -((e.clientY / window.innerHeight) * 2 - 1);
      };
      if (fine) window.addEventListener("pointermove", onMove, { passive: true });

      // In case fonts or layout shift after first paint
      document.fonts?.ready.then(() => ScrollTrigger.refresh());

      return () => {
        mm.revert();
        if (fine) window.removeEventListener("pointermove", onMove);
      };
    },
    { scope: root },
  );

  const toLessons = (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    scrollToTarget("#lessons", lenis);
  };

  return (
    <section ref={root} id="top" className="journey" aria-label="Introduction">
      <div className="journey__sticky">
        <div className="hero-scrim" aria-hidden="true" />

        {/* Beat 1: hero */}
        <div data-beat="hero" className="journey__layer justify-end">
          <h1 className="display display-xl max-w-[11ch] text-foam">
            <span className="line-mask">
              <span style={{ "--i": 0 } as React.CSSProperties}>Your first</span>
            </span>
            <span className="line-mask">
              <span style={{ "--i": 1 } as React.CSSProperties}>wave is</span>
            </span>
            <span className="line-mask">
              <span style={{ "--i": 2 } as React.CSSProperties}>out there.</span>
            </span>
          </h1>
          <div className="mt-6 flex flex-col gap-6 sm:mt-8 md:flex-row md:items-end md:justify-between">
            <p className="lede fade-in text-foam/90" style={{ "--i": 3 } as React.CSSProperties}>
              Surf lessons on {site.beach} for every level, from standing up for the first time to reading
              the lineup.
            </p>
            <div className="fade-in flex flex-wrap gap-3" style={{ "--i": 4 } as React.CSSProperties}>
              <BookButton />
              <a href="#lessons" onClick={toLessons} className="btn btn--ghost text-foam">
                See lessons
              </a>
            </div>
          </div>
        </div>

        {/* Scroll cue */}
        <div
          data-beat="cue"
          className="pointer-events-none absolute right-[var(--gutter)] top-1/2 hidden -translate-y-1/2 flex-col items-center gap-3 text-foam/80 md:flex"
          aria-hidden="true"
        >
          <span className="kicker [writing-mode:vertical-rl]">Scroll to paddle out</span>
          <span className="scroll-cue__line" />
        </div>

        {/* Beat 2: breaking the surface */}
        <div data-beat="surface" className="journey__layer items-start justify-center">
          <p className="display display-l max-w-[12ch] text-foam">Below the surface, it gets quiet.</p>
        </div>

        {/* Beat 3: looking up at the board */}
        <div data-beat="read" className="journey__layer justify-end">
          <div className="grid gap-5 md:grid-cols-[1.3fr_1fr] md:items-end">
            <p className="display display-l max-w-[13ch] text-foam">Most of surfing is reading water.</p>
            <p className="lede text-foam/85 md:justify-self-end">
              So that&apos;s where every lesson starts: on the sand, watching the sets, before anyone paddles
              out.
            </p>
          </div>
        </div>

        {/* Depth gauge: a quiet progress line for the dive */}
        <div className="absolute bottom-0 left-0 top-0 hidden w-px bg-foam/10 md:block" aria-hidden="true">
          <div data-beat="depth" className="h-full w-full origin-top scale-y-0 bg-lagoon/70" />
        </div>
      </div>
    </section>
  );
}
