import { Color, Vector3 } from "three";

// Shared uniform objects. Every custom shader references these same objects, and the
// camera rig writes them once per frame, so sky, water, rays and fog never disagree.
export const atmo = {
  uTime: { value: 0 },
  uSunDir: { value: new Vector3(0, 0.4, -1).normalize() },
  uSunColor: { value: new Color() },
  uZenith: { value: new Color() },
  uHorizon: { value: new Color() },
  uDeep: { value: new Color() },
  uShallow: { value: new Color() },
  uFogColor: { value: new Color() },
  uFogDensity: { value: 0.004 },
  /** 0 above water, 1 below. */
  uUnder: { value: 0 },
};

type Palette = {
  sunElevation: number; // degrees
  sunAzimuth: number; // degrees, 0 = straight ahead (-Z)
  sun: string;
  zenith: string;
  horizon: string;
  deep: string;
  shallow: string;
  fogDensity: number;
};

export const MORNING: Palette = {
  sunElevation: 32,
  sunAzimuth: 135,
  sun: "#fff1d6",
  zenith: "#0f5590",
  horizon: "#9fd3e3",
  deep: "#022d47",
  shallow: "#0f9aa3",
  fogDensity: 0.0065,
};

export const SUNSET: Palette = {
  sunElevation: 2.2,
  sunAzimuth: 4,
  sun: "#ffb067",
  zenith: "#25315f",
  horizon: "#f39a5c",
  deep: "#0a1f30",
  shallow: "#3b4b5c",
  fogDensity: 0.0075,
};

/** Underwater fog colour near the surface and at depth. ABYSS matches the page backdrop. */
export const UNDER_SHALLOW = new Color("#0f6f7c");
export const UNDER_DEEP = new Color("#062a3a");
export const UNDER_SUNSET = new Color("#1d3c48");

const tmp = new Color();
const tmp2 = new Color();

export function sunDirection(p: Palette, out: Vector3) {
  const el = (p.sunElevation * Math.PI) / 180;
  const az = (p.sunAzimuth * Math.PI) / 180;
  return out.set(Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el)).normalize();
}

/** Blend the two palettes (0 morning → 1 sunset) into the shared uniforms. */
export function applyPalette(s: number) {
  const lerpHex = (a: string, b: string, target: Color) => target.copy(tmp.set(a)).lerp(tmp2.set(b), s);
  lerpHex(MORNING.sun, SUNSET.sun, atmo.uSunColor.value);
  lerpHex(MORNING.zenith, SUNSET.zenith, atmo.uZenith.value);
  lerpHex(MORNING.horizon, SUNSET.horizon, atmo.uHorizon.value);
  lerpHex(MORNING.deep, SUNSET.deep, atmo.uDeep.value);
  lerpHex(MORNING.shallow, SUNSET.shallow, atmo.uShallow.value);
  const p: Palette = {
    ...MORNING,
    sunElevation: MORNING.sunElevation + (SUNSET.sunElevation - MORNING.sunElevation) * s,
    sunAzimuth: MORNING.sunAzimuth + (SUNSET.sunAzimuth - MORNING.sunAzimuth) * s,
  };
  sunDirection(p, atmo.uSunDir.value);
  return MORNING.fogDensity + (SUNSET.fogDensity - MORNING.fogDensity) * s;
}

// Shared GLSL helpers.
export const FOG_GLSL = /* glsl */ `
  uniform vec3 uFogColor;
  uniform float uFogDensity;
  vec3 applyFog(vec3 col, float dist) {
    float f = 1.0 - exp(-pow(uFogDensity * dist, 2.0));
    return mix(col, uFogColor, clamp(f, 0.0, 1.0));
  }
`;
