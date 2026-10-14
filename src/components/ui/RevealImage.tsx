"use client";

import Image from "next/image";
import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";

type Props = {
  src: string;
  alt: string;
  sizes: string;
  className?: string;
  /** Where the wipe starts from. */
  from?: "bottom" | "left" | "right";
};

/**
 * Photo revealed by a clip-path wipe scrubbed to scroll, with the image settling from
 * a slight zoom inside the frame. With reduced motion it is simply shown.
 */
export function RevealImage({ src, alt, sizes, className = "", from = "bottom" }: Props) {
  const frame = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const start = { bottom: "inset(100% 0% 0% 0%)", left: "inset(0% 100% 0% 0%)", right: "inset(0% 0% 0% 100%)" }[from];
        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: { trigger: frame.current, start: "top 92%", end: "top 35%", scrub: 0.6 },
        });
        tl.fromTo(frame.current, { clipPath: start }, { clipPath: "inset(0% 0% 0% 0%)" }, 0).fromTo(
          frame.current!.querySelector("img"),
          { scale: 1.25 },
          { scale: 1 },
          0,
        );
      });
      return () => mm.revert();
    },
    { scope: frame },
  );

  return (
    <div ref={frame} className={`reveal-frame ${className}`}>
      <Image src={src} alt={alt} fill sizes={sizes} className="object-cover" />
    </div>
  );
}
