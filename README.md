# Saltline Surf School (working name)

Scroll-driven, real-time 3D website for a surf school. You start above morning swell with a hovering board,
dive under it, surface into the school's story, lessons and gallery, then rise back up into a sunset to book.

Design rationale and storyboard: [`docs/DESIGN.md`](docs/DESIGN.md).

## Stack

Next.js 16 (App Router, static) · React 19 · TypeScript · Tailwind 4 · three.js + React Three Fiber + Drei ·
GSAP 3 + ScrollTrigger (`@gsap/react`) · Lenis.

## Run

```bash
npm install
npm run dev            # http://localhost:3000
npm run build && npx next start -p 3210
npm run inspect        # Playwright: desktop + mobile screenshots, interaction checks (server on :3210)
npm run inspect:reduced
npm run build:model    # regenerate public/models/surfboard.glb
```

## Before launch: replace placeholders

Every business detail is bracketed and lives in **`src/content/site.ts`**: name, beach, address, hours,
email, phone, socials, coaches, lesson durations, group sizes and prices. Also:

- `src/components/sections/School.tsx`: founding-story note, coach photos (currently hatched placeholders).
- Gallery/lesson photos in `public/images/` are CC0 stock (credited in the footer, from
  `src/content/photo-credits.json`). Swap in the school's own photography.
- `src/app/api/booking/route.ts` validates and returns a reference but **only logs the request**. Connect it
  to your booking system or email provider there; keep keys in server-side env vars.
- Set `NEXT_PUBLIC_SITE_URL` for absolute Open Graph URLs.

## How it fits together

```
src/
  app/            layout (fonts, metadata), page (composition), api/booking
  content/        site.ts (all copy & placeholders), photo-credits.json
  lib/            gsap registration, journey store, capability detection, scroll helper
  components/
    providers/    SmoothScroll: Lenis driven by gsap.ticker, synced to ScrollTrigger
    scene/        WebGL: SceneLayer (fallback + dynamic import) → SceneCanvas → Ocean, SkyDome,
                  Underwater (light shafts, particles, caustic floor), Surfboard, CameraRig
    sections/     Journey (hero + dive), School, Lessons, Gallery, Finale
    layout/       SiteHeader, Backdrop (page colour flow + canvas pause/resume)
    ui/           Booking (context + <dialog> form), RevealImage
scripts/          build-surfboard.mjs (GLB generator), inspect.mjs, reduced-check.mjs, nav-check.mjs
```

- **Scroll → 3D without re-renders.** ScrollTriggers write progress into a plain mutable store
  (`lib/journey.ts`); `CameraRig` reads it in `useFrame`, samples a keyframed Catmull-Rom path and damps toward it.
- **Shared wave model.** `scene/waves.ts` generates the Gerstner GLSL *and* a CPU height function, so the
  board floats on the waves the shader draws.
- **One continuous journey.** A fixed backdrop sits between the canvas and the content. At the end of the dive it
  fades in at the exact deep-water fog colour, drifts to sand for lessons and trench for the gallery, then fades
  out to reveal the sunset. While it covers the canvas, `frameloop` is `"never"` (zero GPU work).
- **Model.** The surfboard GLB is generated procedurally (outline, rocker, foil, rails, thruster fins), then
  welded, quantized and meshopt-compressed (112 KB). Decoded locally; no Draco CDN fetch.
- **Fallbacks.** No WebGL, ≤2 cores/≤2 GB, Save-Data or `prefers-reduced-motion` gives still photography,
  native scrolling, no scrubbed animation, all content visible. Lost WebGL context switches to the same fallback.
  Mobile/mid devices get a lighter tier (fewer water vertices and particles, lower DPR, no MSAA).
- **Hygiene.** All GSAP work lives in `useGSAP` scopes / `gsap.matchMedia` (auto-reverted, StrictMode-safe).
  Every three.js geometry/material created imperatively is disposed. No per-frame allocations in the rig.
