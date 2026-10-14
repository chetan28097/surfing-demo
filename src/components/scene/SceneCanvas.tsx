"use client";

import { Suspense, useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import { ACESFilmicToneMapping } from "three";
import { canvasVisibility } from "@/lib/journey";
import { CameraRig } from "./CameraRig";
import { Ocean } from "./Ocean";
import { SkyDome } from "./SkyDome";
import { Surfboard } from "./Surfboard";
import { Underwater } from "./Underwater";

type Props = {
  quality: "low" | "high";
  onReady: () => void;
  onContextLost: () => void;
};

function Experience({ quality }: { quality: "low" | "high" }) {
  return (
    <>
      {/* Reflections for the board's clearcoat, generated locally once (no HDR download). */}
      <Environment resolution={64} frames={1}>
        <Lightformer form="rect" intensity={2.2} color="#dff3f5" position={[0, 6, -4]} scale={[14, 4, 1]} />
        <Lightformer form="rect" intensity={0.8} color="#3cc7c1" position={[-6, 1, 2]} rotation-y={Math.PI / 2} scale={[10, 3, 1]} />
        <Lightformer form="rect" intensity={1.0} color="#f2994a" position={[6, 1, -2]} rotation-y={-Math.PI / 2} scale={[8, 2, 1]} />
      </Environment>
      <SkyDome />
      <Ocean segments={quality === "high" ? 256 : 150} />
      <Underwater quality={quality} />
      <Suspense fallback={null}>
        <Surfboard />
      </Suspense>
      <CameraRig />
    </>
  );
}

/** The WebGL layer. Loaded with next/dynamic (ssr: false) by SceneLayer. */
export default function SceneCanvas({ quality, onReady, onContextLost }: Props) {
  const [active, setActive] = useState(canvasVisibility.get());

  // Stop rendering entirely while the page backdrop covers the canvas.
  useEffect(() => canvasVisibility.subscribe(setActive), []);

  return (
    <Canvas
      frameloop={active ? "always" : "never"}
      dpr={quality === "high" ? [1, 1.75] : [1, 1.25]}
      gl={{
        antialias: quality === "high",
        powerPreference: "high-performance",
        alpha: false,
        stencil: false,
        toneMapping: ACESFilmicToneMapping,
        toneMappingExposure: 1.0,
      }}
      camera={{ fov: 40, near: 0.05, far: 1200, position: [0, 1.75, 6.4] }}
      onCreated={({ gl }) => {
        gl.domElement.addEventListener("webglcontextlost", (e) => {
          e.preventDefault();
          onContextLost();
        });
        // first committed frame → let the layer fade in
        requestAnimationFrame(() => requestAnimationFrame(onReady));
      }}
      aria-hidden
      tabIndex={-1}
    >
      <Experience quality={quality} />
    </Canvas>
  );
}
