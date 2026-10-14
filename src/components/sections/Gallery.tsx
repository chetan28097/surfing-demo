"use client";

import Image from "next/image";
import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { gallery } from "@/content/site";

// Height (relative to the strip) and vertical offset per frame, for a staggered rhythm.
const LAYOUT = [
  { h: 1, offset: "0" },
  { h: 0.7, offset: "18vh" },
  { h: 0.86, offset: "-10vh" },
  { h: 0.62, offset: "14vh" },
  { h: 1, offset: "-4vh" },
  { h: 0.72, offset: "12vh" },
  { h: 0.9, offset: "-12vh" },
  { h: 0.66, offset: "8vh" },
];

export function Gallery() {
  const root = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add("(min-width: 768px) and (prefers-reduced-motion: no-preference)", () => {
        const el = track.current!;
        const distance = () => el.scrollWidth - window.innerWidth;

        const scroll = gsap.to(el, {
          x: () => -distance(),
          ease: "none",
          scrollTrigger: {
            trigger: root.current,
            start: "top top",
            end: () => `+=${distance()}`,
            pin: true,
            scrub: true,
            invalidateOnRefresh: true,
            refreshPriority: 1,
          },
        });

        gsap.utils.toArray<HTMLElement>(".film__frame").forEach((frame, i) => {
          const img = frame.querySelector("img");
          // inner parallax: the photo slides against the frame as the strip moves
          gsap.fromTo(
            img,
            { xPercent: -7 },
            {
              xPercent: 7,
              ease: "none",
              scrollTrigger: {
                trigger: frame,
                containerAnimation: scroll,
                start: "left right",
                end: "right left",
                scrub: true,
              },
            },
          );
          // staggered reveal as each frame enters from the right
          gsap.fromTo(
            frame,
            { clipPath: i % 2 ? "inset(100% 0% 0% 0%)" : "inset(0% 0% 100% 0%)" },
            {
              clipPath: "inset(0% 0% 0% 0%)",
              ease: "none",
              scrollTrigger: {
                trigger: frame,
                containerAnimation: scroll,
                start: "left 98%",
                end: "left 55%",
                scrub: true,
              },
            },
          );
        });
      });

      mm.add("(max-width: 767px) and (prefers-reduced-motion: no-preference)", () => {
        gsap.utils.toArray<HTMLElement>(".film__frame").forEach((frame) => {
          gsap.fromTo(
            frame,
            { clipPath: "inset(18% 8% 18% 8%)" },
            {
              clipPath: "inset(0% 0% 0% 0%)",
              ease: "none",
              scrollTrigger: { trigger: frame, start: "top 95%", end: "top 45%", scrub: true },
            },
          );
        });
      });

      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section ref={root} id="gallery" aria-labelledby="gallery-title" className="film relative text-foam md:h-screen md:overflow-hidden">
      <div className="flex h-full flex-col justify-center gap-10 py-[14vh] md:py-0">
        <div className="flex flex-wrap items-end justify-between gap-6 px-[var(--gutter)]">
          <h2 id="gallery-title" className="display display-l max-w-[12ch]">
            From the water
          </h2>
          <p className="max-w-[34ch] text-foam/70">
            A few frames to set the mood. <span className="placeholder-note">[Swap in photos from your own lessons.]</span>
          </p>
        </div>

        <div
          ref={track}
          className="film__track flex-col !items-stretch md:flex-row md:!items-center"
          role="list"
        >
          {gallery.map((g, i) => (
            <figure
              key={g.src}
              role="listitem"
              className="film__frame max-md:!m-0 max-md:!h-auto max-md:w-full"
              style={
                {
                  "--ar": `${g.w} / ${g.h}`,
                  "--h": LAYOUT[i].h,
                  "--offset": LAYOUT[i].offset,
                } as React.CSSProperties
              }
            >
              <Image src={g.src} alt={g.alt} fill sizes="(min-width: 768px) 60vw, 100vw" className="object-cover" />
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
