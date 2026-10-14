// Gerstner wave set shared by the water vertex shader and the CPU (board bobbing),
// so the surfboard rides exactly the waves that are drawn.

export type Wave = { dir: [number, number]; amp: number; length: number; steep: number };

export const WAVES: Wave[] = [
  { dir: [0.95, 0.31], amp: 0.2, length: 16, steep: 0.55 },
  { dir: [0.51, 0.86], amp: 0.11, length: 7.5, steep: 0.5 },
  { dir: [-0.37, 0.93], amp: 0.055, length: 3.7, steep: 0.4 },
  { dir: [0.87, -0.49], amp: 0.03, length: 1.9, steep: 0.3 },
];

const G = 9.8;

function prep(w: Wave) {
  const k = (2 * Math.PI) / w.length;
  const l = Math.hypot(w.dir[0], w.dir[1]);
  return { k, c: Math.sqrt(G / k), dx: w.dir[0] / l, dz: w.dir[1] / l, a: w.amp, q: w.steep };
}
const PREPPED = WAVES.map(prep);

/** Surface height at (x, z). Ignores horizontal Gerstner drift: fine for a floating body. */
export function waveHeight(x: number, z: number, t: number) {
  let y = 0;
  for (const w of PREPPED) y += w.a * Math.sin(w.k * (w.dx * x + w.dz * z - w.c * t));
  return y;
}

/** GLSL for the same waves. Exposes gerstner(pos, t, out normal). */
export const GERSTNER_GLSL = /* glsl */ `
  vec3 gerstner(vec3 p, float t, out vec3 nrm) {
    vec3 o = p;
    vec3 tangent = vec3(1.0, 0.0, 0.0);
    vec3 binormal = vec3(0.0, 0.0, 1.0);
    ${PREPPED.map(
      (w) => `{
      float k = ${w.k.toFixed(5)};
      vec2 d = vec2(${w.dx.toFixed(5)}, ${w.dz.toFixed(5)});
      float a = ${w.a.toFixed(5)};
      float q = ${w.q.toFixed(5)};
      float f = k * (dot(d, p.xz) - ${w.c.toFixed(5)} * t);
      float s = sin(f), c = cos(f);
      o.x += q * a * d.x * c;
      o.z += q * a * d.y * c;
      o.y += a * s;
      tangent += vec3(-q * d.x * d.x * k * a * s, d.x * k * a * c, -q * d.x * d.y * k * a * s);
      binormal += vec3(-q * d.x * d.y * k * a * s, d.y * k * a * c, -q * d.y * d.y * k * a * s);
    }`,
    ).join("\n")}
    nrm = normalize(cross(binormal, tangent));
    return o;
  }
`;
