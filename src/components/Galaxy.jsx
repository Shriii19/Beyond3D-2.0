import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { motionState, prefersReducedMotion } from '../lib/motionState.js';

// The hero galaxy: a spiral of stars that forms on load, swirls, twinkles and
// bends toward the cursor, wrapped in nebula clouds with a glowing core.
// On the other slides it recedes into the background behind the planets.

const { damp, clamp } = THREE.MathUtils;
const RADIUS = 7;
const ARMS = 4;
const TILT = 1.08;

// Seeded PRNG so the galaxy is identical on every load.
export function seeded(seed) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildStars(count) {
  const r = seeded(20260);
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const random = new Float32Array(count * 4);
  const core = new THREE.Color('#fff1dc');
  const inner = new THREE.Color('#ffc9a0');
  const mid = new THREE.Color('#c7d6ff');
  const outer = new THREE.Color('#4b83ff');
  const edge = new THREE.Color('#6674bd');
  const accents = [new THREE.Color('#ff7ad9'), new THREE.Color('#8feaff'), new THREE.Color('#ffffff')];
  const gauss = () => (r() + r() + r() - 1.5) / 1.5;
  const color = new THREE.Color();

  for (let i = 0; i < count; i += 1) {
    const kind = r();
    let x;
    let y;
    let z;
    let size = 0.55 + r() * r() * 1.5;
    if (kind < 0.09) {
      // central bulge
      const rr = Math.pow(r(), 2.2) * 1.4;
      const u = r() * 2 - 1;
      const a = r() * Math.PI * 2;
      const s = Math.sqrt(1 - u * u);
      x = rr * s * Math.cos(a);
      y = rr * u * 0.55;
      z = rr * s * Math.sin(a);
      size *= 1.15;
    } else if (kind < 0.17) {
      // sparse halo
      const rr = 1 + r() * RADIUS * 1.2;
      const a = r() * Math.PI * 2;
      x = Math.cos(a) * rr;
      y = gauss() * 0.9;
      z = Math.sin(a) * rr;
    } else {
      // logarithmic-ish spiral arms
      const rr = 0.35 + Math.pow(r(), 1.35) * RADIUS;
      const angle = ((i % ARMS) / ARMS) * Math.PI * 2 + rr * 0.85;
      const spread = 0.12 + rr * 0.1;
      x = Math.cos(angle) * rr + gauss() * spread;
      z = Math.sin(angle) * rr + gauss() * spread;
      y = gauss() * 0.3 * (1.25 - rr / RADIUS);
    }

    const t = Math.min(Math.hypot(x, z) / RADIUS, 1);
    if (t < 0.1) color.copy(core).lerp(inner, t / 0.1);
    else if (t < 0.45) color.copy(inner).lerp(mid, (t - 0.1) / 0.35);
    else color.copy(mid).lerp(outer, (t - 0.45) / 0.4).lerp(edge, Math.max(0, t - 0.85) * 3);
    const accent = r();
    if (kind >= 0.17 && accent < 0.15) {
      color.copy(accents[accent < 0.04 ? 0 : accent < 0.1 ? 1 : 2]);
      size *= 1.5;
    }

    positions.set([x, y, z], i * 3);
    colors.set([color.r, color.g, color.b], i * 3);
    random.set([r(), r(), size, r()], i * 4);
  }
  return { positions, colors, random };
}

function buildNebula(count) {
  const r = seeded(77);
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const random = new Float32Array(count * 4);
  const palette = ['#5a3cff', '#2a5bff', '#b04bd6', '#1fa3ff', '#ff6fb5'].map((c) => new THREE.Color(c));
  for (let i = 0; i < count; i += 1) {
    const rr = 0.6 + Math.pow(r(), 1.1) * RADIUS * 0.95;
    const angle = ((i % ARMS) / ARMS) * Math.PI * 2 + rr * 0.85 + (r() - 0.5) * 0.5;
    positions.set([Math.cos(angle) * rr, (r() - 0.5) * 0.4, Math.sin(angle) * rr], i * 3);
    const c = palette[Math.floor(r() * palette.length)];
    colors.set([c.r, c.g, c.b], i * 3);
    random.set([r(), r(), 40 + r() * 70, r()], i * 4);
  }
  return { positions, colors, random };
}

// Shared by stars and nebula so both rotate and form together.
const galaxyMotion = /* glsl */ `
  uniform float uTime;
  uniform float uIntro;
  uniform float uFocus;
  uniform float uSpin;
  uniform float uScale;
  uniform vec3 uCenter;
  uniform mat3 uOrient;
  uniform float uSize;
  uniform vec3 uMouse;
  uniform float uMouseStrength;
  attribute vec3 aColor;
  attribute vec4 aRandom;
  varying vec3 vColor;
  varying float vAlpha;

  float formed() {
    float intro = clamp(uIntro * 1.35 - aRandom.w * 0.35, 0.0, 1.0);
    return 1.0 - pow(1.0 - intro, 3.0);
  }

  // Rigid rotation, an inner swirl that winds and unwinds, and a fast inward spiral while forming.
  vec3 galaxyPosition(vec3 p, float e) {
    float r = length(p.xz);
    float ang = uTime * 0.045 + uSpin + 0.55 * sin(uTime * 0.07) / (r + 0.9) + (1.0 - e) * 7.0 / (r + 0.6);
    float c = cos(ang);
    float s = sin(ang);
    p.xz = mat2(c, -s, s, c) * p.xz;
    p *= mix(2.6, 1.0, e);
    return uCenter + uOrient * p * uScale;
  }
`;

const starVertex = /* glsl */ `
  ${galaxyMotion}
  void main() {
    float e = formed();
    vec3 world = galaxyPosition(position, e);
    vec3 toMouse = uMouse - world;
    float pull = smoothstep(2.6, 0.0, length(toMouse)) * uMouseStrength;
    world += toMouse * pull * 0.35;

    vec4 mv = viewMatrix * vec4(world, 1.0);
    gl_Position = projectionMatrix * mv;
    float twinkle = 0.6 + 0.4 * sin(uTime * (1.2 + aRandom.x * 3.5) + aRandom.y * 6.2831);
    gl_PointSize = min(uSize * aRandom.z * (0.75 + twinkle * 0.4) * (1.0 + pull * 1.5) / max(-mv.z, 0.1), 64.0);
    float centre = mix(0.4, 1.0, smoothstep(0.0, 1.8, length(position.xz)));
    vAlpha = e * e * twinkle * centre * mix(0.4, 1.0, uFocus) * smoothstep(0.2, 1.5, -mv.z);
    vColor = aColor * (1.0 + pull * 1.6);
  }
`;

const starFragment = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    float a = pow(1.0 - d * 2.0, 2.2) + smoothstep(0.12, 0.0, d) * 0.5;
    gl_FragColor = vec4(vColor, a * vAlpha);
  }
`;

const nebulaVertex = /* glsl */ `
  ${galaxyMotion}
  void main() {
    float e = formed();
    vec4 mv = viewMatrix * vec4(galaxyPosition(position, e), 1.0);
    gl_Position = projectionMatrix * mv;
    float breathe = 0.85 + 0.15 * sin(uTime * 0.4 + aRandom.y * 6.2831);
    gl_PointSize = min(uSize * aRandom.z * breathe / max(-mv.z, 0.1), 256.0);
    vAlpha = e * e * (0.012 + aRandom.x * 0.02) * mix(0.5, 1.0, uFocus);
    vColor = aColor;
  }
`;

const nebulaFragment = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = exp(-d * d * 9.0) * smoothstep(0.5, 0.3, d);
    gl_FragColor = vec4(vColor, a * vAlpha);
  }
`;

const coreVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const coreFragment = /* glsl */ `
  uniform float uGlow;
  uniform float uTime;
  varying vec2 vUv;
  void main() {
    float d = length(vUv - 0.5) * 2.0;
    float pulse = 0.9 + 0.1 * sin(uTime * 1.3);
    float core = exp(-d * d * 28.0) * 1.4;
    float halo = exp(-d * d * 4.0) * 0.35;
    vec3 col = vec3(1.0, 0.9, 0.78) * core + vec3(0.45, 0.6, 1.0) * halo;
    gl_FragColor = vec4(col * uGlow * pulse, (core + halo) * uGlow);
  }
`;

const skyVertex = /* glsl */ `
  uniform float uTime;
  uniform float uSize;
  attribute vec4 aRandom;
  attribute vec3 aColor;
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    float twinkle = 0.35 + 0.65 * pow(0.5 + 0.5 * sin(uTime * (0.6 + aRandom.x * 2.4) + aRandom.y * 6.2831), 3.0);
    gl_PointSize = uSize * aRandom.z * (0.6 + twinkle * 0.6);
    vAlpha = twinkle;
    vColor = aColor;
  }
`;

const meteorVertex = /* glsl */ `
  attribute float aAlpha;
  varying float vAlpha;
  void main() {
    vAlpha = aAlpha;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const meteorFragment = /* glsl */ `
  varying float vAlpha;
  void main() { gl_FragColor = vec4(0.85, 0.93, 1.0, vAlpha); }
`;

const additive = { transparent: true, depthWrite: false, blending: THREE.AdditiveBlending };

// Distant, twinkling star sphere that slowly turns.
function StarSky({ count }) {
  const points = useRef();
  const { viewport } = useThree();
  const data = useMemo(() => {
    const r = seeded(4242);
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const random = new Float32Array(count * 4);
    const tints = ['#ffffff', '#c7d6ff', '#9bdeff', '#ffe2c4'].map((c) => new THREE.Color(c));
    for (let i = 0; i < count; i += 1) {
      const u = r() * 2 - 1;
      const a = r() * Math.PI * 2;
      const s = Math.sqrt(1 - u * u);
      const rr = 28 + r() * 18;
      positions.set([rr * s * Math.cos(a), rr * u, rr * s * Math.sin(a)], i * 3);
      const c = tints[Math.floor(r() * tints.length)];
      colors.set([c.r, c.g, c.b], i * 3);
      random.set([r(), r(), 0.6 + r() * r() * 2.2, 0], i * 4);
    }
    return { positions, colors, random };
  }, [count]);
  const uniforms = useMemo(() => ({ uTime: { value: 0 }, uSize: { value: 2 } }), []);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    uniforms.uTime.value += dt;
    uniforms.uSize.value = 1.6 * viewport.dpr;
    if (points.current) points.current.rotation.y += dt * 0.004;
  });

  return (
    <points ref={points} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[data.positions, 3]} />
        <bufferAttribute attach="attributes-aColor" args={[data.colors, 3]} />
        <bufferAttribute attach="attributes-aRandom" args={[data.random, 4]} />
      </bufferGeometry>
      <shaderMaterial uniforms={uniforms} vertexShader={skyVertex} fragmentShader={starFragment} {...additive} />
    </points>
  );
}

// A few meteors that streak across now and then.
function ShootingStars({ count = 3 }) {
  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 6), 3));
    g.setAttribute('aAlpha', new THREE.BufferAttribute(new Float32Array(count * 2), 1));
    return g;
  }, [count]);
  const meteors = useMemo(() => Array.from({ length: count }, (_, i) => ({
    life: 0, duration: 1, wait: 1.5 + i * 2.2, start: new THREE.Vector3(), dir: new THREE.Vector3(), length: 2.5,
  })), [count]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const pos = geometry.attributes.position;
    const alpha = geometry.attributes.aAlpha;
    const rate = motionState.slide === 0 ? 1 : 0.35;
    meteors.forEach((m, i) => {
      if (m.wait > 0) {
        m.wait -= dt * rate;
        alpha.setX(i * 2, 0);
        alpha.setX(i * 2 + 1, 0);
        if (m.wait <= 0) {
          const side = Math.random() < 0.5 ? -1 : 1;
          m.start.set(-side * (3 + Math.random() * 7), 2 + Math.random() * 3.5, -3 - Math.random() * 5);
          m.dir.set(side, -0.35 - Math.random() * 0.3, 0.1).normalize();
          m.duration = 0.7 + Math.random() * 0.6;
          m.length = 1.8 + Math.random() * 2.2;
          m.life = 0;
        }
        return;
      }
      m.life += dt / m.duration;
      if (m.life >= 1) {
        m.wait = 2 + Math.random() * 5;
        return;
      }
      const travel = m.life * 14;
      const head = m.start.clone().addScaledVector(m.dir, travel);
      const tail = head.clone().addScaledVector(m.dir, -m.length * Math.min(1, m.life * 4));
      pos.setXYZ(i * 2, head.x, head.y, head.z);
      pos.setXYZ(i * 2 + 1, tail.x, tail.y, tail.z);
      const fade = Math.sin(m.life * Math.PI);
      alpha.setX(i * 2, fade);
      alpha.setX(i * 2 + 1, 0);
    });
    pos.needsUpdate = true;
    alpha.needsUpdate = true;
  });

  return (
    <lineSegments geometry={geometry} frustumCulled={false}>
      <shaderMaterial vertexShader={meteorVertex} fragmentShader={meteorFragment} {...additive} />
    </lineSegments>
  );
}

export default function Galaxy({ count, nebulaCount }) {
  const { camera, size, viewport } = useThree();
  const core = useRef();
  const stars = useMemo(() => buildStars(count), [count]);
  const nebula = useMemo(() => buildNebula(nebulaCount), [nebulaCount]);
  const helpers = useMemo(() => ({
    raycaster: new THREE.Raycaster(),
    plane: new THREE.Plane(new THREE.Vector3(0, 0, 1), 2),
    ndc: new THREE.Vector2(),
    hit: new THREE.Vector3(),
    euler: new THREE.Euler(),
    m4: new THREE.Matrix4(),
    center: new THREE.Vector3(),
  }), []);
  const shared = useMemo(() => ({
    uTime: { value: 0 },
    uIntro: { value: 0 },
    uFocus: { value: 1 },
    uSpin: { value: 0 },
    uScale: { value: 1 },
    uCenter: { value: new THREE.Vector3(0, -0.3, -2) },
    uOrient: { value: new THREE.Matrix3() },
    uMouse: { value: new THREE.Vector3(0, 0, -2) },
    uMouseStrength: { value: 0 },
  }), []);
  const starUniforms = useMemo(() => ({ ...shared, uSize: { value: 30 } }), [shared]);
  const nebulaUniforms = useMemo(() => ({ ...shared, uSize: { value: 30 } }), [shared]);
  const coreUniforms = useMemo(() => ({ uGlow: { value: 0 }, uTime: shared.uTime }), [shared]);

  const drag = useRef({ x: 0, y: 0, vx: 0, vy: 0, down: false, lastX: 0, lastY: 0 });

  // Drag anywhere that isn't a link, button or text-heavy panel to spin the galaxy and planet; it keeps coasting after release.
  useEffect(() => {
    const d = drag.current;
    const onDown = (e) => {
      if (e.target.closest('a, button, .planet-info, .contact-content, .menu-overlay')) return;
      d.down = true; d.lastX = e.clientX; d.lastY = e.clientY;
    };
    const onMove = (e) => {
      if (!d.down) return;
      d.vx = (e.clientX - d.lastX) * 0.006;
      d.vy = (e.clientY - d.lastY) * 0.006;
      d.lastX = e.clientX; d.lastY = e.clientY;
      d.x += d.vx; d.y = clamp(d.y + d.vy, -1.2, 1.2);
    };
    const onUp = () => { d.down = false; };
    window.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, []);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const d = drag.current;
    if (!d.down) {
      d.x += d.vx; d.y = clamp(d.y + d.vy, -1.2, 1.2);
      d.vx *= 0.95; d.vy *= 0.95;
      d.y = damp(d.y, 0, 0.6, dt);
    } else { d.vx *= 0.8; d.vy *= 0.8; }
    motionState.dragX = d.x;
    motionState.dragY = d.y;

    const hero = motionState.slide === 0;
    const wide = size.width / size.height > 1;
    shared.uTime.value += dt * (prefersReducedMotion() ? 0.25 : 1);
    shared.uIntro.value = motionState.intro;
    shared.uFocus.value = damp(shared.uFocus.value, hero ? 1 : 0, 2.5, dt);
    shared.uSpin.value = d.x;
    shared.uScale.value = damp(shared.uScale.value, hero ? (wide ? 1 : 0.8) : 0.72, 2.5, dt);
    helpers.center.set(0, hero ? -0.3 : -0.8, hero ? -2 : -5);
    shared.uCenter.value.lerp(helpers.center, 1 - Math.exp(-2.5 * dt));
    helpers.euler.set(TILT + d.y + motionState.pointer.y * 0.06, 0, motionState.pointer.x * -0.08);
    shared.uOrient.value.setFromMatrix4(helpers.m4.makeRotationFromEuler(helpers.euler));

    starUniforms.uSize.value = 0.05 * size.height * 0.5 * viewport.dpr;
    nebulaUniforms.uSize.value = 0.05 * size.height * 0.5 * viewport.dpr;

    helpers.ndc.set(motionState.pointer.x, -motionState.pointer.y);
    helpers.raycaster.setFromCamera(helpers.ndc, camera);
    if (helpers.raycaster.ray.intersectPlane(helpers.plane, helpers.hit)) {
      shared.uMouse.value.lerp(helpers.hit, 1 - Math.exp(-6 * dt));
    }
    shared.uMouseStrength.value = damp(shared.uMouseStrength.value, motionState.pointer.active && hero ? 1 : 0, 2, dt);

    // Core swells as the galaxy gathers, then settles into a slow pulse.
    const intro = motionState.intro;
    const flash = Math.sin(Math.min(intro * 1.6, 1) * Math.PI);
    coreUniforms.uGlow.value = Math.min(intro * 2, 1) * (0.42 + flash * 0.5) * (0.6 + shared.uFocus.value * 0.4);
    if (core.current) {
      core.current.position.copy(shared.uCenter.value);
      core.current.quaternion.copy(camera.quaternion);
      core.current.scale.setScalar(shared.uScale.value * (1 + flash * 0.4));
    }
  });

  return (
    <group>
      <StarSky count={size.width < 768 ? 900 : 2200} />
      <points frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[nebula.positions, 3]} />
          <bufferAttribute attach="attributes-aColor" args={[nebula.colors, 3]} />
          <bufferAttribute attach="attributes-aRandom" args={[nebula.random, 4]} />
        </bufferGeometry>
        <shaderMaterial uniforms={nebulaUniforms} vertexShader={nebulaVertex} fragmentShader={nebulaFragment} {...additive} />
      </points>
      <points frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[stars.positions, 3]} />
          <bufferAttribute attach="attributes-aColor" args={[stars.colors, 3]} />
          <bufferAttribute attach="attributes-aRandom" args={[stars.random, 4]} />
        </bufferGeometry>
        <shaderMaterial uniforms={starUniforms} vertexShader={starVertex} fragmentShader={starFragment} {...additive} />
      </points>
      <mesh ref={core} frustumCulled={false}>
        <planeGeometry args={[4.5, 4.5]} />
        <shaderMaterial uniforms={coreUniforms} vertexShader={coreVertex} fragmentShader={coreFragment} {...additive} />
      </mesh>
      <ShootingStars />
    </group>
  );
}
