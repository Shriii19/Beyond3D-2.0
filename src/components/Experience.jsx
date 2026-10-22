import { useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import { getLenis, isStacked, motionState } from '../lib/motionState.js';
import Galaxy, { seeded } from './Galaxy.jsx';
import SolarSystem, { CAMERA_Z_SIDE, CAMERA_Z_STACKED } from './SolarSystem.jsx';

// One persistent scene sits behind the whole page: the galaxy fills the hero,
// then recedes behind the Sun and planets as the journey travels outward.

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
    u.uTime.value += dt;
    u.uTravel.value = damp(u.uTravel.value, motionState.progress * 240, 1.6, dt);
    u.uStretch.value = damp(u.uStretch.value, 0.05 + velocity * 0.06 + motionState.warp * 9, 6, dt);
    u.uOpacity.value = damp(u.uOpacity.value, 0.4 + motionState.warp * 0.6, 6, dt);
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

    if (motionState.slide === 0) {
      target.a.set(Math.sin(t * 0.07) * 0.9, (wide ? 3.2 : 4) + Math.sin(t * 0.05) * 0.3, wide ? 12.5 : 17);
      target.pos.set(0, 11, -1.2).lerp(target.a, intro);
      target.look.set(0, -0.3, -2).lerp(target.a.set(0, -0.6, -2), intro);
    } else {
      target.pos.set(0, 0.3, isStacked() ? CAMERA_Z_STACKED : CAMERA_Z_SIDE);
      target.look.set(0, 0, -1);
    }
    target.pos.x += motionState.pointer.x * 0.35;
    target.pos.y -= motionState.pointer.y * 0.25;

    const k = 1 - Math.exp(-(motionState.intro < 1 ? 6 : 2.2) * dt);
    camera.position.lerp(target.pos, k);
    look.current.lerp(target.look, k);
    camera.lookAt(look.current);

    // Field-of-view punch during the light-speed jump.
    const fov = 45 + motionState.warp * 22;
    if (Math.abs(camera.fov - fov) > 0.01) {
      camera.fov = damp(camera.fov, fov, 6, dt);
      camera.updateProjectionMatrix();
    }
  });
  return null;
}

function Effects() {
  const bloom = useRef();

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    if (bloom.current) bloom.current.intensity = damp(bloom.current.intensity, motionState.slide === 0 ? 1.15 : 0.95, 3, dt);
  });

  return (
    <EffectComposer multisampling={0} disableNormalPass>
      <Bloom ref={bloom} intensity={0.8} luminanceThreshold={0.2} luminanceSmoothing={0.35} radius={0.6} levels={4} />
      <Vignette offset={0.28} darkness={0.78} />
    </EffectComposer>
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
        <SolarSystem />
        <WarpStars count={narrow ? 400 : 900} />
        <Effects />
      </Canvas>
    </div>
  );
}
