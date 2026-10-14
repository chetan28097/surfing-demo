"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { type Group, MathUtils, Mesh, MeshPhysicalMaterial } from "three";
import { journey } from "@/lib/journey";
import { waveHeight } from "./waves";
import { heroBoardX, heroBoardY } from "./poses";

const MODEL = "/models/surfboard.glb";
const HALF_LENGTH = 1.0;
const HALF_WIDTH = 0.26;

const smooth = (a: number, b: number, x: number) => {
  const t = MathUtils.clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};

export function Surfboard() {
  // meshopt-compressed GLB; Draco disabled so nothing is fetched from a CDN.
  const { scene } = useGLTF(MODEL, false, true);
  const board = useMemo(() => scene.clone(true), [scene]);
  const outer = useRef<Group>(null);
  const inner = useRef<Group>(null);
  const aspect = useThree((s) => s.size.width / s.size.height);

  useEffect(() => {
    board.traverse((o) => {
      if (o instanceof Mesh) {
        o.castShadow = false;
        o.renderOrder = 2; // after the water (see Ocean)
        const m = o.material;
        if (m instanceof MeshPhysicalMaterial) m.envMapIntensity = 0.9;
      }
    });
  }, [board]);

  useFrame(({ clock }) => {
    const g = outer.current;
    const r = inner.current;
    if (!g || !r) return;
    const t = clock.elapsedTime;

    // Floating pose: ride the same Gerstner surface the shader draws.
    const yaw = journey.mode === "rise" ? 0.35 : 0.62;
    const cy = Math.cos(yaw), sy = Math.sin(yaw);
    const rising = journey.mode === "rise";
    const px = rising ? -0.25 : 0;
    const pz = rising ? 0.4 : 0;
    const h0 = waveHeight(px, pz, t);
    const hN = waveHeight(px - sy * HALF_LENGTH, pz - cy * HALF_LENGTH, t);
    const hT = waveHeight(px + sy * HALF_LENGTH, pz + cy * HALF_LENGTH, t);
    const hL = waveHeight(px - cy * HALF_WIDTH, pz + sy * HALF_WIDTH, t);
    const hR = waveHeight(px + cy * HALF_WIDTH, pz - sy * HALF_WIDTH, t);
    const pitch = Math.atan2(hN - hT, HALF_LENGTH * 2);
    const roll = Math.atan2(hR - hL, HALF_WIDTH * 2) * 0.6;

    // Hero pose: hovering above the water, standing on its tail, deck to camera.
    const hx = heroBoardX(aspect);
    const hoverY = heroBoardY(aspect) + Math.sin(t * 0.9) * 0.06;
    const land = journey.mode === "rise" ? 1 : smooth(0.06, 0.36, journey.dive);
    const k = 1 - land;

    g.position.set(MathUtils.lerp(px, hx, k), // sits a little high: the GPU surface also drifts sideways, which the CPU height ignores
      MathUtils.lerp(h0 + 0.03, hoverY, k), pz);
    // outer: lean in the screen plane; inner: stand up (x), spin (y), surface roll (z)
    g.rotation.z = MathUtils.lerp(0, -0.38 + Math.cos(t * 0.5) * 0.04, k);
    r.rotation.set(
      MathUtils.lerp(pitch, 1.2 + Math.sin(t * 0.7) * 0.04, k),
      MathUtils.lerp(yaw, 0.18 + Math.sin(t * 0.35) * 0.22, k),
      MathUtils.lerp(roll, 0, k),
      "YXZ",
    );
  });

  return (
    <group ref={outer}>
      <group ref={inner}>
        <primitive object={board} />
      </group>
    </group>
  );
}

useGLTF.preload(MODEL, false, true);
