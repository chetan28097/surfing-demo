"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { coaches, site } from "@/content/site";
import { RevealImage } from "@/components/ui/RevealImage";

const principles = [
  {
    title: "Read first, paddle second.",
    body: "Every session opens on the sand. Where the rip runs, where the waves break and why, and where you'll be safest today.",
  },
  {
    title: "Small groups, close coaching.",
    body: "Few enough people that your coach sees every wave you try, and can tell you what changed on the next one.",
  },
  {
    title: "Respect the lineup.",
    body: "Priority, etiquette and looking after each other in the water. The parts of surf culture that make a beach work.",
  },
];

export function School() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // Layered depth: elements drift at different rates as the section passes.
        gsap.utils.toArray<HTMLElement>("[data-speed]").forEach((el) => {
          const speed = Number(el.dataset.speed);
          gsap.fromTo(
            el,
            { yPercent: speed * 40 },
            {
              yPercent: speed * -40,
              ease: "none",
              scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true },
            },
          );
        });
        // Principles surface one after another, like sets arriving.
        gsap.utils.toArray<HTMLElement>("[data-principle]").forEach((el) => {
          gsap.fromTo(
            el,
            { autoAlpha: 0.15, y: 60 },
            {
              autoAlpha: 1,
              y: 0,
              ease: "none",
              scrollTrigger: { trigger: el, start: "top 90%", end: "top 55%", scrub: 0.5 },
            },
          );
        });
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section ref={root} id="school" aria-labelledby="school-title" className="relative px-[var(--gutter)] pb-[18vh] pt-[22vh] text-foam">
      {/* Story */}
      <div className="grid gap-x-12 gap-y-14 lg:grid-cols-12">
        <h2 id="school-title" className="display display-l lg:col-span-8">
          A small surf school that starts every lesson by watching the water.
        </h2>

        <div className="lg:col-span-5 lg:col-start-1 lg:row-start-2 lg:pt-24">
          <div className="measure space-y-5 text-foam/85">
            <p>
              {site.fullName} teaches on {site.beach}, {site.region}. We keep groups small, match boards
              to the person rather than the rack, and stay in the water with you for the whole session.
            </p>
            <p>
              Surfing is mostly patience and paying attention. Learning to read where a wave will break
              is worth more than any pop-up drill, so that&apos;s what we teach first.
            </p>
            <p className="placeholder-note">
              [Founding story: who started the school, in {site.founded}, and why. Replace this note.]
            </p>
          </div>
        </div>

        <div className="relative lg:col-span-6 lg:col-start-7 lg:row-span-2 lg:row-start-1 lg:mt-[22vh]">
          <RevealImage
            src="/images/pier.jpg"
            alt="A surfer in a wetsuit sitting on the sand next to a board, looking out toward a pier"
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="aspect-[4/5] w-full"
          />
          <div data-speed="0.6" className="absolute -bottom-16 -left-6 w-[46%] sm:-left-16 lg:-left-28">
            <RevealImage
              src="/images/girlboard.jpg"
              alt="A surfer carrying a red and blue board along the shoreline"
              sizes="(min-width: 1024px) 22vw, 45vw"
              className="aspect-square w-full shadow-[0_30px_60px_-20px_rgb(0_0_0/0.6)]"
              from="left"
            />
          </div>
        </div>
      </div>

      {/* How we teach */}
      <div className="mt-[22vh] grid gap-16 lg:grid-cols-12">
        <h3 className="display display-m lg:col-span-4">How we teach</h3>
        <ul className="grid gap-14 lg:col-span-8">
          {principles.map((p, i) => (
            <li
              key={p.title}
              data-principle
              className="grid gap-3 border-t border-foam/15 pt-6 md:grid-cols-[1fr_1fr] md:gap-10"
              style={{ marginLeft: `${i * 6}%` }}
            >
              <p className="font-serif text-[clamp(1.6rem,2.6vw,2.4rem)] italic leading-[1.15]">{p.title}</p>
              <p className="text-foam/75">{p.body}</p>
            </li>
          ))}
        </ul>
      </div>

      {/* Coaches */}
      <div className="mt-[22vh]">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <h3 className="display display-m">Your coaches</h3>
          <p className="placeholder-note max-w-[38ch]">[Add coach photos, names and certifications.]</p>
        </div>
        <ul className="mt-10 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3">
          {coaches.map((c, i) => (
            <li key={i} className={i === 1 ? "lg:mt-20" : i === 2 ? "lg:mt-10" : ""}>
              <div className="coach-portrait" role="img" aria-label="Coach photo placeholder">
                <span className="placeholder-note">Coach photo</span>
              </div>
              <p className="mt-4 font-display text-2xl font-bold [font-variation-settings:'wdth'_80]">{c.name}</p>
              <p className="text-foam/75">{c.role}</p>
              <p className="placeholder-note mt-1">{c.note}</p>
            </li>
          ))}
        </ul>
      </div>

      {/* Location */}
      <div className="mt-[22vh] grid items-center gap-12 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <h3 className="display display-m">Where we meet</h3>
          <dl className="mt-8 grid gap-5">
            <div>
              <dt className="kicker text-lagoon">Beach</dt>
              <dd>
                {site.beach}, {site.region}
              </dd>
            </div>
            <div>
              <dt className="kicker text-lagoon">Meeting point</dt>
              <dd>{site.address}</dd>
            </div>
            <div>
              <dt className="kicker text-lagoon">Hours</dt>
              <dd>{site.hours}</dd>
            </div>
          </dl>
          <p className="mt-6 measure text-foam/75">
            Lesson times move with the tide and the forecast. <span className="placeholder-note">[How and when you confirm times.]</span>
          </p>
        </div>
        <div className="relative lg:col-span-7">
          <RevealImage
            src="/images/lesson.jpg"
            alt="Aerial view of two surfers walking across the sand toward the water"
            sizes="(min-width: 1024px) 58vw, 100vw"
            className="aspect-[5/4] w-full"
            from="right"
          />
          <p className="placeholder-note absolute bottom-3 left-3 rounded-full bg-trench/70 px-3 py-1 !opacity-90">
            [Replace with a map or a photo of your beach]
          </p>
        </div>
      </div>
    </section>
  );
}
