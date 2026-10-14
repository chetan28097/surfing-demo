"use client";

import Image from "next/image";
import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { site } from "@/content/site";
import credits from "@/content/photo-credits.json";
import { BookButton } from "@/components/ui/Booking";
import { useSceneTier } from "@/components/scene/SceneTier";

export function Finale() {
  const root = useRef<HTMLElement>(null);
  const { tier } = useSceneTier();

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(
          "[data-finale-copy]",
          { autoAlpha: 0, y: 60 },
          {
            autoAlpha: 1,
            y: 0,
            ease: "none",
            stagger: 0.08,
            scrollTrigger: { trigger: root.current, start: "top -45%", end: "top -85%", scrub: true },
          },
        );
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section ref={root} id="finale" aria-labelledby="finale-title" className="relative text-foam">
      <div className="relative h-[200vh] motion-reduce:h-auto">
        <div className="sticky top-0 flex h-svh flex-col justify-end overflow-hidden px-[var(--gutter)] pb-[8vh] motion-reduce:relative">
          {tier === "none" && (
            <div className="absolute inset-0 -z-10" aria-hidden="true">
              <Image src="/images/sunset.jpg" alt="" fill sizes="100vw" className="object-cover" />
            </div>
          )}
          <div
            className="pointer-events-none absolute inset-0 -z-[5] bg-[linear-gradient(180deg,transparent_35%,rgb(3_20_28/0.75)_100%)]"
            aria-hidden="true"
          />
          <div id="contact" className="grid gap-10 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-7">
              <h2 id="finale-title" data-finale-copy className="display display-xl">
                Paddle out with us.
              </h2>
              <div data-finale-copy className="mt-8 flex flex-wrap items-center gap-4">
                <BookButton className="btn btn--ember">Book a lesson</BookButton>
                <a href={`mailto:${site.email}`} className="btn btn--ghost">
                  Email the school
                </a>
              </div>
            </div>
            <address data-finale-copy className="grid gap-4 not-italic sm:grid-cols-2 lg:col-span-5">
              <div>
                <p className="kicker text-foam/60">Email</p>
                <a className="underline decoration-foam/30 underline-offset-4 hover:decoration-foam" href={`mailto:${site.email}`}>
                  {site.email}
                </a>
              </div>
              <div>
                <p className="kicker text-foam/60">Phone</p>
                <a className="underline decoration-foam/30 underline-offset-4 hover:decoration-foam" href={`tel:${site.phone}`}>
                  {site.phone}
                </a>
              </div>
              <div>
                <p className="kicker text-foam/60">Find us</p>
                <p>{site.address}</p>
              </div>
              <div>
                <p className="kicker text-foam/60">Follow</p>
                <ul className="flex flex-wrap gap-x-4">
                  {site.social.map((s) => (
                    <li key={s.label}>
                      <a href={s.href} className="underline decoration-foam/30 underline-offset-4 hover:decoration-foam">
                        {s.label}
                        <span className="sr-only"> {s.handle}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </address>
          </div>
        </div>
      </div>

      <footer className="relative bg-trench px-[var(--gutter)] py-10 text-[0.95rem] text-foam/65">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <p>
            © {site.copyrightYear} {site.fullName}. <span className="placeholder-note">[Company details]</span>
          </p>
          <details className="max-w-[60ch]">
            <summary className="cursor-pointer">Photo credits</summary>
            <p className="mt-3">All photographs are CC0 (public domain), originally published on Unsplash.</p>
            <ul className="mt-2 columns-2 gap-6 text-[0.85rem]">
              {Object.values(credits).map((c) => (
                <li key={c.source}>
                  <a href={c.source} className="hover:text-foam" rel="noreferrer" target="_blank">
                    {c.artist.split(" ").slice(0, -1).join(" ") || c.artist}
                  </a>
                </li>
              ))}
            </ul>
          </details>
        </div>
      </footer>
    </section>
  );
}
