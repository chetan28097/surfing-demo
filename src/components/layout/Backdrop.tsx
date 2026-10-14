"use client";

import { useRef } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { canvasVisibility, journey } from "@/lib/journey";

const ABYSS = "#062a3a";
const SAND = "#e7d3ac";
const TRENCH = "#03141c";

/**
 * One fixed colour layer between the WebGL canvas and the content. Its colour drifts
 * with scroll (abyss → sand → trench) and its opacity hands over to the 3D scene at the
 * start (end of the dive) and end (sunset). While it fully covers the canvas, the
 * canvas stops rendering. Rendered after <main> so its triggers refresh after the pins.
 */
export function Backdrop() {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const bd = ref.current;
    const mm = gsap.matchMedia();

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.set(bd, { opacity: 0, backgroundColor: ABYSS });

      // End of the dive: the deep-water fog colour becomes the page.
      gsap.to(bd, {
        opacity: 1,
        ease: "none",
        scrollTrigger: { trigger: "#top", start: "bottom 180%", end: "bottom bottom", scrub: true },
      });
      // Surfacing toward the shore for lessons.
      gsap.fromTo(
        bd,
        { backgroundColor: ABYSS },
        {
          backgroundColor: SAND,
          ease: "none",
          immediateRender: false,
          scrollTrigger: { trigger: "#lessons", start: "top 85%", end: "top 30%", scrub: true },
        },
      );
      // Back out into deep water for the gallery.
      gsap.fromTo(
        bd,
        { backgroundColor: SAND },
        {
          backgroundColor: TRENCH,
          ease: "none",
          immediateRender: false,
          scrollTrigger: { trigger: "#gallery", start: "top 95%", end: "top 35%", scrub: true },
        },
      );
      // Sunset: hand back to the 3D scene.
      gsap.fromTo(
        bd,
        { opacity: 1 },
        {
          opacity: 0,
          ease: "none",
          immediateRender: false,
          scrollTrigger: { trigger: "#finale", start: "top bottom", end: "top 25%", scrub: true },
        },
      );

      // Pause the canvas while covered; choose which camera path it resumes on.
      const sync = (self: ScrollTrigger) => {
        if (!self.isActive) journey.mode = self.progress >= 1 ? "rise" : "dive";
        canvasVisibility.set(!self.isActive);
      };
      ScrollTrigger.create({
        trigger: "#school",
        start: "top bottom",
        endTrigger: "#finale",
        end: "top bottom+=150",
        onToggle: sync,
        onRefresh: sync,
      });
      ScrollTrigger.create({
        trigger: "#finale",
        start: "top bottom",
        end: "bottom bottom",
        onUpdate: (self) => {
          journey.rise = self.progress;
        },
        onRefresh: (self) => {
          journey.rise = self.progress;
        },
      });
    });

    return () => {
      mm.revert();
      canvasVisibility.set(true);
    };
  });

  return <div ref={ref} className="backdrop" aria-hidden="true" />;
}
