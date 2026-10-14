"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { BackSide, type Mesh, ShaderMaterial } from "three";
import { atmo } from "./atmosphere";

const vertex = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = normalize((modelMatrix * vec4(position, 0.0)).xyz);
    vec4 p = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
    gl_Position = p.xyww; // pin to far plane
  }
`;

const fragment = /* glsl */ `
  uniform vec3 uZenith;
  uniform vec3 uHorizon;
  uniform vec3 uSunColor;
  uniform vec3 uSunDir;
  uniform vec3 uFogColor;
  uniform float uUnder;
  varying vec3 vDir;

  void main() {
    vec3 d = normalize(vDir);
    float h = d.y;
    float up = pow(clamp(h, 0.0, 1.0), 0.45);
    vec3 col = mix(uHorizon, uZenith, up);

    float sd = max(dot(d, normalize(uSunDir)), 0.0);
    // wide warm glow hugging the horizon around the sun, then a tight halo and disc
    float band = exp(-abs(h) * 9.0);
    col += uSunColor * (pow(sd, 6.0) * 0.35 * band + pow(sd, 64.0) * 0.45);
    col += uSunColor * (pow(sd, 220.0) * 0.55 + pow(sd, 1400.0) * 0.8); // warm bloom
    col += vec3(1.0, 0.66, 0.34) * smoothstep(0.99972, 0.99985, sd) * 1.1;

    // below the horizon fade into fog so the water's far edge disappears
    col = mix(col, uFogColor, smoothstep(0.02, -0.06, h));
    col = mix(col, uFogColor, uUnder);
    gl_FragColor = vec4(col, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

export function SkyDome() {
  const ref = useRef<Mesh>(null);
  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: vertex,
        fragmentShader: fragment,
        uniforms: {
          uZenith: atmo.uZenith,
          uHorizon: atmo.uHorizon,
          uSunColor: atmo.uSunColor,
          uSunDir: atmo.uSunDir,
          uFogColor: atmo.uFogColor,
          uUnder: atmo.uUnder,
        },
        side: BackSide,
        depthWrite: false,
      }),
    [],
  );

  useFrame(({ camera }) => {
    ref.current?.position.copy(camera.position);
  });

  return (
    <mesh ref={ref} material={material} renderOrder={-1} frustumCulled={false}>
      <sphereGeometry args={[500, 32, 16]} />
    </mesh>
  );
}
