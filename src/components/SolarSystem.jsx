import { useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { bodies } from '../data/planets.js';
import { isStacked, motionState } from '../lib/motionState.js';
import { simplexNoise } from '../lib/noise.js';

// One celestial body on screen at a time. Paging to a new stop flies the current
// one past the camera, then the next rushes in from deep space backlit, and the
// sunlight sweeps across it like a sunrise.

const { damp, clamp, smoothstep, lerp } = THREE.MathUtils;

// type: 0 star, 1 rocky, 2 earth, 3 banded (gas, clouds, ice)
const LOOKS = {
  sun: { type: 0, radius: 2.2, a: '#ff5a00', b: '#ffb347', c: '#fff4d6', atmos: '#ff8a2a', atmosStrength: 1.4, spin: 0.03 },
  mercury: { type: 1, radius: 1.15, a: '#3f3b38', b: '#8f8780', c: '#cfc8bf', atmos: '#9a948d', atmosStrength: 0.12, noise: 2.6, craters: 1, spin: 0.05 },
  venus: { type: 3, radius: 1.5, a: '#9a6a2c', b: '#e3c07f', c: '#fff1cf', atmos: '#ffd08a', atmosStrength: 0.9, noise: 1.3, bands: 2.2, warp: 5, flow: 0.5, spin: 0.02 },
  earth: { type: 2, radius: 1.55, atmos: '#5fb6ff', atmosStrength: 1, tilt: 0.41, spin: 0.08, moons: [{ size: 0.27, orbit: 3.1, speed: 0.22, color: '#bdb8b0', incline: 0.15 }] },
  mars: { type: 1, radius: 1.3, a: '#4a1c0e', b: '#b24f26', c: '#e39060', atmos: '#ff8a5c', atmosStrength: 0.35, noise: 1.8, craters: 0.45, caps: 1, tilt: 0.44, spin: 0.08, moons: [{ size: 0.08, orbit: 2.0, speed: 0.9, color: '#8a7b6e', incline: 0.02 }, { size: 0.06, orbit: 2.7, speed: 0.5, color: '#9a8c80', incline: 0.03 }] },
  jupiter: { type: 3, radius: 2.15, a: '#6e4026', b: '#d9b48a', c: '#f6eee0', atmos: '#e8c9a0', atmosStrength: 0.5, noise: 1.2, bands: 7, warp: 2.6, flow: 1, spot: 1, spotColor: '#b4472a', spin: 0.12, moons: [{ size: 0.1, orbit: 3, speed: 0.6, color: '#e8d27a', incline: 0.02 }, { size: 0.09, orbit: 3.5, speed: 0.45, color: '#d9d4c8', incline: 0.02 }, { size: 0.14, orbit: 4.1, speed: 0.32, color: '#9c8d7c', incline: 0.03 }, { size: 0.13, orbit: 4.7, speed: 0.24, color: '#6e6258', incline: 0.03 }] },
  saturn: { type: 3, radius: 1.6, a: '#806640', b: '#d8bf8c', c: '#f3e6c6', atmos: '#f0d9a8', atmosStrength: 0.45, noise: 1.1, bands: 6, warp: 1.2, flow: 0.8, tilt: 0.47, spin: 0.11, ring: { inner: 1.25, outer: 2.35, color: '#e2d0aa', opacity: 0.9 }, moons: [{ size: 0.13, orbit: 4.1, speed: 0.25, color: '#d9a35a', incline: 0.05 }] },
  uranus: { type: 3, radius: 1.55, a: '#5aaebf', b: '#93dde8', c: '#d4f6fa', atmos: '#9bf0ff', atmosStrength: 0.85, noise: 0.8, bands: 2, warp: 0.6, flow: 0.4, tilt: 1.71, spin: 0.07, ring: { inner: 1.5, outer: 1.85, color: '#a8d8e0', opacity: 0.35 } },
  neptune: { type: 3, radius: 1.55, a: '#0f1f66', b: '#2c5ad6', c: '#7fb0ff', atmos: '#4f86ff', atmosStrength: 0.95, noise: 1.2, bands: 4, warp: 1.6, flow: 1.4, spot: 1, spotColor: '#091238', tilt: 0.49, spin: 0.09, moons: [{ size: 0.11, orbit: 3, speed: -0.35, color: '#c9c2c0', incline: 0.4 }] },
};

const bodyVertex = /* glsl */ `
  varying vec3 vObj;
  varying vec3 vNormalV;
  varying vec3 vViewPos;
  void main() {
    vObj = position;
    vNormalV = normalize(normalMatrix * normal);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vViewPos = mv.xyz;
    gl_Position = projectionMatrix * mv;
  }
`;

const bodyFragment = /* glsl */ `
  uniform float uTime;
  uniform float uType;
  uniform vec3 uA;
  uniform vec3 uB;
  uniform vec3 uC;
  uniform vec3 uAtmos;
  uniform float uAtmosStrength;
  uniform float uNoise;
  uniform float uBands;
  uniform float uWarp;
  uniform float uFlow;
  uniform float uCraters;
  uniform float uCaps;
  uniform float uSpot;
  uniform vec3 uSpotColor;
  uniform vec3 uLightDir;
  varying vec3 vObj;
  varying vec3 vNormalV;
  varying vec3 vViewPos;
  ${simplexNoise}

  float fbm(vec3 p) {
    float s = 0.0;
    float a = 0.5;
    for (int i = 0; i < 4; i++) {
      s += a * snoise(p);
      p = p * 2.03 + vec3(1.7, 9.2, 3.1);
      a *= 0.5;
    }
    return s;
  }

  void main() {
    vec3 p = normalize(vObj);
    vec3 N = normalize(vNormalV);
    vec3 V = normalize(-vViewPos);
    vec3 L = normalize(uLightDir);
    float ndl = dot(N, L);
    float facing = max(dot(N, V), 0.0);

    if (uType < 0.5) {
      // Star: boiling granulation, hot spots, limb darkening. Over-bright so bloom makes it glow.
      float n = fbm(p * 2.6 + vec3(0.0, uTime * 0.05, uTime * 0.02));
      float g = snoise(p * 14.0 + uTime * 0.25) * 0.5 + 0.5;
      float heat = clamp(0.5 + n * 0.75 + g * 0.18, 0.0, 1.0);
      vec3 col = mix(uA, uB, smoothstep(0.1, 0.7, heat));
      col = mix(col, uC, smoothstep(0.65, 1.0, heat));
      col *= 0.55 + 0.75 * pow(facing, 0.4);
      gl_FragColor = vec4(col * 2.2, 1.0);
      return;
    }

    vec3 col;
    vec3 emissive = vec3(0.0);
    float spec = 0.0;

    if (uType < 1.5) {
      // Rocky: mottled regolith, crater rims and pits, optional polar caps.
      float n = fbm(p * uNoise);
      float rims = smoothstep(0.6, 0.85, 1.0 - abs(snoise(p * 7.0))) * uCraters;
      float pits = smoothstep(0.35, 0.65, snoise(p * 13.0)) * uCraters;
      float t = clamp(0.5 + n * 0.85 - pits * 0.3 + rims * 0.18, 0.0, 1.0);
      col = mix(uA, uB, smoothstep(0.12, 0.72, t));
      col = mix(col, uC, smoothstep(0.75, 1.0, t));
      float cap = smoothstep(0.84, 0.9, abs(p.y) + n * 0.07) * uCaps;
      col = mix(col, vec3(0.94, 0.95, 0.97), cap);
    } else if (uType < 2.5) {
      // Earth: oceans, continents, deserts, ice, drifting clouds and city lights on the night side.
      float height = fbm(p * 1.5 + vec3(3.1));
      float land = smoothstep(0.03, 0.08, height);
      float detail = fbm(p * 5.0);
      float lat = abs(p.y);
      vec3 ocean = mix(vec3(0.01, 0.05, 0.17), vec3(0.03, 0.2, 0.42), smoothstep(-0.35, 0.05, height));
      vec3 green = mix(vec3(0.07, 0.22, 0.07), vec3(0.36, 0.33, 0.18), smoothstep(-0.2, 0.4, detail));
      vec3 desert = vec3(0.66, 0.52, 0.32);
      float dry = smoothstep(0.12, 0.0, abs(lat - 0.3)) * smoothstep(-0.1, 0.25, detail);
      col = mix(ocean, mix(green, desert, dry), land);
      float ice = smoothstep(0.8, 0.87, lat + detail * 0.06);
      col = mix(col, vec3(0.92, 0.95, 1.0), ice);
      float clouds = smoothstep(0.08, 0.55, fbm(p * 2.3 + vec3(uTime * 0.012, 0.0, uTime * 0.006)));
      spec = (1.0 - land) * (1.0 - ice) * (1.0 - clouds);
      float cities = land * (1.0 - ice) * smoothstep(0.5, 0.85, snoise(p * 42.0)) * smoothstep(-0.1, 0.4, detail);
      emissive = vec3(1.0, 0.72, 0.38) * cities * (1.0 - clouds) * smoothstep(0.05, -0.3, ndl) * 1.6;
      col = mix(col, vec3(1.0), clouds * 0.88);
    } else {
      // Banded atmospheres: turbulent belts and zones that flow, plus an optional storm.
      float turb = fbm(p * vec3(uNoise, uNoise * 3.0, uNoise) + vec3(uTime * 0.02 * uFlow, 0.0, uTime * 0.008 * uFlow));
      float b = smoothstep(0.15, 0.85, sin(p.y * uBands * 1.5708 + turb * uWarp) * 0.5 + 0.5);
      float b2 = sin(p.y * uBands * 4.1 + turb * uWarp * 1.8) * 0.5 + 0.5;
      col = mix(uA, uB, b);
      col = mix(col, uC, b2 * b * 0.4);
      col *= 0.9 + 0.2 * snoise(p * 9.0 + turb);
      vec3 q = p - normalize(vec3(0.62, -0.36, 0.7));
      float e = length(vec3(q.x, q.y * 1.9, q.z)) + turb * 0.03;
      float storm = smoothstep(0.21, 0.13, e) * uSpot;
      float collar = (smoothstep(0.27, 0.21, e) - smoothstep(0.21, 0.15, e)) * uSpot;
      col = mix(col, uSpotColor, storm);
      col = mix(col, uC, collar * 0.5);
    }

    float diff = smoothstep(-0.12, 0.9, ndl);
    vec3 lit = col * (0.025 + diff * 1.1) + emissive;
    vec3 H = normalize(L + V);
    lit += vec3(1.0, 0.95, 0.85) * pow(max(dot(N, H), 0.0), 70.0) * spec * 0.9 * step(0.0, ndl);

    float rim = pow(1.0 - facing, 3.0);
    float dayRim = rim * smoothstep(-0.35, 0.6, ndl);
    float backlit = rim * pow(max(dot(L, -V), 0.0), 1.5) * 1.6;
    lit += uAtmos * uAtmosStrength * (dayRim * 0.9 + backlit);
    gl_FragColor = vec4(lit, 1.0);
  }
`;

const haloVertex = /* glsl */ `
  varying vec3 vNormalV;
  void main() {
    vNormalV = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const haloFragment = /* glsl */ `
  uniform vec3 uAtmos;
  uniform float uAtmosStrength;
  uniform vec3 uLightDir;
  uniform float uType;
  varying vec3 vNormalV;
  void main() {
    vec3 N = normalize(vNormalV);
    // Back faces: strongest just outside the planet's edge, fading to nothing at the shell's rim.
    float glow = pow(clamp(-N.z * 2.4, 0.0, 1.0), 2.5);
    vec3 L = normalize(uLightDir);
    float side = dot(normalize(vec3(N.xy, 0.0001)), normalize(vec3(L.xy, 0.0001))) * 0.5 + 0.5;
    float lit = uType < 0.5 ? 1.0 : 0.2 + 0.8 * side * max(L.z + 0.4, 0.0) + 1.4 * max(-L.z, 0.0);
    gl_FragColor = vec4(uAtmos * glow * lit * uAtmosStrength * 0.9, 1.0);
  }
`;

const coronaFragment = /* glsl */ `
  uniform float uTime;
  uniform float uGlow;
  varying vec2 vUv;
  ${simplexNoise}
  void main() {
    vec2 c = vUv - 0.5;
    float d = length(c) * 2.0;
    float ang = atan(c.y, c.x);
    float rays = snoise(vec3(cos(ang) * 2.5, sin(ang) * 2.5, uTime * 0.15)) * 0.5 + 0.5;
    float corona = exp(-pow(max(d - 0.36, 0.0), 1.0) * (7.0 - rays * 3.5)) * smoothstep(0.3, 0.38, d);
    float haze = exp(-d * d * 3.0) * 0.35;
    vec3 col = vec3(1.0, 0.62, 0.25) * corona * 1.6 + vec3(1.0, 0.45, 0.15) * haze;
    gl_FragColor = vec4(col * uGlow * smoothstep(1.0, 0.55, d), 1.0);
  }
`;

const planeVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const ringVertex = /* glsl */ `
  varying float vR;
  varying vec3 vViewPos;
  varying vec3 vNormalV;
  void main() {
    vR = length(position.xy);
    vNormalV = normalize(normalMatrix * vec3(0.0, 0.0, 1.0));
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vViewPos = mv.xyz;
    gl_Position = projectionMatrix * mv;
  }
`;

const ringFragment = /* glsl */ `
  uniform vec3 uRingColor;
  uniform float uInner;
  uniform float uOuter;
  uniform float uOpacity;
  uniform vec3 uLightDir;
  uniform vec3 uCenterV;
  uniform float uRadius;
  varying float vR;
  varying vec3 vViewPos;
  varying vec3 vNormalV;
  void main() {
    float r = (vR - uInner) / (uOuter - uInner);
    float bands = 0.55 + 0.25 * sin(r * 48.0) + 0.12 * sin(r * 131.0) + 0.08 * sin(r * 17.0);
    float gap = smoothstep(0.012, 0.03, abs(r - 0.63));
    float edge = smoothstep(0.0, 0.05, r) * smoothstep(1.0, 0.9, r);
    vec3 L = normalize(uLightDir);
    // Shadow of the planet falling across the rings.
    vec3 w = uCenterV - vViewPos;
    float t = dot(w, L);
    float shadow = t > 0.0 ? smoothstep(uRadius * 0.96, uRadius * 1.04, length(w - L * t)) : 1.0;
    float light = (0.25 + 0.75 * abs(dot(normalize(vNormalV), L))) * (0.15 + 0.85 * shadow);
    float alpha = edge * gap * bands * uOpacity;
    gl_FragColor = vec4(uRingColor * light * (0.7 + bands * 0.5), alpha);
  }
`;

const moonFragment = /* glsl */ `
  uniform vec3 uColor;
  uniform vec3 uLightDir;
  varying vec3 vObj;
  varying vec3 vNormalV;
  varying vec3 vViewPos;
  ${simplexNoise}
  void main() {
    float n = snoise(normalize(vObj) * 4.0) * 0.5 + 0.5;
    float diff = smoothstep(-0.1, 0.9, dot(normalize(vNormalV), normalize(uLightDir)));
    gl_FragColor = vec4(uColor * (0.75 + n * 0.35) * (0.03 + diff), 1.0);
  }
`;

// Camera distance on planet stops; CameraRig in Experience.jsx uses the same values.
export const CAMERA_Z_SIDE = 9;
export const CAMERA_Z_STACKED = 11;

const easeOutExpo = (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));
const BACKLIT = new THREE.Vector3(0.25, 0.15, -1).normalize();
const SUNLIT = new THREE.Vector3(-0.7, 0.35, 0.6).normalize();

function Moon({ moon, index, uniforms }) {
  const pivot = useRef();
  const own = useMemo(() => ({ uColor: { value: new THREE.Color(moon.color) }, uLightDir: uniforms.uLightDir }), [moon.color, uniforms]);
  useFrame((_, delta) => {
    if (pivot.current) pivot.current.rotation.y += Math.min(delta, 0.05) * moon.speed;
  });
  return (
    <group rotation={[moon.incline, index * 1.7, 0]}>
      <group ref={pivot}>
        <mesh position={[moon.orbit, 0, 0]}>
          <sphereGeometry args={[moon.size, 24, 16]} />
          <shaderMaterial uniforms={own} vertexShader={bodyVertex} fragmentShader={moonFragment} />
        </mesh>
      </group>
    </group>
  );
}

export default function SolarSystem() {
  const { camera, size } = useThree();
  const root = useRef();
  const spinner = useRef();
  const tilt = useRef();
  const halo = useRef();
  const corona = useRef();
  const ring = useRef();
  const state = useRef({ shown: -1, phase: 'hidden', t: 0, want: -1, dir: 1 });
  const temp = useMemo(() => ({ base: new THREE.Vector3(), light: new THREE.Vector3(), center: new THREE.Vector3() }), []);

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uType: { value: 1 },
    uA: { value: new THREE.Color() },
    uB: { value: new THREE.Color() },
    uC: { value: new THREE.Color() },
    uAtmos: { value: new THREE.Color() },
    uAtmosStrength: { value: 0 },
    uNoise: { value: 1 },
    uBands: { value: 0 },
    uWarp: { value: 0 },
    uFlow: { value: 1 },
    uCraters: { value: 0 },
    uCaps: { value: 0 },
    uSpot: { value: 0 },
    uSpotColor: { value: new THREE.Color() },
    uLightDir: { value: BACKLIT.clone() },
  }), []);
  const ringUniforms = useMemo(() => ({
    uRingColor: { value: new THREE.Color() },
    uInner: { value: 1 },
    uOuter: { value: 2 },
    uOpacity: { value: 0 },
    uLightDir: uniforms.uLightDir,
    uCenterV: { value: new THREE.Vector3() },
    uRadius: { value: 1 },
  }), [uniforms]);
  const coronaUniforms = useMemo(() => ({ uTime: uniforms.uTime, uGlow: { value: 0 } }), [uniforms]);
  const look = useRef(LOOKS.sun);

  const applyLook = (index) => {
    const body = bodies[index];
    const l = LOOKS[body.id];
    look.current = l;
    uniforms.uType.value = l.type;
    uniforms.uA.value.set(l.a ?? '#000000');
    uniforms.uB.value.set(l.b ?? '#000000');
    uniforms.uC.value.set(l.c ?? '#000000');
    uniforms.uAtmos.value.set(l.atmos);
    uniforms.uAtmosStrength.value = l.atmosStrength;
    uniforms.uNoise.value = l.noise ?? 1;
    uniforms.uBands.value = l.bands ?? 0;
    uniforms.uWarp.value = l.warp ?? 0;
    uniforms.uFlow.value = l.flow ?? 1;
    uniforms.uCraters.value = l.craters ?? 0;
    uniforms.uCaps.value = l.caps ?? 0;
    uniforms.uSpot.value = l.spot ?? 0;
    uniforms.uSpotColor.value.set(l.spotColor ?? '#000000');
    spinner.current.scale.setScalar(l.radius);
    halo.current.scale.setScalar(l.radius * (l.type === 0 ? 1.18 : 1.1));
    tilt.current.rotation.set(0, 0, l.tilt ?? 0);
    corona.current.visible = l.type === 0;
    corona.current.scale.setScalar(l.radius * 4.4);
    ring.current.visible = Boolean(l.ring);
    if (l.ring) {
      ringUniforms.uRingColor.value.set(l.ring.color);
      ringUniforms.uInner.value = l.ring.inner * l.radius;
      ringUniforms.uOuter.value = l.ring.outer * l.radius;
      ringUniforms.uOpacity.value = l.ring.opacity;
      ringUniforms.uRadius.value = l.radius;
      ring.current.geometry.dispose();
      ring.current.geometry = new THREE.RingGeometry(l.ring.inner * l.radius, l.ring.outer * l.radius, 160, 1);
    }
  };

  useFrame((frame, delta) => {
    const dt = Math.min(delta, 0.05);
    const s = state.current;
    const aspect = size.width / size.height;
    const stacked = isStacked();
    uniforms.uTime.value += dt;
    const want = motionState.body;

    // State machine: leave → (swap) → arrive → idle. Travelling outward the planet flies
    // past the camera and the next one rushes in from deep space; travelling back it is reversed.
    if (want !== s.want) {
      s.want = want;
      s.dir = motionState.direction;
      if (s.phase === 'hidden') {
        if (want >= 0) { applyLook(want); s.shown = want; s.phase = 'arrive'; s.t = 0; }
      } else if (s.phase !== 'leave') {
        s.phase = 'leave';
        s.t = 0;
      }
    }
    if (s.phase === 'leave') {
      s.t += dt / 0.5;
      if (s.t >= 1) {
        if (s.want >= 0) { applyLook(s.want); s.shown = s.want; s.phase = 'arrive'; s.t = 0; }
        else { s.shown = -1; s.phase = 'hidden'; }
      }
    } else if (s.phase === 'arrive') {
      s.t += dt / 1.5;
      if (s.t >= 1) { s.t = 1; s.phase = 'idle'; }
    }

    const l = look.current;
    // Fit the body to the space the layout leaves it. Side by side it fills its half,
    // alternating sides each stop; stacked it sits centred above the text.
    const halfH = Math.tan(THREE.MathUtils.degToRad(22.5)) * (stacked ? CAMERA_Z_STACKED : CAMERA_Z_SIDE);
    const halfW = halfH * aspect;
    const extent = l.ring ? l.ring.outer * l.radius * 0.92 : l.radius * 1.12;
    const side = s.shown % 2 === 0 ? 1 : -1;
    const room = stacked ? Math.min(halfW * 0.84, halfH * 0.36) : Math.min(halfW * 0.42, halfH * 0.8);
    temp.base.set(stacked ? 0 : side * halfW * 0.47, stacked ? halfH * 0.47 : -0.1, 0);
    const g = root.current;
    g.visible = s.phase !== 'hidden';
    g.scale.setScalar(Math.min(1, room / extent));
    let warp = 0;
    const forward = s.dir >= 0;
    if (s.phase === 'leave') {
      const k = s.t * s.t;
      if (forward) g.position.set(temp.base.x - k * 11, temp.base.y + k * 1.5, temp.base.z + k * 5);
      else g.position.set(temp.base.x * (1 - k * 0.6), temp.base.y + k, temp.base.z - k * 80);
      warp = Math.sin(Math.min(s.t, 1) * Math.PI * 0.5);
    } else if (s.phase === 'arrive') {
      const e = easeOutExpo(s.t);
      if (forward) g.position.set(lerp(temp.base.x + 7, temp.base.x, e), lerp(temp.base.y + 1.5, temp.base.y, e), lerp(-110, temp.base.z, e));
      else g.position.set(lerp(temp.base.x * 1.5 + 3, temp.base.x, e), lerp(temp.base.y - 1, temp.base.y, e), lerp(14, temp.base.z, e));
      warp = clamp(1 - s.t * 2.4, 0, 1);
    } else {
      g.position.lerp(temp.base, 1 - Math.exp(-3 * dt));
    }
    motionState.warp = s.phase === 'hidden' ? 0 : warp;

    // Sunrise: arrive backlit (a bright atmospheric ring), then the light swings round to the front.
    const sweep = s.phase === 'arrive' ? smoothstep(s.t, 0.3, 1) : s.phase === 'leave' ? 1 - s.t * 0.5 : 1;
    temp.light.copy(BACKLIT).lerp(SUNLIT, sweep);
    temp.light.x += motionState.pointer.x * 0.25 * sweep;
    temp.light.y -= motionState.pointer.y * 0.2 * sweep;
    uniforms.uLightDir.value.copy(temp.light.normalize());

    spinner.current.rotation.y += dt * l.spin;
    g.rotation.x = damp(g.rotation.x, motionState.dragY, 6, dt);
    g.rotation.y = damp(g.rotation.y, motionState.dragX, 6, dt);

    if (corona.current.visible) {
      corona.current.quaternion.copy(camera.quaternion).premultiply(g.quaternion.clone().invert());
      coronaUniforms.uGlow.value = 0.6 + 0.4 * sweep;
    }
    if (ring.current.visible) {
      spinner.current.getWorldPosition(temp.center).applyMatrix4(camera.matrixWorldInverse);
      ringUniforms.uCenterV.value.copy(temp.center);
    }
  });

  return (
    <group ref={root} visible={false}>
      <group ref={tilt}>
        <mesh ref={spinner} renderOrder={1}>
          <sphereGeometry args={[1, 96, 64]} />
          <shaderMaterial uniforms={uniforms} vertexShader={bodyVertex} fragmentShader={bodyFragment} />
        </mesh>
        <mesh ref={halo} renderOrder={2}>
          <sphereGeometry args={[1, 64, 48]} />
          <shaderMaterial uniforms={uniforms} vertexShader={haloVertex} fragmentShader={haloFragment} side={THREE.BackSide} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
        </mesh>
        <mesh ref={ring} rotation={[Math.PI / 2 - 0.45, 0, 0]} renderOrder={3}>
          <ringGeometry args={[1, 2, 160, 1]} />
          <shaderMaterial uniforms={ringUniforms} vertexShader={ringVertex} fragmentShader={ringFragment} transparent depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
        <MoonSet uniforms={uniforms} lookRef={look} stateRef={state} />
      </group>
      <mesh ref={corona} renderOrder={0}>
        <planeGeometry args={[1, 1]} />
        <shaderMaterial uniforms={coronaUniforms} vertexShader={planeVertex} fragmentShader={coronaFragment} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
    </group>
  );
}

// Re-renders only when the shown body changes, so each world gets its own moons.
function MoonSet({ uniforms, lookRef, stateRef }) {
  const [shown, setShown] = useState(-1);
  useFrame(() => {
    if (stateRef.current.shown !== shown) setShown(stateRef.current.shown);
  });
  const moons = shown >= 0 ? lookRef.current.moons ?? [] : [];
  return moons.map((moon, i) => <Moon key={`${shown}-${i}`} moon={moon} index={i} uniforms={uniforms} />);
}
