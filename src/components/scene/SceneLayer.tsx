"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useState } from "react";
import { useSceneTier } from "./SceneTier";

const SceneCanvas = dynamic(() => import("./SceneCanvas"), { ssr: false, loading: () => null });

/**
 * Fixed layer behind the page. Runs the WebGL ocean when the device can take it,
 * otherwise shows a still photograph so the hero and dive keep their mood.
 */
export function SceneLayer() {
  const { tier, downgrade } = useSceneTier();
  const [ready, setReady] = useState(false);

  return (
    <div className="scene-layer" aria-hidden="true">
      {/* Painted before anything loads: morning sky over open water. */}
      <div className="scene-layer__base" />

      {tier === "none" && (
        <div className="scene-layer__fallback">
          <Image src="/images/halfunder.jpg" alt="" fill sizes="100vw" className="object-cover" preload />
        </div>
      )}

      {tier && tier !== "none" && (
        <div className="scene-layer__canvas" data-ready={ready}>
          <SceneCanvas quality={tier} onReady={() => setReady(true)} onContextLost={downgrade} />
        </div>
      )}
    </div>
  );
}
