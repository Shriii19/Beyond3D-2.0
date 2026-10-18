import { useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Bloom, ChromaticAberration, EffectComposer, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import { getLenis, motionState, prefersReducedMotion } from '../lib/motionState.js';
import { simplexNoise } from '../lib/noise.js';

// One persistent scene sits behind the whole page. A single particle cloud
// morphs between five procedural forms — one per section — while the camera
// dives, pans and pulls back with the scroll.

const { damp, clamp, smoothstep } = THREE.MathUtils;
const isNarrow = () => window.innerWidth < 768;

// Seeded PRNG so the galaxy is identical on every load.
function seeded(seed) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildShapes(count) {
  const torus = new Float32Array(count * 3);
  const wave = new Float32Array(count * 3);
  const sphere = new Float32Array(count * 3);
  const helix = new Float32Array(count * 3);
  const galaxy = new Float32Array(count * 3);
  const random = new Float32Array(count * 4);
  const colors = new Float32Array(count * 3);
  const palette = ['#1f5eff', '#8feaff', '#6674bd', '#4b83ff', '#c7d6ff'].map((c) => new THREE.Color(c));
  const r = seeded(20260);

  for (let i = 0; i < count; i += 1) {
    const i3 = i * 3;

    // 0 — hero torus
    const theta = r() * Math.PI * 2;
    const phi = r() * Math.PI * 2;
    const minor = 0.38 + r() * 0.6;
    const radius = 2.02 + (r() - 0.5) * 0.34 + Math.cos(phi) * minor;
    torus[i3] = Math.cos(theta) * radius;
    torus[i3 + 1] = Math.sin(phi) * minor * 0.88 + (r() - 0.5) * 0.28;
    torus[i3 + 2] = Math.sin(theta) * radius;

    // 1 — flowing wave field under the work rail
    wave[i3] = (r() - 0.5) * 26;
    wave[i3 + 1] = -2.1 + (r() - 0.5) * 0.08;
    wave[i3 + 2] = -10 + r() * 13;

    // 2 — planet with a tilted ring
    if (r() < 0.8) {
      const u = r() * 2 - 1;
      const a = r() * Math.PI * 2;
      const s = Math.sqrt(1 - u * u);
      const rr = 2.05 + (r() - 0.5) * 0.12;
      sphere[i3] = rr * s * Math.cos(a);
      sphere[i3 + 1] = rr * u;
      sphere[i3 + 2] = rr * s * Math.sin(a);
    } else {
      const a = r() * Math.PI * 2;
      const rr = 2.9 + Math.pow(r(), 1.5) * 0.9;
      const y = (r() - 0.5) * 0.04;
      const z = Math.sin(a) * rr;
      sphere[i3] = Math.cos(a) * rr;
      sphere[i3 + 1] = y * Math.cos(0.42) - z * Math.sin(0.42);
      sphere[i3 + 2] = y * Math.sin(0.42) + z * Math.cos(0.42);
    }

    // 3 — double helix with rungs
    const strand = r();
    let t = r();
    let angle = t * Math.PI * 9;
    let reach = 1.05;
    if (strand > 0.86) {
      t = Math.round(t * 46) / 46;
      angle = t * Math.PI * 9;
      reach *= r() * 2 - 1;
    } else if (strand > 0.43) {
      angle += Math.PI;
    }
    helix[i3] = (t - 0.5) * 17 + (r() - 0.5) * 0.06;
    helix[i3 + 1] = Math.cos(angle) * reach + (r() - 0.5) * 0.09;
    helix[i3 + 2] = Math.sin(angle) * reach + (r() - 0.5) * 0.09;

    // 4 — three-armed spiral galaxy
    const gr = Math.pow(r(), 1.5) * 6.2;
    const arm = ((i % 3) / 3) * Math.PI * 2 + gr * 0.85;
    const spread = 0.3 + gr * 0.22;
    const jitter = () => Math.pow(r(), 2.6) * (r() < 0.5 ? 1 : -1) * spread;
    galaxy[i3] = Math.cos(arm) * gr + jitter();
    galaxy[i3 + 1] = jitter() * 0.35;
    galaxy[i3 + 2] = Math.sin(arm) * gr + jitter();

    random[i * 4] = r();
    random[i * 4 + 1] = r();
    random[i * 4 + 2] = 0.5 + r() * r() * 1.6;
    random[i * 4 + 3] = r();

    const mix = r();
    const color = palette[mix > 0.72 ? 1 : mix > 0.45 ? 0 : mix > 0.25 ? 3 : mix > 0.08 ? 2 : 4];
    colors[i3] = color.r;
    colors[i3 + 1] = color.g;
    colors[i3 + 2] = color.b;
  }
  return { torus, wave, sphere, helix, galaxy, random, colors };
}

const particleVertex = /* glsl */ `
  uniform float uTime;
  uniform float uMorph;
  uniform float uSize;
  uniform float uVelocity;
  uniform float uRail;
  uniform float uMouseStrength;
  uniform vec3 uMouse;
  uniform vec2 uTilt;
  uniform vec3 uSphereC;
  uniform vec3 uHelixC;
  uniform float uHelixRot;
  uniform vec3 uGalaxyC;
  uniform vec3 uPlanetTint;
  uniform float uPlanetScale;
  uniform float uRingAmount;
  uniform float uRingTilt;
  uniform float uBands;

  attribute vec3 aWave;
  attribute vec3 aSphere;
  attribute vec3 aHelix;
  attribute vec3 aGalaxy;
  attribute vec4 aRandom;
  attribute vec3 aColor;

  varying vec3 vColor;
  varying float vAlpha;

  ${simplexNoise}

  mat3 rotX(float a) { float c = cos(a), s = sin(a); return mat3(1.0, 0.0, 0.0, 0.0, c, s, 0.0, -s, c); }
  mat3 rotY(float a) { float c = cos(a), s = sin(a); return mat3(c, 0.0, -s, 0.0, 1.0, 0.0, s, 0.0, c); }
  mat3 rotZ(float a) { float c = cos(a), s = sin(a); return mat3(c, s, 0.0, -s, c, 0.0, 0.0, 0.0, 1.0); }

  vec3 shapeAt(float i) {
    if (i < 0.5) {
      return rotZ(-0.12 + uTilt.x * 0.12) * rotX(0.32 + uTilt.y * 0.16) * rotY(uTime * 0.05) * position;
    }
    if (i < 1.5) {
      vec3 p = aWave;
      p.x -= uRail * 5.0;
      p.y += sin(p.x * 0.42 + uTime * 0.55) * 0.55
           + cos(p.z * 0.6 - uTime * 0.42) * 0.38
           + sin((p.x + p.z) * 0.28 + uTime * 0.3) * 0.3;
      return p;
    }
    if (i < 2.5) {
      vec3 s = aSphere;
      float ring = step(2.5, length(s));
      s = mix(normalize(s) * 2.05, s, mix(1.0, uRingAmount, ring));
      return uSphereC + rotZ(uRingTilt) * rotY(uTime * 0.12) * s * uPlanetScale;
    }
    if (i < 3.5) return uHelixC + rotZ(uHelixRot) * rotX(uTime * 0.35) * aHelix;
    return uGalaxyC + rotX(1.12) * rotY(uTime * 0.07) * aGalaxy;
  }

  void main() {
    float m = clamp(uMorph, 0.0, 4.0);
    float base = min(floor(m), 3.0);
    float f = m - base;
    // Each particle leaves a little earlier or later, so forms dissolve and re-gather.
    float t = smoothstep(0.0, 1.0, clamp((f - aRandom.x * 0.3) / 0.7, 0.0, 1.0));
    vec3 pos = mix(shapeAt(base), shapeAt(base + 1.0), t);

    float swirl = sin(t * 3.14159265);
    float vel = min(abs(uVelocity), 60.0);
    vec3 q = pos * 0.32 + vec3(0.0, 0.0, uTime * 0.12);
    vec3 n = vec3(snoise(q), snoise(q + vec3(17.3, 3.1, 9.7)), snoise(q - vec3(8.2, 11.4, 5.5)));
    pos += n * (0.05 + swirl * 1.8 + vel * 0.012);

    vec4 world = modelMatrix * vec4(pos, 1.0);
    vec3 away = world.xyz - uMouse;
    world.xyz += normalize(away + 0.0001) * smoothstep(1.7, 0.0, length(away)) * 0.9 * uMouseStrength;

    vec4 mv = viewMatrix * world;
    gl_Position = projectionMatrix * mv;
    float depth = -mv.z;
    gl_PointSize = min(uSize * aRandom.z * (1.0 + swirl * 0.7) / max(depth, 0.1), 48.0);

    vAlpha = smoothstep(0.15, 1.4, depth) * (0.5 + aRandom.w * 0.5);
    float core = clamp(m - 3.0, 0.0, 1.0) * smoothstep(2.6, 0.0, length(aGalaxy));
    vColor = aColor * (0.85 + swirl * 0.9 + vel * 0.012) + vec3(0.55, 0.75, 1.0) * core;
    float pw = clamp(1.0 - abs(m - 2.0), 0.0, 1.0);
    float band = 1.0 + uBands * 0.45 * sin(aSphere.y * 5.5);
    vColor *= mix(vec3(1.0), uPlanetTint * band, pw);
  }
`;

const particleFragment = /* glsl */ `
  uniform float uOpacity;
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    float s = pow(1.0 - d * 2.0, 1.8) + smoothstep(0.15, 0.0, d) * 0.35;
    gl_FragColor = vec4(vColor, s * vAlpha * uOpacity * 0.8);
  }
`;

// One look per section: work, about, capabilities, contact.
const PLANETS = [
  { tint: [1, 1, 1], scale: 1, ring: 1, tilt: 0.28, bands: 0 },
  { tint: [1.7, 0.7, 0.4], scale: 1.18, ring: 0, tilt: 0.1, bands: 1 },
  { tint: [0.6, 1.6, 1.0], scale: 0.8, ring: 1, tilt: -0.65, bands: 0.4 },
  { tint: [1.4, 0.75, 1.7], scale: 1.3, ring: 1, tilt: 0.95, bands: 0.8 },
];

function MorphParticles({ count }) {
  const material = useRef();
  const { camera, size, viewport } = useThree();
  const shapes = useMemo(() => buildShapes(count), [count]);
  const helpers = useMemo(() => ({
    raycaster: new THREE.Raycaster(),
    plane: new THREE.Plane(new THREE.Vector3(0, 0, 1), 0),
    ndc: new THREE.Vector2(),
    hit: new THREE.Vector3(),
  }), []);
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uMorph: { value: 4 },
    uSize: { value: 30 },
    uVelocity: { value: 0 },
    uRail: { value: 0 },
    uMouse: { value: new THREE.Vector3(0, 0, 0) },
    uMouseStrength: { value: 0 },
    uTilt: { value: new THREE.Vector2() },
    uSphereC: { value: new THREE.Vector3() },
    uHelixC: { value: new THREE.Vector3() },
    uHelixRot: { value: -0.2 },
    uGalaxyC: { value: new THREE.Vector3(0, -0.3, -2) },
    uPlanetTint: { value: new THREE.Vector3(1, 1, 1) },
    uPlanetScale: { value: 1 },
    uRingAmount: { value: 1 },
    uRingTilt: { value: 0.28 },
    uBands: { value: 0 },
    uOpacity: { value: 0 },
  }), []);

  useFrame((state, delta) => {
    const u = material.current?.uniforms;
    if (!u) return;
    const dt = Math.min(delta, 0.05);
    const wide = size.width / size.height > 1;
    const velocity = getLenis()?.velocity ?? 0;

    u.uTime.value += dt * (prefersReducedMotion() ? 0.25 : 1);
    u.uMorph.value = damp(u.uMorph.value, motionState.morph, 3.2, dt);
    u.uVelocity.value = damp(u.uVelocity.value, velocity, 4, dt);
    u.uRail.value = damp(u.uRail.value, motionState.rail, 4, dt);
    u.uOpacity.value = damp(u.uOpacity.value, 1, 1.2, dt);
    u.uSize.value = 0.05 * size.height * 0.5 * viewport.dpr;
    u.uTilt.value.set(
      damp(u.uTilt.value.x, motionState.pointer.x, 2, dt),
      damp(u.uTilt.value.y, motionState.pointer.y, 2, dt),
    );
    u.uSphereC.value.set(wide ? -3.3 : 0, wide ? 0.1 : -1.6, wide ? -1.2 : -2.5);
    u.uHelixC.value.set(0, wide ? 0.3 : 0, -3);
    u.uHelixRot.value = wide ? -0.2 : 1.35;

    const planet = PLANETS[clamp(motionState.planet, 0, PLANETS.length - 1)];
    u.uPlanetTint.value.x = damp(u.uPlanetTint.value.x, planet.tint[0], 3, dt);
    u.uPlanetTint.value.y = damp(u.uPlanetTint.value.y, planet.tint[1], 3, dt);
    u.uPlanetTint.value.z = damp(u.uPlanetTint.value.z, planet.tint[2], 3, dt);
    u.uPlanetScale.value = damp(u.uPlanetScale.value, planet.scale, 3, dt);
    u.uRingAmount.value = damp(u.uRingAmount.value, planet.ring, 3, dt);
    u.uRingTilt.value = damp(u.uRingTilt.value, planet.tilt, 3, dt);
    u.uBands.value = damp(u.uBands.value, planet.bands, 3, dt);

    helpers.ndc.set(motionState.pointer.x, -motionState.pointer.y);
    helpers.raycaster.setFromCamera(helpers.ndc, camera);
    if (helpers.raycaster.ray.intersectPlane(helpers.plane, helpers.hit)) {
      u.uMouse.value.lerp(helpers.hit, 1 - Math.exp(-6 * dt));
    }
    u.uMouseStrength.value = damp(u.uMouseStrength.value, motionState.pointer.active ? 1 : 0, 2, dt);
  });

  return (
    <points frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[shapes.torus, 3]} />
        <bufferAttribute attach="attributes-aWave" args={[shapes.wave, 3]} />
        <bufferAttribute attach="attributes-aSphere" args={[shapes.sphere, 3]} />
        <bufferAttribute attach="attributes-aHelix" args={[shapes.helix, 3]} />
        <bufferAttribute attach="attributes-aGalaxy" args={[shapes.galaxy, 3]} />
        <bufferAttribute attach="attributes-aRandom" args={[shapes.random, 4]} />
        <bufferAttribute attach="attributes-aColor" args={[shapes.colors, 3]} />
      </bufferGeometry>
      <shaderMaterial
        ref={material}
        uniforms={uniforms}
        vertexShader={particleVertex}
        fragmentShader={particleFragment}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

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
    uTime: { value: 0 }, uTravel: { value: 0 }, uStretch: { value: 0.05 }, uOpacity: { value: 0.75 },
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

function cameraPresets(wide) {
  return [
    { pos: [0, 0, wide ? 8.6 : 11], look: [0, 0, 0] },
    { pos: [0, 1.5, 7.8], look: [0, -1.3, -1] },
    { pos: wide ? [-1.1, 0.3, 8.2] : [0, -0.4, 9.5], look: wide ? [-1.7, 0.1, -1] : [0, -1.2, -1.5] },
    { pos: [0, 0.4, 8.4], look: [0, 0.2, -2.5] },
    { pos: [0, 0.9, wide ? 9.2 : 12], look: [0, -0.4, -1.5] },
  ];
}

function CameraRig() {
  const { camera, size } = useThree();
  const look = useRef(new THREE.Vector3());
  const target = useMemo(() => ({ pos: new THREE.Vector3(), look: new THREE.Vector3(), a: new THREE.Vector3(), b: new THREE.Vector3() }), []);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const presets = cameraPresets(size.width / size.height > 1);
    const m = clamp(motionState.morph, 0, 4);
    const index = Math.min(Math.floor(m), 3);
    const f = smoothstep(m - index, 0, 1);
    const dive = Math.pow(motionState.dive, 1.35);

    const from = presets[index];
    const to = presets[index + 1];
    target.a.fromArray(from.pos);
    target.b.fromArray(to.pos);
    if (index === 0) target.a.z = THREE.MathUtils.lerp(target.a.z, 0.5, dive);
    if (index === 1) target.a.x += (motionState.rail - 0.5) * 3;
    target.pos.lerpVectors(target.a, target.b, f);
    target.a.fromArray(from.look);
    target.b.fromArray(to.look);
    target.look.lerpVectors(target.a, target.b, f);

    target.pos.x += motionState.pointer.x * 0.35;
    target.pos.y -= motionState.pointer.y * 0.25;

    const k = 1 - Math.exp(-4 * dt);
    camera.position.lerp(target.pos, k);
    look.current.lerp(target.look, k);
    camera.lookAt(look.current);
    camera.rotation.z += dive * (1 - f) * 0.25 * Math.sin(state.clock.elapsedTime * 0.4);

    const fov = 45 + dive * (index === 0 ? 1 - f : 0) * 32;
    if (Math.abs(camera.fov - fov) > 0.01) {
      camera.fov = damp(camera.fov, fov, 5, dt);
      camera.updateProjectionMatrix();
    }
  });
  return null;
}

function Effects() {
  const bloom = useRef();
  const aberration = useRef();
  const offset = useMemo(() => new THREE.Vector2(0.0005, 0.0005), []);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const velocity = Math.min(Math.abs(getLenis()?.velocity ?? 0), 80);
    const dive = motionState.dive * (1 - clamp(motionState.morph, 0, 1));
    if (aberration.current) {
      const amount = damp(aberration.current.offset.x, 0.0004 + velocity * 0.00006 + dive * 0.004, 5, dt);
      aberration.current.offset.set(amount, amount * 0.6);
    }
    if (bloom.current) bloom.current.intensity = damp(bloom.current.intensity, 1.05 + dive * 0.9, 4, dt);
  });

  return (
    <EffectComposer multisampling={0} disableNormalPass>
      <Bloom ref={bloom} mipmapBlur intensity={1.05} luminanceThreshold={0.04} luminanceSmoothing={0.35} radius={0.72} />
      <ChromaticAberration ref={aberration} offset={offset} radialModulation modulationOffset={0.2} />
      <Vignette offset={0.28} darkness={0.78} />
    </EffectComposer>
  );
}

export default function Experience() {
  const narrow = useMemo(isNarrow, []);
  return (
    <div className="webgl-stage" aria-hidden="true">
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 8.6], fov: 45, near: 0.05, far: 80 }}
        gl={{ antialias: false, alpha: false, powerPreference: 'high-performance' }}
        fallback={<div className="scene-fallback" />}
      >
        <color attach="background" args={['#07090d']} />
        <CameraRig />
        <MorphParticles count={narrow ? 7000 : 15000} />
        <WarpStars count={narrow ? 700 : 1600} />
        <Effects />
      </Canvas>
    </div>
  );
}
