"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import { useLenis } from "lenis/react";
import { nav, site } from "@/content/site";
import { scrollToTarget } from "@/lib/scrollTo";
import { BookButton } from "@/components/ui/Booking";

export function SiteHeader() {
  const lenis = useLenis();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);

  const go = (e: MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    setMenuOpen(false);
    scrollToTarget(href, lenis);
  };

  useEffect(() => {
    if (!menuOpen) return;
    lenis?.stop();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
        menuButton.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      lenis?.start();
      window.removeEventListener("keydown", onKey);
    };
  }, [menuOpen, lenis]);

  return (
    <header className="fixed inset-x-0 top-0 z-30 px-[var(--gutter)] pt-3">
      <a href="#main" className="sr-only-focusable btn btn--solid absolute left-4 top-3 z-50">
        Skip to content
      </a>
      <div className="flex h-[3.25rem] items-center justify-between gap-4 rounded-full bg-trench/45 pl-5 pr-1.5 text-foam backdrop-blur-md">
        <a href="#top" onClick={(e) => go(e, "#top")} className="display text-[1.6rem] leading-none tracking-tight">
          {site.name}
          <span className="sr-only"> surf school, back to top</span>
        </a>

        <nav aria-label="Main" className="hidden md:block">
          <ul className="flex items-center gap-1">
            {nav.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  onClick={(e) => go(e, item.href)}
                  className="kicker rounded-full px-3.5 py-2 transition-colors hover:bg-foam/10"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-1.5">
          <BookButton className="btn btn--solid !min-h-10 !px-4 !text-[0.95rem]" />
          <button
            ref={menuButton}
            type="button"
            className="grid size-10 place-items-center rounded-full hover:bg-foam/10 md:hidden"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            onClick={() => setMenuOpen((o) => !o)}
          >
            <span className="sr-only">{menuOpen ? "Close menu" : "Open menu"}</span>
            <svg width="20" height="14" viewBox="0 0 20 14" aria-hidden="true">
              <path
                d={menuOpen ? "M3 1l14 12M17 1L3 13" : "M0 2h20M0 7h20M0 12h20"}
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      </div>

      <nav
        id="mobile-menu"
        aria-label="Main"
        hidden={!menuOpen}
        className="mt-2 rounded-3xl bg-trench/90 p-3 text-foam backdrop-blur-md md:hidden"
      >
        <ul className="grid">
          {nav.map((item) => (
            <li key={item.href}>
              <a href={item.href} onClick={(e) => go(e, item.href)} className="display block px-3 py-3 text-4xl">
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
