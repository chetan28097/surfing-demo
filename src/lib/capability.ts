"use client";

export type SceneTier = "none" | "low" | "high";

/** Decide whether to run the WebGL scene, and at what quality. Client only. */
export function detectSceneTier(): SceneTier {
  if (typeof window === "undefined") return "none";
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return "none";

  const nav = navigator as Navigator & {
    deviceMemory?: number;
    connection?: { saveData?: boolean };
  };
  if (nav.connection?.saveData) return "none";

  let gl: WebGLRenderingContext | WebGL2RenderingContext | null = null;
  try {
    const canvas = document.createElement("canvas");
    gl = canvas.getContext("webgl2") ?? canvas.getContext("webgl");
  } catch {
    gl = null;
  }
  if (!gl) return "none";
  gl.getExtension("WEBGL_lose_context")?.loseContext();

  const cores = nav.hardwareConcurrency ?? 4;
  const memory = nav.deviceMemory ?? 4;
  if (cores <= 2 || memory <= 2) return "none";

  const small = window.matchMedia("(max-width: 768px)").matches;
  if (small || cores <= 4 || memory <= 4) return "low";
  return "high";
}
