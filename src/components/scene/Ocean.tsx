"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { DoubleSide, type Mesh, PlaneGeometry, ShaderMaterial } from "three";
import { atmo, FOG_GLSL } from "./atmosphere";
import { GERSTNER_GLSL } from "./waves";

const vertex = /* glsl */ `
  uniform float uTime;
  varying vec3 vWorld;
  varying vec3 vNormal;
  varying float vHeight;
  varying float vAtten;
  ${GERSTNER_GLSL}

  void main() {
    // Grid lives in [-1, 1]; a power curve packs vertices near the camera and stretches
    // them toward the horizon, so one static mesh covers 600 m without wasting triangles.
    vec2 g = position.xy;
    vec2 xz = sign(g) * pow(abs(g), vec2(2.6)) * 300.0;
    vec3 p = vec3(xz.x, 0.0, -xz.y); // -y keeps front faces pointing up

    float dist = length(xz);
    float att = 1.0 - smoothstep(40.0, 180.0, dist);
    vec3 n;
    vec3 displaced = gerstner(p, uTime, n);
    p = mix(p, displaced, att);
    vNormal = normalize(mix(vec3(0.0, 1.0, 0.0), n, att));
    vHeight = p.y;
    vAtten = att;
    vec4 w = modelMatrix * vec4(p, 1.0);
    vWorld = w.xyz;
    gl_Position = projectionMatrix * viewMatrix * w;
  }
`;

const fragment = /* glsl */ `
  uniform float uTime;
  uniform vec3 uSunDir;
  uniform vec3 uSunColor;
  uniform vec3 uZenith;
  uniform vec3 uHorizon;
  uniform vec3 uDeep;
  uniform vec3 uShallow;
  varying vec3 vWorld;
  varying vec3 vNormal;
  varying float vHeight;
  varying float vAtten;
  ${FOG_GLSL}

  vec3 ripple(vec2 p, float t) {
    // cheap small-scale detail normal from a few crossing sine trains
    float a = sin(dot(p, vec2(2.1, 1.3)) * 2.2 + t * 2.1);
    float b = sin(dot(p, vec2(-1.7, 2.4)) * 2.9 + t * 2.7);
    float c = sin(dot(p, vec2(3.3, -0.6)) * 3.7 - t * 3.1);
    vec2 d = vec2(2.1, 1.3) * a * 0.5 + vec2(-1.7, 2.4) * b * 0.4 + vec2(3.3, -0.6) * c * 0.3;
    return vec3(d.x, 0.0, d.y) * 0.035;
  }

  vec3 skyColor(vec3 d) {
    float up = pow(clamp(d.y, 0.0, 1.0), 0.45);
    vec3 col = mix(uHorizon, uZenith, up);
    float sd = max(dot(d, normalize(uSunDir)), 0.0);
    col += uSunColor * (pow(sd, 6.0) * 0.3 + pow(sd, 64.0) * 0.4);
    return col;
  }

  void main() {
    vec3 sun = normalize(uSunDir);
    vec3 toCam = cameraPosition - vWorld;
    float dist = length(toCam);
    vec3 V = toCam / dist;
    float detail = vAtten * (1.0 - smoothstep(8.0, 60.0, dist));
    vec3 N = normalize(vNormal + ripple(vWorld.xz, uTime) * detail);
    vec3 col;

    if (gl_FrontFacing) {
      float fres = 0.02 + 0.98 * pow(1.0 - max(dot(N, V), 0.0), 5.0);
      vec3 R = reflect(-V, N);
      R.y = abs(R.y);
      vec3 refl = skyColor(R);
      float crest = clamp(vHeight * 1.8 + 0.4, 0.0, 1.0);
      vec3 body = mix(uDeep, uShallow, crest * 0.75);
      // light passing through the thin top of each swell
      body += uShallow * pow(max(dot(V, -sun) * 0.5 + 0.5, 0.0), 3.0) * crest * 0.35;
      col = mix(body, refl, fres);
      float rs = max(dot(R, sun), 0.0);
      col += uSunColor * (pow(rs, 700.0) * 6.0 + pow(rs, 60.0) * 0.18);
      float foam = smoothstep(0.24, 0.36, vHeight) * (0.5 + 0.5 * sin(vWorld.x * 7.0 + vWorld.z * 5.0 + uTime));
      col = mix(col, vec3(0.9, 0.95, 0.95), foam * 0.25 * vAtten);
    } else {
      // Under the surface: Snell's window. Inside ~48 degrees of vertical you see the sky,
      // outside it the surface reflects the water below (total internal reflection).
      vec3 I = -V;
      // flatten the big swells underneath so the window wobbles instead of fracturing
      vec3 Nf = normalize(mix(vec3(0.0, 1.0, 0.0), N, 0.35));
      float c = dot(I, Nf);
      float win = smoothstep(0.3, 0.95, c);
      vec3 refr = refract(I, -Nf, 1.33);
      vec3 rd = dot(refr, refr) > 0.0 ? normalize(refr) : I;
      vec3 through = skyColor(normalize(rd + vec3(0.0, 0.05, 0.0))) * 1.15;
      through += uSunColor * pow(max(dot(rd, sun), 0.0), 24.0) * 2.0;
      vec3 tir = mix(uFogColor, uShallow, 0.3 + 0.25 * c);
      col = mix(tir, through, win);
    }

    col = applyFog(col, dist);
    gl_FragColor = vec4(col, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

export function Ocean({ segments }: { segments: number }) {
  const geometry = useMemo(() => new PlaneGeometry(2, 2, segments, segments), [segments]);
  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: vertex,
        fragmentShader: fragment,
        uniforms: {
          uTime: atmo.uTime,
          uSunDir: atmo.uSunDir,
          uSunColor: atmo.uSunColor,
          uZenith: atmo.uZenith,
          uHorizon: atmo.uHorizon,
          uDeep: atmo.uDeep,
          uShallow: atmo.uShallow,
          uFogColor: atmo.uFogColor,
          uFogDensity: atmo.uFogDensity,
        },
        side: DoubleSide,
      }),
    [],
  );

  const mesh = useRef<Mesh>(null);
  // From below, the surface must not hide the floating board (it sits in the surface,
  // not under it). Underwater the water stops writing depth and draws before the board.
  useFrame(() => {
    const m = mesh.current;
    if (m) (m.material as ShaderMaterial).depthWrite = atmo.uUnder.value < 0.5;
  });

  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => () => material.dispose(), [material]);

  return <mesh ref={mesh} geometry={geometry} material={material} renderOrder={0} frustumCulled={false} />;
}
