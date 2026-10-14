# Saltline Surf School: design & storyboard

> "Saltline" is a working name. Every business detail (location, prices, coaches,
> contact) lives in `src/content/site.ts` as an obvious placeholder.

## Starting point (inspected 2026-10-14)

- `sidequests/surfing` was empty. Scaffolded with `create-next-app` (Next 16.4, React 19.3,
  Tailwind 4, TypeScript, App Router, `src/`). The scaffold enables `cacheComponents`.
- Added: three 0.186, @react-three/fiber 9, @react-three/drei 10, gsap 3.15 + @gsap/react,
  lenis 1.3. Dev: gltf-transform + meshoptimizer (model pipeline), sharp, Playwright.
- No existing brand assets, so photography is CC0 (Unsplash photographers, via Wikimedia
  Commons), credited in `src/content/photo-credits.json` and the footer.

## Tokens

| Name    | Hex       | Role                                                   |
|---------|-----------|--------------------------------------------------------|
| Trench  | `#03141C` | deepest water; gallery ground                          |
| Abyss   | `#062A3A` | underwater fog at depth; school section ground         |
| Swell   | `#0E6E85` | mid water, secondary surfaces                          |
| Lagoon  | `#3CC7C1` | turquoise; focus rings, live states                    |
| Sand    | `#E7D3AC` | lessons ground                                         |
| Foam    | `#EEF3EF` | cool off-white type (not cream)                        |
| Ember   | `#F2994A` | sunset only: one CTA + sun. Used sparingly.            |

Type: **Bricolage Grotesque** (variable `wdth` 75–100, `opsz`) for display, pushed to
condensed heavy at large sizes so headlines read like surf-poster lettering; **Newsreader**
serif for body (editorial, magazine-like, generous leading). Sentence case everywhere.

## Layout

Left-aligned, asymmetric. Headlines are huge and allowed to run off the measure; body copy
sits in a narrow column offset from the headline. Photos are cropped hard and overlap
column edges instead of sitting in boxes.

```
HERO / DIVE (pinned 3D)          SCHOOL (abyss)             LESSONS (sand)
+-------------------------+     +----------------------+    +-----------------------+
|Your first               |     | huge line            |    | level rows (accordion)|
|wave is      [board 3D]  |     |      [photo]  story  |    | 1 ───────── from $—   |
|out there.               |     | [photo]   coaches →  |    | 2 ─────────           |
| ↓ scroll       [water]  |     | location (placeholder)|   |       [preview photo] |
+-------------------------+     +----------------------+    +-----------------------+
GALLERY (trench, pinned filmstrip)   FINALE (3D sunset, transparent)
```

## Principles

1. **One continuous dive.** One fixed WebGL canvas and one fixed colour backdrop. The page
   never "cuts": the backdrop colour at the end of the dive equals the scene's fog colour at
   depth, then drifts toward sand, back to trench, and fades out to reveal the sunset.
2. **Spend boldness once.** The 3D dive (surface → under the board, looking up through light
   shafts) is the memorable moment. Everything else is quiet: clip-path reveals scrubbed
   to scroll, one pinned filmstrip, no hover jiggle on every card.
3. **Placeholders look like placeholders.** Bracketed `[Beach name]`, `$—`. No invented facts.

## Review against the brief (what I changed)

- First pass had a big lagoon→sand gradient band between sections. That's the "gradient
  wash" default; replaced with a scrubbed solid-colour backdrop that changes as you scroll.
- First pass had three identical lesson cards with prices. Template-y; replaced with
  full-width level rows that expand in place (keyboard accessible) with a photo preview.
- Dropped numbered markers except on lessons, where levels genuinely are a progression.

## Storyboard

| # | Scroll | Scene (3D) | DOM |
|---|--------|------------|-----|
| 1 | Hero, 0–15% of journey | Morning sky, camera above swell, board bobbing on Gerstner waves | Headline, sub, Book CTA, scroll cue |
| 2 | Dive 15–55% | Camera swings in close, board tilts, camera breaks surface; fog turns turquoise | Headline lifts away; short line: "Below the surface it gets quiet." |
| 3 | Dive 55–100% | Camera sinks, looks up at the board silhouette, god rays, drifting particles | "Most of surfing is reading water." Backdrop fades in at abyss colour |
| 4 | School | (canvas paused) | Story, coaches, location, culture; photos revealed by scrubbed clip-paths |
| 5 | Lessons | — | Backdrop drifts to sand; level rows, details, price placeholders, booking |
| 6 | Gallery | — | Backdrop trench; pinned horizontal filmstrip with inner-image parallax |
| 7 | Finale | Canvas resumes in sunset mode: camera rises through the surface to a low sun | Booking CTA, contact, socials, credits |

## Performance / a11y contract

- Canvas loaded with `next/dynamic({ ssr:false })` after capability check; static photo
  fallback on no-WebGL, low-power devices, Save-Data, or `prefers-reduced-motion`.
- Frame loop stops whenever the backdrop fully covers the canvas.
- Scroll state lives in a mutable store read in `useFrame`: no React re-render per scroll.
- All GSAP work inside `useGSAP` scopes (auto-revert, no duplicate triggers under StrictMode).
- Reduced motion: Lenis off, scrubbed reveals disabled, content visible immediately.

## Refinements from browser testing (Playwright, desktop 1440×900 + mobile 390×844)

- Hero board was backlit and edge-on: moved the morning sun behind the camera, reduced the spin.
- Water read grey: deeper zenith/horizon blues, more turquoise in the swell body.
- Snell's window from below had hard, cartoonish blob edges: replaced the binary refraction test
  with a smooth angle falloff on a flattened normal.
- The floating board vanished from below (the GPU surface drifts sideways, which CPU height ignores).
  Underwater the water now stops writing depth and draws before the board, so the hull reads as a
  silhouette in the surface.
- Light shafts showed hard plane edges: faded by facing ratio and near the surface.
- Finale lingered at the waterline (muddy brown frame): the crossing is now quick; sun disc warmed.
- Mobile: board raised above the headline; taller FOV.
- Bug: Lenis was re-created on re-render (inline options object), leaving the GSAP ticker driving
  a dead instance, so nav links stopped scrolling after the booking dialog. Options hoisted; the ticker
  resolves the live instance.
