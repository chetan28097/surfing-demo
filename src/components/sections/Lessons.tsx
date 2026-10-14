"use client";

import Image from "next/image";
import { useId, useState } from "react";
import { lessons } from "@/content/site";
import { BookButton } from "@/components/ui/Booking";

export function Lessons() {
  const [openId, setOpenId] = useState<string | null>(lessons[0].id);
  const [previewId, setPreviewId] = useState(lessons[0].id);
  const uid = useId();

  return (
    <section id="lessons" aria-labelledby="lessons-title" className="relative px-[var(--gutter)] pb-[20vh] pt-[24vh] text-ink">
      <div className="grid gap-x-12 gap-y-10 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <h2 id="lessons-title" className="display display-l">
            Pick the session that matches where you are.
          </h2>
          <p className="lede mt-6 text-ink/80">
            Levels build on each other. Not sure where you fit? Choose the earlier one and your coach will
            move you on.
          </p>

          <ol className="mt-14 border-b border-ink/20">
            {lessons.map((l, i) => {
              const open = openId === l.id;
              const panelId = `${uid}-${l.id}`;
              return (
                <li
                  key={l.id}
                  className="lesson-row border-t border-ink/20"
                  data-open={open}
                  onPointerEnter={() => setPreviewId(l.id)}
                >
                  <h3>
                    <button
                      type="button"
                      aria-expanded={open}
                      aria-controls={panelId}
                      onClick={() => {
                        setOpenId(open ? null : l.id);
                        setPreviewId(l.id);
                      }}
                      onFocus={() => setPreviewId(l.id)}
                      className="group grid w-full grid-cols-[2.5rem_1fr_auto] items-baseline gap-x-3 py-6 text-left sm:grid-cols-[3.5rem_1fr_auto_auto] sm:gap-x-6"
                    >
                      <span className="kicker tabular-nums text-ink/60" aria-hidden="true">
                        {l.id === "private" ? "1:1" : `0${i + 1}`}
                      </span>
                      <span>
                        <span className="display block text-[clamp(2rem,4.2vw,3.6rem)] transition-transform duration-500 ease-[var(--ease-swell)] group-hover:translate-x-2">
                          {l.title}
                        </span>
                        <span className="mt-1 block text-[1.05rem] text-ink/70">{l.level}</span>
                      </span>
                      <span className="kicker hidden text-ink/80 sm:block">From {l.price}</span>
                      <span className="lesson-row__icon grid size-10 place-items-center self-center rounded-full border border-ink/30" aria-hidden="true">
                        <svg width="14" height="14" viewBox="0 0 14 14">
                          <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                        </svg>
                      </span>
                    </button>
                  </h3>

                  <div id={panelId} role="region" aria-label={l.title} className="lesson-row__panel" inert={!open}>
                    <div>
                      <div className="grid gap-8 pb-10 pl-0 sm:pl-[calc(3.5rem+1.5rem)]">
                        <div className="relative aspect-[16/10] overflow-hidden lg:hidden">
                          <Image src={l.image.src} alt={l.image.alt} fill sizes="100vw" className="object-cover" />
                        </div>
                        <p className="measure text-lg">{l.summary}</p>
                        <dl className="grid grid-cols-3 gap-4 border-y border-ink/15 py-5">
                          <div>
                            <dt className="kicker text-ink/60">Duration</dt>
                            <dd className="mt-1">{l.duration}</dd>
                          </div>
                          <div>
                            <dt className="kicker text-ink/60">Group</dt>
                            <dd className="mt-1">{l.group}</dd>
                          </div>
                          <div>
                            <dt className="kicker text-ink/60">Price</dt>
                            <dd className="mt-1">From {l.price}</dd>
                          </div>
                        </dl>
                        <div className="grid gap-8 sm:grid-cols-2">
                          <div>
                            <p className="kicker text-ink/60">You&apos;ll learn</p>
                            <ul className="mt-2 space-y-1">
                              {l.youllLearn.map((x) => (
                                <li key={x}>{x}</li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <p className="kicker text-ink/60">Included</p>
                            <ul className="mt-2 space-y-1">
                              {l.includes.map((x) => (
                                <li key={x}>{x}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                        <div>
                          <BookButton lessonId={l.id} className="btn btn--ink">
                            Book {l.title.toLowerCase()}
                          </BookButton>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
          <p className="placeholder-note mt-6">[Prices, durations and group sizes are placeholders.]</p>
        </div>

        {/* Sticky preview, desktop only */}
        <div className="hidden lg:col-span-5 lg:block">
          <div className="sticky top-[calc(var(--header-h)+2rem)] aspect-[4/5] w-full overflow-hidden">
            {lessons.map((l) => (
              <Image
                key={l.id}
                src={l.image.src}
                alt={previewId === l.id ? l.image.alt : ""}
                aria-hidden={previewId !== l.id}
                fill
                sizes="40vw"
                className="object-cover transition-[opacity,transform] duration-700 ease-[var(--ease-swell)]"
                style={{ opacity: previewId === l.id ? 1 : 0, transform: previewId === l.id ? "scale(1)" : "scale(1.06)" }}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
