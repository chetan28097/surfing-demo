// Mutable scroll state shared between GSAP (DOM side) and the R3F frame loop.
// Deliberately not React state: scroll updates must not trigger re-renders.
export const journey = {
  /** 0 → 1 through the hero + dive sequence */
  dive: 0,
  /** 0 → 1 through the finale (rise to the surface at sunset) */
  rise: 0,
  /** which pose set drives the camera: "dive" until the finale takes over */
  mode: "dive" as "dive" | "rise",
  /** pointer in NDC, for a little parallax on the hero */
  pointer: { x: 0, y: 0 },
};

type Listener = (active: boolean) => void;
const listeners = new Set<Listener>();
let canvasActive = true;

/** Whether the canvas is visible (not covered by the backdrop). */
export const canvasVisibility = {
  get: () => canvasActive,
  set(active: boolean) {
    if (active === canvasActive) return;
    canvasActive = active;
    listeners.forEach((l) => l(active));
  },
  subscribe(l: Listener) {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  },
};
