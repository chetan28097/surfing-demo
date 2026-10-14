// Generates public/models/surfboard.glb: a 7'2" funboard with thruster fins.
// Parametric outline + rocker + foil, swept superellipse rails, vertex-coloured resin tint.
// Output is welded, quantized and meshopt-compressed (decoded client-side by drei/useGLTF).
//
//   node scripts/build-surfboard.mjs
import { Document, NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS, KHRMaterialsClearcoat } from "@gltf-transform/extensions";
import { weld, quantize, meshopt, prune, dedup } from "@gltf-transform/functions";
import { MeshoptEncoder } from "meshoptimizer";
import fs from "node:fs";

const L = 2.18; // metres
const SEG_L = 140;
const SEG_R = 72;

// Catmull-Rom through (t, value) control points.
function curve(points) {
  return (t) => {
    let i = points.findIndex((p, k) => k < points.length - 1 && t <= points[k + 1][0]);
    if (i < 0) i = points.length - 2;
    const p0 = points[Math.max(i - 1, 0)], p1 = points[i], p2 = points[i + 1], p3 = points[Math.min(i + 2, points.length - 1)];
    const u = (t - p1[0]) / (p2[0] - p1[0] || 1);
    const a = p1[1], b = p2[1];
    const m1 = (p2[1] - p0[1]) / 2, m2 = (p3[1] - p1[1]) / 2;
    const u2 = u * u, u3 = u2 * u;
    return (2 * u3 - 3 * u2 + 1) * a + (u3 - 2 * u2 + u) * m1 + (-2 * u3 + 3 * u2) * b + (u3 - u2) * m2;
  };
}

// t = 0 tail, t = 1 nose
const halfWidth = curve([[0, 0.0], [0.004, 0.11], [0.04, 0.165], [0.18, 0.225], [0.42, 0.268], [0.55, 0.27], [0.74, 0.245], [0.88, 0.18], [0.96, 0.1], [0.993, 0.035], [1, 0]]);
const thick = curve([[0, 0.012], [0.05, 0.034], [0.2, 0.056], [0.45, 0.068], [0.6, 0.066], [0.8, 0.05], [0.95, 0.03], [1, 0.012]]);
const rocker = (t) => 0.13 * Math.pow(Math.max(0, (t - 0.55) / 0.45), 2.3) + 0.045 * Math.pow(Math.max(0, (0.35 - t) / 0.35), 2);

const FOAM = [0.93, 0.95, 0.93];
const TINT = [0.05, 0.47, 0.52];
const PIN = [0.95, 0.6, 0.29];

function sweepBody() {
  const pos = [], col = [], idx = [];
  for (let i = 0; i <= SEG_L; i++) {
    // denser sampling near nose and tail
    const s = i / SEG_L;
    const t = 0.5 - 0.5 * Math.cos(Math.PI * s);
    const w = Math.max(halfWidth(t), 0.0005);
    const h = thick(t);
    const z = (t - 0.5) * L;
    const r = rocker(t);
    for (let j = 0; j < SEG_R; j++) {
      const th = (j / SEG_R) * Math.PI * 2;
      const c = Math.cos(th), sn = Math.sin(th);
      // superellipse: boxy-but-soft rails, domed deck, flatter bottom
      const n = sn >= 0 ? 2.6 : 3.4;
      const x = w * Math.sign(c) * Math.pow(Math.abs(c), 2 / n);
      const yUnit = Math.sign(sn) * Math.pow(Math.abs(sn), 2 / n);
      const y = r + (sn >= 0 ? yUnit * h * 0.62 : yUnit * h * 0.38);
      pos.push(x, y, -z); // nose toward -Z
      // resin tint on bottom + lower rail, amber pinline at the tint boundary
      const band = sn;
      let colr = FOAM;
      if (band < 0.18) colr = TINT;
      if (band >= 0.18 && band < 0.3) colr = PIN;
      col.push(...colr);
    }
  }
  for (let i = 0; i < SEG_L; i++) {
    for (let j = 0; j < SEG_R; j++) {
      const a = i * SEG_R + j, b = i * SEG_R + ((j + 1) % SEG_R);
      const c = a + SEG_R, d = b + SEG_R;
      idx.push(a, c, b, b, c, d);
    }
  }
  return { pos, col, idx };
}

function stringer() {
  const pos = [], idx = [];
  const half = 0.0035;
  for (let i = 0; i <= SEG_L; i++) {
    const s = i / SEG_L;
    const t = 0.012 + 0.976 * (0.5 - 0.5 * Math.cos(Math.PI * s));
    const y = rocker(t) + thick(t) * 0.62 + 0.0006;
    const z = -(t - 0.5) * L;
    pos.push(-half, y, z, half, y, z);
  }
  for (let i = 0; i < SEG_L; i++) {
    const a = i * 2;
    idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
  }
  return { pos, idx };
}

// Swept fin: outline in (chord, depth) plane, extruded to a thin foil.
function fin(base, depth, sweep, x, t, toe, cant) {
  const outline = [];
  const N = 24;
  for (let i = 0; i <= N; i++) { // leading edge, root to tip
    const u = i / N;
    outline.push([base * 0.5 - sweep * Math.pow(u, 1.6) * base, -depth * Math.sin((u * Math.PI) / 2)]);
  }
  for (let i = N; i >= 0; i--) { // trailing edge, tip to root, concave
    const u = i / N;
    const lead = outline[i];
    outline.push([lead[0] - base * (1 - u) ** 1.2 * 0.95 - 0.004, lead[1] * (0.96 + 0.04 * u)]);
  }
  const zc = -(t - 0.5) * L;
  const yRoot = rocker(t) - thick(t) * 0.38 + 0.002;
  const pos = [], idx = [];
  const halfT = 0.0042;
  const cosT = Math.cos(toe), sinT = Math.sin(toe), cosC = Math.cos(cant), sinC = Math.sin(cant);
  const place = (cx, cy, side) => {
    const thin = halfT * (1 - Math.min(1, Math.abs(cy) / depth) * 0.75);
    let px = side * thin, py = cy, pz = -cx; // chord along -Z (forward)
    // cant (roll about Z), toe (yaw about Y)
    [px, py] = [px * cosC - py * sinC, px * sinC + py * cosC];
    [px, pz] = [px * cosT + pz * sinT, -px * sinT + pz * cosT];
    return [px + x, py + yRoot, pz + zc];
  };
  for (const side of [-1, 1]) for (const [cx, cy] of outline) pos.push(...place(cx, cy, side));
  const M = outline.length;
  // faces: fan for each side (outline is roughly convex from centroid), plus edge strip
  const cIdx = pos.length / 3;
  const cen = outline.reduce((a, p) => [a[0] + p[0] / M, a[1] + p[1] / M], [0, 0]);
  pos.push(...place(cen[0], cen[1], -1), ...place(cen[0], cen[1], 1));
  for (let k = 0; k < M - 1; k++) {
    idx.push(cIdx, k + 1, k);
    idx.push(cIdx + 1, M + k, M + k + 1);
    idx.push(k, k + 1, M + k, M + k, k + 1, M + k + 1);
  }
  return { pos, idx };
}

function normalsFor(pos, idx) {
  const n = new Float32Array(pos.length);
  for (let k = 0; k < idx.length; k += 3) {
    const [a, b, c] = [idx[k] * 3, idx[k + 1] * 3, idx[k + 2] * 3];
    const ux = pos[b] - pos[a], uy = pos[b + 1] - pos[a + 1], uz = pos[b + 2] - pos[a + 2];
    const vx = pos[c] - pos[a], vy = pos[c + 1] - pos[a + 1], vz = pos[c + 2] - pos[a + 2];
    const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    for (const v of [a, b, c]) { n[v] += nx; n[v + 1] += ny; n[v + 2] += nz; }
  }
  for (let v = 0; v < n.length; v += 3) {
    const l = Math.hypot(n[v], n[v + 1], n[v + 2]) || 1;
    n[v] /= l; n[v + 1] /= l; n[v + 2] /= l;
  }
  return n;
}

const doc = new Document();
const buffer = doc.createBuffer();
const clearcoat = doc.createExtension(KHRMaterialsClearcoat);

function addMesh(name, { pos, idx, col }, material) {
  const p = doc.createPrimitive()
    .setAttribute("POSITION", doc.createAccessor().setType("VEC3").setArray(new Float32Array(pos)).setBuffer(buffer))
    .setAttribute("NORMAL", doc.createAccessor().setType("VEC3").setArray(normalsFor(pos, idx)).setBuffer(buffer))
    .setIndices(doc.createAccessor().setType("SCALAR").setArray(new Uint32Array(idx)).setBuffer(buffer))
    .setMaterial(material);
  if (col) p.setAttribute("COLOR_0", doc.createAccessor().setType("VEC3").setArray(new Float32Array(col)).setBuffer(buffer));
  return doc.createNode(name).setMesh(doc.createMesh(name).addPrimitive(p));
}

const resin = doc.createMaterial("Resin").setBaseColorFactor([1, 1, 1, 1]).setRoughnessFactor(0.38).setMetallicFactor(0)
  .setExtension("KHR_materials_clearcoat", clearcoat.createClearcoat().setClearcoatFactor(0.8).setClearcoatRoughnessFactor(0.12));
const wood = doc.createMaterial("Stringer").setBaseColorFactor([0.42, 0.27, 0.15, 1]).setRoughnessFactor(0.5).setMetallicFactor(0);
const finMat = doc.createMaterial("Fin").setBaseColorFactor([0.07, 0.11, 0.13, 1]).setRoughnessFactor(0.25).setMetallicFactor(0);

const root = doc.createNode("Surfboard");
root.addChild(addMesh("Body", sweepBody(), resin));
root.addChild(addMesh("Stringer", stringer(), wood));
root.addChild(addMesh("FinCenter", fin(0.11, 0.115, 0.55, 0, 0.045, 0, 0), finMat));
root.addChild(addMesh("FinLeft", fin(0.115, 0.118, 0.55, -0.155, 0.12, -0.06, 0.09), finMat));
root.addChild(addMesh("FinRight", fin(0.115, 0.118, 0.55, 0.155, 0.12, 0.06, -0.09), finMat));
doc.createScene("Scene").addChild(root);

await MeshoptEncoder.ready;
await doc.transform(dedup(), weld(), prune(), quantize(), meshopt({ encoder: MeshoptEncoder, level: "medium" }));

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ "meshopt.encoder": MeshoptEncoder });
fs.mkdirSync("public/models", { recursive: true });
await io.write("public/models/surfboard.glb", doc);
console.log("surfboard.glb", (fs.statSync("public/models/surfboard.glb").size / 1024).toFixed(1), "KB");
