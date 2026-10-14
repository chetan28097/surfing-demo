"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  DoubleSide,
  type Group,
  InstancedBufferAttribute,
  InstancedMesh,
  Object3D,
  PlaneGeometry,
  type Points,
  ShaderMaterial,
} from "three";
import { atmo, FOG_GLSL } from "./atmosphere";

/* ------------------------------ light shafts ------------------------------ */

const rayVertex = /* glsl */ `
  attribute float aSeed;
  varying vec2 vUv;
  varying float vSeed;
  varying vec3 vWorld;
  varying vec3 vNormalW;
  void main() {
    vUv = uv;
    vSeed = aSeed;
    vec4 w = modelMatrix * instanceMatrix * vec4(position, 1.0);
    vWorld = w.xyz;
    vNormalW = normalize(mat3(modelMatrix * instanceMatrix) * vec3(0.0, 0.0, 1.0));
    gl_Position = projectionMatrix * viewMatrix * w;
  }
`;

const rayFragment = /* glsl */ `
  uniform float uTime;
  uniform float uUnder;
  uniform vec3 uSunColor;
  varying vec2 vUv;
  varying float vSeed;
  varying vec3 vWorld;
  varying vec3 vNormalW;
  ${FOG_GLSL}
  void main() {
    // quads seen edge-on show hard lines; fade them by facing ratio
    float facing = abs(dot(normalize(vNormalW), normalize(cameraPosition - vWorld)));
    float along = vUv.y;                       // 1 at the surface, 0 at the bottom
    float edge = pow(sin(3.14159 * vUv.x), 2.0);
    float flicker = 0.55 + 0.45 * sin(uTime * (0.6 + vSeed) + vSeed * 40.0);
    float a = pow(along, 2.2) * smoothstep(1.0, 0.82, along) * edge * flicker * uUnder * smoothstep(0.15, 0.7, facing);
    float d = length(cameraPosition - vWorld);
    a *= smoothstep(0.5, 3.0, d) * (1.0 - smoothstep(8.0, 26.0, d));
    vec3 col = mix(uSunColor, vec3(0.7, 1.0, 0.95), 0.55);
    gl_FragColor = vec4(col * a * 0.16, 1.0);
  }
`;

function LightShafts({ count }: { count: number }) {
  const group = useRef<Group>(null);
  const { mesh, geometry, material } = useMemo(() => {
    const geometry = new PlaneGeometry(1, 1, 1, 1);
    geometry.translate(0, -0.5, 0); // top edge at the origin, hanging down
    const seeds = new Float32Array(count * 2);
    for (let i = 0; i < count * 2; i++) seeds[i] = (i * 0.61803) % 1;
    geometry.setAttribute("aSeed", new InstancedBufferAttribute(seeds, 1));
    const material = new ShaderMaterial({
      vertexShader: rayVertex,
      fragmentShader: rayFragment,
      uniforms: {
        uTime: atmo.uTime,
        uUnder: atmo.uUnder,
        uSunColor: atmo.uSunColor,
        uFogColor: atmo.uFogColor,
        uFogDensity: atmo.uFogDensity,
      },
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      side: DoubleSide,
    });
    // Each shaft is two crossed quads so it reads as a volume from any angle.
    const mesh = new InstancedMesh(geometry, material, count * 2);
    const o = new Object3D();
    for (let i = 0; i < count; i++) {
      const r = (k: number) => ((Math.sin(i * 12.9898 + k * 78.233) * 43758.5453) % 1 + 1) % 1;
      const x = (r(1) - 0.5) * 14;
      const z = (r(2) - 0.5) * 12 - 1.5;
      const width = 0.35 + r(3) * 1.4;
      const length = 9 + r(4) * 8;
      for (let k = 0; k < 2; k++) {
        o.position.set(x, 0.05, z);
        o.rotation.set(0.18, k * Math.PI * 0.5 + r(5) * 0.6, 0.12, "YXZ");
        o.scale.set(width, length, 1);
        o.updateMatrix();
        mesh.setMatrixAt(i * 2 + k, o.matrix);
      }
    }
    mesh.frustumCulled = false;
    return { mesh, geometry, material };
  }, [count]);

  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
      mesh.dispose();
    },
    [geometry, material, mesh],
  );

  useFrame(({ clock }) => {
    const g = group.current;
    if (!g) return;
    g.visible = atmo.uUnder.value > 0.01;
    g.rotation.z = Math.sin(clock.elapsedTime * 0.15) * 0.05;
    g.rotation.x = Math.cos(clock.elapsedTime * 0.11) * 0.04;
  });

  return (
    <group ref={group}>
      <primitive object={mesh} />
    </group>
  );
}

/* -------------------------------- particles -------------------------------- */

const particleVertex = /* glsl */ `
  uniform float uTime;
  uniform float uPixelRatio;
  attribute float aSeed;
  varying float vAlpha;
  varying float vDist;
  void main() {
    vec3 p = position;
    // slow rise with wrap-around inside a 12 m tall column, plus a lazy sway
    p.y = mod(p.y + uTime * (0.08 + aSeed * 0.12) + 12.0, 12.0) - 12.3;
    p.x += sin(uTime * 0.4 + aSeed * 30.0) * 0.25;
    p.z += cos(uTime * 0.3 + aSeed * 20.0) * 0.25;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    vDist = -mv.z;
    gl_PointSize = (8.0 + aSeed * 22.0) * uPixelRatio / max(vDist, 0.5);
    vAlpha = 0.35 + aSeed * 0.5;
  }
`;

const particleFragment = /* glsl */ `
  uniform float uUnder;
  varying float vAlpha;
  varying float vDist;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.0, d) * vAlpha * uUnder;
    a *= 1.0 - smoothstep(4.0, 14.0, vDist);
    gl_FragColor = vec4(vec3(0.82, 1.0, 0.96) * a, 1.0);
  }
`;

function Particles({ count }: { count: number }) {
  const points = useRef<Points>(null);
  const { geometry, material } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const seed = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const r = (k: number) => ((Math.sin(i * 91.7 + k * 47.3) * 24634.6345) % 1 + 1) % 1;
      pos[i * 3] = (r(1) - 0.5) * 16;
      pos[i * 3 + 1] = r(2) * 12;
      pos[i * 3 + 2] = (r(3) - 0.5) * 14;
      seed[i] = r(4);
    }
    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new BufferAttribute(pos, 3));
    geometry.setAttribute("aSeed", new BufferAttribute(seed, 1));
    const material = new ShaderMaterial({
      vertexShader: particleVertex,
      fragmentShader: particleFragment,
      uniforms: {
        uTime: atmo.uTime,
        uUnder: atmo.uUnder,
        uPixelRatio: { value: 1 },
      },
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
    });
    return { geometry, material };
  }, [count]);

  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material],
  );

  useFrame(({ gl }) => {
    const p = points.current;
    if (!p) return;
    (p.material as ShaderMaterial).uniforms.uPixelRatio.value = gl.getPixelRatio();
    p.visible = atmo.uUnder.value > 0.01;
  });

  return <points ref={points} geometry={geometry} material={material} frustumCulled={false} />;
}

/* --------------------------------- seafloor -------------------------------- */

const floorVertex = /* glsl */ `
  varying vec3 vWorld;
  void main() {
    vec4 w = modelMatrix * vec4(position, 1.0);
    vWorld = w.xyz;
    gl_Position = projectionMatrix * viewMatrix * w;
  }
`;

const floorFragment = /* glsl */ `
  uniform float uTime;
  uniform vec3 uSunColor;
  varying vec3 vWorld;
  ${FOG_GLSL}
  // Classic iterative caustic pattern (after joltz0r's "water turbulence").
  float caustic(vec2 uv, float t) {
    vec2 p = mod(uv * 6.28318, 6.28318) - 250.0;
    vec2 i = p;
    float c = 1.0;
    float inten = 0.005;
    for (int n = 0; n < 4; n++) {
      float tt = t * (1.0 - (3.5 / float(n + 1)));
      i = p + vec2(cos(tt - i.x) + sin(tt + i.y), sin(tt - i.y) + cos(tt + i.x));
      c += 1.0 / length(vec2(p.x / (sin(i.x + tt) / inten), p.y / (cos(i.y + tt) / inten)));
    }
    c /= 4.0;
    c = 1.17 - pow(c, 1.4);
    return pow(abs(c), 8.0);
  }
  void main() {
    vec2 uv = vWorld.xz * 0.11;
    float c = caustic(uv, uTime * 0.35);
    vec3 sand = vec3(0.32, 0.47, 0.44);
    vec3 col = sand + uSunColor * c * 0.55;
    col = applyFog(col, length(cameraPosition - vWorld));
    gl_FragColor = vec4(col, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

function Seafloor() {
  const ref = useRef<Object3D>(null);
  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: floorVertex,
        fragmentShader: floorFragment,
        uniforms: {
          uTime: atmo.uTime,
          uSunColor: atmo.uSunColor,
          uFogColor: atmo.uFogColor,
          uFogDensity: atmo.uFogDensity,
        },
      }),
    [],
  );
  useEffect(() => () => material.dispose(), [material]);
  useFrame(() => {
    if (ref.current) ref.current.visible = atmo.uUnder.value > 0.01;
  });
  return (
    <mesh ref={ref} material={material} rotation-x={-Math.PI / 2} position-y={-9}>
      <planeGeometry args={[90, 90, 1, 1]} />
    </mesh>
  );
}

export function Underwater({ quality }: { quality: "low" | "high" }) {
  return (
    <>
      <LightShafts count={quality === "high" ? 16 : 9} />
      <Particles count={quality === "high" ? 700 : 260} />
      <Seafloor />
    </>
  );
}
