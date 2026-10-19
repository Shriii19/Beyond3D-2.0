import { useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import { getLenis, motionState } from '../lib/motionState.js';
import { simplexNoise } from '../lib/noise.js';
import Galaxy, { seeded } from './Galaxy.jsx';

// One persistent scene sits behind the whole page: the galaxy fills the hero,
// then recedes behind a different planet on each of the other slides.

const { damp, clamp } = THREE.MathUtils;
const isNarrow = () => window.innerWidth < 768;

const starVertex = /* glsl */ `
  uniform float uTime;
  uniform float uTravel;
  uniform float uStretch;
  attribute float aTail;
  varying float vAlpha;
  void main() {
    vec3 p = position;
    p.z = mod(p.z + uTravel + uTime * 0.35, 40.0) - 32.0;
    p.z -= aTail * uStretch;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    vAlpha = (1.0 - aTail) * smoothstep(-32.0, -18.0, p.z) * smoothstep(0.0, 3.0, -mv.z);
  }
`;

const starFragment = /* glsl */ `
  uniform float uOpacity;
  varying float vAlpha;
  void main() { gl_FragColor = vec4(0.55, 0.72, 1.0, vAlpha * uOpacity); }
`;

// Star streaks: still points at rest, warp-speed lines when scrolling fast or diving.
function WarpStars({ count }) {
  const material = useRef();
  const geometry = useMemo(() => {
    const positions = new Float32Array(count * 6);
    const tails = new Float32Array(count * 2);
    const rand = seeded(7);
    for (let i = 0; i < count; i += 1) {
      const x = (rand() - 0.5) * 30;
      const y = (rand() - 0.5) * 18;
      const z = rand() * 40;
      positions.set([x, y, z, x, y, z], i * 6);
      tails[i * 2 + 1] = 1;
    }
    const buffer = new THREE.BufferGeometry();
    buffer.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    buffer.setAttribute('aTail', new THREE.BufferAttribute(tails, 1));
    return buffer;
  }, [count]);
  const uniforms = useMemo(() => ({
    uTime: { value: 0 }, uTravel: { value: 0 }, uStretch: { value: 0.05 }, uOpacity: { value: 0.4 },
  }), []);

  useFrame((state, delta) => {
    const u = material.current?.uniforms;
    if (!u) return;
    const dt = Math.min(delta, 0.05);
    const velocity = Math.min(Math.abs(getLenis()?.velocity ?? 0), 80);
    const diving = motionState.dive * (1 - clamp(motionState.morph, 0, 1));
    u.uTime.value += dt;
    u.uTravel.value = damp(u.uTravel.value, motionState.progress * 90 + motionState.dive * 18, 3, dt);
    u.uStretch.value = damp(u.uStretch.value, 0.05 + velocity * 0.06 + diving * 4.5, 5, dt);
  });

  return (
    <lineSegments geometry={geometry} frustumCulled={false}>
      <shaderMaterial
        ref={material}
        uniforms={uniforms}
        vertexShader={starVertex}
        fragmentShader={starFragment}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </lineSegments>
  );
}

const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

// Starts above the galaxy looking down as it forms, sweeps down to an angled
// hero view, drifts slowly, and pulls back when the pager leaves the hero.
function CameraRig() {
  const { camera, size } = useThree();
  const look = useRef(new THREE.Vector3(0, -0.3, -2));
  const target = useMemo(() => ({ pos: new THREE.Vector3(), look: new THREE.Vector3(), a: new THREE.Vector3() }), []);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const t = state.clock.elapsedTime;
    const wide = size.width / size.height > 1;
    const intro = ease(clamp(motionState.intro * 1.15, 0, 1));

    if (motionState.planet < 0) {
      target.a.set(Math.sin(t * 0.07) * 0.9, (wide ? 3.2 : 4) + Math.sin(t * 0.05) * 0.3, wide ? 12.5 : 17);
      target.pos.set(0, 11, -1.2).lerp(target.a, intro);
      target.look.set(0, -0.3, -2).lerp(target.a.set(0, -0.6, -2), intro);
    } else {
      target.pos.set((motionState.progress - 0.5) * 1.2, 0.9, wide ? 9.2 : 12);
      target.look.set(0, -0.4, -1.5);
    }
    target.pos.x += motionState.pointer.x * 0.35;
    target.pos.y -= motionState.pointer.y * 0.25;

    const k = 1 - Math.exp(-(motionState.intro < 1 ? 6 : 2.2) * dt);
    camera.position.lerp(target.pos, k);
    look.current.lerp(target.look, k);
    camera.lookAt(look.current);
  });
  return null;
}

function Effects() {
  const bloom = useRef();

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    if (bloom.current) bloom.current.intensity = damp(bloom.current.intensity, motionState.planet < 0 ? 1.15 : 0.8, 3, dt);
  });

  return (
    <EffectComposer multisampling={0} disableNormalPass>
      <Bloom ref={bloom} intensity={0.8} luminanceThreshold={0.2} luminanceSmoothing={0.35} radius={0.6} levels={4} />
      <Vignette offset={0.28} darkness={0.78} />
    </EffectComposer>
  );
}

const planetVertex = /* glsl */ `
  varying vec3 vObj;
  varying vec3 vNormalV;
  varying vec3 vViewPos;
  void main() {
    vObj = normalize(position);
    vNormalV = normalize(normalMatrix * normal);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vViewPos = mv.xyz;
    gl_Position = projectionMatrix * mv;
  }
`;

const planetFragment = /* glsl */ `
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform vec3 uAtmos;
  uniform float uBandFreq;
  uniform float uWarp;
  uniform float uNoiseScale;
  varying vec3 vObj;
  varying vec3 vNormalV;
  varying vec3 vViewPos;
  ${simplexNoise}
  void main() {
    vec3 p = vObj;
    float n = snoise(p * uNoiseScale) * 0.6 + snoise(p * uNoiseScale * 2.3) * 0.3;
    float bands = sin(p.y * uBandFreq + n * uWarp) * 0.5 + 0.5;
    float t = clamp(mix(0.5 + n * 0.9, bands, step(0.5, uBandFreq) * 0.8), 0.0, 1.0);
    vec3 albedo = mix(uColorA, uColorB, smoothstep(0.1, 0.9, t));
    vec3 N = normalize(vNormalV);
    vec3 L = normalize(vec3(-0.55, 0.45, 0.7));
    float diff = max(dot(N, L), 0.0);
    vec3 V = normalize(-vViewPos);
    float rim = pow(1.0 - max(dot(N, V), 0.0), 3.0);
    vec3 col = albedo * (0.05 + diff * 0.8) + uAtmos * rim * (0.2 + diff * 0.7);
    gl_FragColor = vec4(col, 1.0);
  }
`;

const ringVertex = /* glsl */ `
  varying float vR;
  void main() {
    vR = length(position.xy);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const ringFragment = /* glsl */ `
  uniform vec3 uRingColor;
  uniform float uInner;
  uniform float uOuter;
  varying float vR;
  void main() {
    float r = (vR - uInner) / (uOuter - uInner);
    float bands = 0.55 + 0.35 * sin(r * 46.0) + 0.1 * sin(r * 130.0);
    float edge = smoothstep(0.0, 0.08, r) * smoothstep(1.0, 0.85, r);
    gl_FragColor = vec4(uRingColor * (0.6 + bands * 0.6), edge * bands * 0.45);
  }
`;

// One look per section: work, about, capabilities, contact.
const WORLDS = [
  { a: '#0a1a44', b: '#4b83ff', atmos: '#9bdeff', ring: '#bfe6ff', bands: 7, warp: 2.2, noise: 1.2, hasRing: true, tilt: 0.45, scale: 1, pos: [3.1, 0.5] },
  { a: '#0b0f1a', b: '#5c6f94', atmos: '#8aa4d6', ring: '#aab8d4', bands: 0, warp: 0, noise: 2.2, hasRing: false, tilt: 0.1, scale: 1.12, pos: [-2.6, 1.5] },
  { a: '#07203a', b: '#9bdeff', atmos: '#9bdeff', ring: '#d8f2ff', bands: 3, warp: 3.5, noise: 1.6, hasRing: true, tilt: -0.7, scale: 0.85, pos: [3.4, 1.7] },
  { a: '#10163a', b: '#6674bd', atmos: '#4b83ff', ring: '#c7d6ff', bands: 9, warp: 1.6, noise: 1.0, hasRing: true, tilt: 0.95, scale: 1.2, pos: [-3.6, -1.3] },
];

function Planet() {
  const group = useRef();
  const body = useRef();
  const ringGroup = useRef();
  const { size } = useThree();
  const state = useRef({ shown: -1, scale: 0 });
  const uniforms = useMemo(() => ({
    uColorA: { value: new THREE.Color() },
    uColorB: { value: new THREE.Color() },
    uAtmos: { value: new THREE.Color() },
    uBandFreq: { value: 0 },
    uWarp: { value: 0 },
    uNoiseScale: { value: 1 },
  }), []);
  const ringUniforms = useMemo(() => ({
    uRingColor: { value: new THREE.Color() },
    uInner: { value: 1.4 },
    uOuter: { value: 2.3 },
  }), []);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const s = state.current;
    const want = motionState.planet;
    // Shrink away, swap the world while it is invisible, then grow back in.
    if (s.shown !== want) {
      s.scale = damp(s.scale, 0, 7, dt);
      if (s.scale < 0.03) {
        s.shown = want;
        if (want >= 0) {
          const w = WORLDS[want];
          uniforms.uColorA.value.set(w.a);
          uniforms.uColorB.value.set(w.b);
          uniforms.uAtmos.value.set(w.atmos);
          uniforms.uBandFreq.value = w.bands;
          uniforms.uWarp.value = w.warp;
          uniforms.uNoiseScale.value = w.noise;
          ringUniforms.uRingColor.value.set(w.ring);
          ringGroup.current.visible = w.hasRing;
          ringGroup.current.rotation.set(Math.PI / 2 + w.tilt * 0.5, 0, w.tilt);
        }
      }
    } else if (s.shown >= 0) {
      s.scale = damp(s.scale, WORLDS[s.shown].scale, 3.5, dt);
    }
    const wide = size.width / size.height > 1;
    const pos = WORLDS[Math.max(s.shown, 0)].pos;
    group.current.visible = s.scale > 0.01;
    group.current.scale.setScalar(Math.max(s.scale, 0.0001));
    group.current.position.set(wide ? pos[0] : 0, wide ? pos[1] : -1.6, wide ? -1 : -2.5);
    body.current.rotation.y += dt * 0.12;
    group.current.rotation.set(motionState.dragY, motionState.dragX, 0);
  });

  return (
    <group ref={group}>
      <mesh ref={body}>
        <sphereGeometry args={[1.05, 64, 48]} />
        <shaderMaterial uniforms={uniforms} vertexShader={planetVertex} fragmentShader={planetFragment} />
      </mesh>
      <group ref={ringGroup}>
        <mesh>
          <ringGeometry args={[1.4, 2.3, 128]} />
          <shaderMaterial uniforms={ringUniforms} vertexShader={ringVertex} fragmentShader={ringFragment} transparent depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
      </group>
    </group>
  );
}

export default function Experience() {
  const narrow = useMemo(isNarrow, []);
  return (
    <div className="webgl-stage" aria-hidden="true">
      <Canvas
        dpr={[1, 1.25]}
        camera={{ position: [0, 11, -1.2], fov: 45, near: 0.05, far: 120 }}
        gl={{ antialias: false, alpha: false, powerPreference: 'high-performance' }}
        fallback={<div className="scene-fallback" />}
      >
        <color attach="background" args={['#07090d']} />
        <CameraRig />
        <Galaxy count={narrow ? 9000 : 24000} nebulaCount={narrow ? 130 : 280} />
        <Planet />
        <WarpStars count={narrow ? 400 : 900} />
        <Effects />
      </Canvas>
    </div>
  );
}
