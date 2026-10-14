"use client";

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Color, type DirectionalLight, type FogExp2, type HemisphereLight, MathUtils, PerspectiveCamera, Vector3 } from "three";
import { journey } from "@/lib/journey";
import { applyPalette, atmo, UNDER_DEEP, UNDER_SHALLOW, UNDER_SUNSET } from "./atmosphere";
import { divePath, risePath } from "./poses";
import { waveHeight } from "./waves";

const targetPos = new Vector3();
const targetLook = new Vector3();
const look = new Vector3();
const underColor = new Color();

/**
 * Reads scroll progress from the journey store every frame, moves the camera along the
 * active path (damped, so wheel steps never jerk) and drives sky, fog and light.
 */
export function CameraRig() {
  const sun = useRef<DirectionalLight>(null);
  const hemi = useRef<HemisphereLight>(null);
  const fog = useRef<FogExp2>(null);
  const size = useThree((s) => s.size);
  const aspect = size.width / size.height;
  const paths = useMemo(() => ({ dive: divePath(aspect), rise: risePath(aspect) }), [aspect]);
  const lastMode = useRef<string | null>(null);

  useFrame(({ camera, clock }, delta) => {
    const t = clock.elapsedTime;
    atmo.uTime.value = t;
    const cam = camera as PerspectiveCamera;

    const tall = aspect < 0.9;
    const fov = tall ? 58 : 40;
    if (cam.fov !== fov) {
      cam.fov = fov;
      cam.updateProjectionMatrix();
    }

    const rising = journey.mode === "rise";
    const path = rising ? paths.rise : paths.dive;
    const progress = rising ? journey.rise : journey.dive;
    path.sample(progress, targetPos, targetLook);

    // a little pointer parallax, only while we're up in the hero
    const heroWeight = rising ? 0 : 1 - MathUtils.clamp(progress / 0.2, 0, 1);
    targetPos.x += journey.pointer.x * 0.35 * heroWeight;
    targetPos.y += journey.pointer.y * 0.18 * heroWeight;

    // Snap on mode switches (they happen while the canvas is hidden) and on first frame.
    if (lastMode.current !== journey.mode) {
      lastMode.current = journey.mode;
      cam.position.copy(targetPos);
      look.copy(targetLook);
    } else {
      const d = Math.min(delta, 1 / 20);
      cam.position.x = MathUtils.damp(cam.position.x, targetPos.x, 5, d);
      cam.position.y = MathUtils.damp(cam.position.y, targetPos.y, 5, d);
      cam.position.z = MathUtils.damp(cam.position.z, targetPos.z, 5, d);
      look.x = MathUtils.damp(look.x, targetLook.x, 5, d);
      look.y = MathUtils.damp(look.y, targetLook.y, 5, d);
      look.z = MathUtils.damp(look.z, targetLook.z, 5, d);
    }
    cam.lookAt(look);

    // Above or below the surface? Blend across a thin band so the crossing isn't a pop.
    const surface = waveHeight(cam.position.x, cam.position.z, t);
    const rel = cam.position.y - surface;
    const under = MathUtils.clamp(0.5 - rel / 0.16, 0, 1);
    atmo.uUnder.value = under;

    const aboveFog = applyPalette(rising ? 1 : 0);
    const depth = MathUtils.clamp(-cam.position.y / 6, 0, 1);
    underColor.copy(rising ? UNDER_SUNSET : UNDER_SHALLOW).lerp(UNDER_DEEP, depth * (rising ? 0.6 : 1));
    atmo.uFogColor.value.copy(atmo.uHorizon.value).lerp(underColor, under);
    atmo.uFogDensity.value = MathUtils.lerp(aboveFog, 0.085 + depth * 0.09, under);

    const f = fog.current;
    if (f) {
      f.color.copy(atmo.uFogColor.value);
      f.density = atmo.uFogDensity.value;
    }

    const s = sun.current;
    if (s) {
      s.position.copy(atmo.uSunDir.value).multiplyScalar(30);
      s.color.copy(atmo.uSunColor.value);
      s.intensity = MathUtils.lerp(rising ? 2.2 : 2.8, 0.9, under);
    }
    const h = hemi.current;
    if (h) {
      h.color.copy(atmo.uZenith.value).lerp(atmo.uFogColor.value, under);
      h.groundColor.copy(atmo.uDeep.value);
      h.intensity = MathUtils.lerp(1.1, 0.7, under);
    }
  });

  return (
    <>
      <fogExp2 ref={fog} attach="fog" args={[0x000000, 0.01]} />
      <hemisphereLight ref={hemi} />
      <directionalLight ref={sun} />
    </>
  );
}
