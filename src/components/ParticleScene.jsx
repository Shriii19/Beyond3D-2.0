import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial, Float } from '@react-three/drei';
import * as THREE from 'three';

// The site uses procedural geometry instead of copied imagery from the reference.
const pointer = { x: 0, y: 0 };

export function updateScenePointer(x, y) {
  pointer.x = x;
  pointer.y = y;
}

function ParticleTorus({ count = 7200 }) {
  const points = useRef();
  const particles = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const colorA = new THREE.Color('#1f5eff');
    const colorB = new THREE.Color('#8feaff');
    const colorC = new THREE.Color('#6674bd');

    for (let i = 0; i < count; i += 1) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI * 2;
      const major = 2.02 + (Math.random() - 0.5) * 0.34;
      const minor = 0.38 + Math.random() * 0.6;
      const wobble = (Math.random() - 0.5) * 0.28;
      const radius = major + Math.cos(phi) * minor;
      positions[i * 3] = Math.cos(theta) * radius;
      positions[i * 3 + 1] = Math.sin(phi) * minor * 0.88 + wobble;
      positions[i * 3 + 2] = Math.sin(theta) * radius;

      const colorMix = Math.random();
      const color = colorMix > 0.65 ? colorB : colorMix > 0.2 ? colorA : colorC;
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }
    return { positions, colors };
  }, [count]);

  useFrame((state, delta) => {
    if (!points.current) return;
    points.current.rotation.y += delta * 0.035;
    points.current.rotation.x = THREE.MathUtils.damp(
      points.current.rotation.x,
      0.32 + pointer.y * 0.15,
      2.2,
      delta,
    );
    points.current.rotation.z = THREE.MathUtils.damp(
      points.current.rotation.z,
      pointer.x * 0.1,
      1.8,
      delta,
    );
    points.current.position.x = THREE.MathUtils.damp(
      points.current.position.x,
      pointer.x * 0.16,
      2,
      delta,
    );
  });

  return (
    <points ref={points} rotation={[0.3, 0, -0.12]}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[particles.positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[particles.colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.021}
        sizeAttenuation
        vertexColors
        transparent
        opacity={0.83}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

function OrbitLines() {
  const mesh = useRef();
  const geometry = useMemo(() => {
    const points = [];
    const sections = 96;
    for (let i = 0; i < sections; i += 1) {
      const a = (i / sections) * Math.PI * 2;
      const b = ((i + 1) / sections) * Math.PI * 2;
      const r1 = 2.18 + Math.sin(a * 7) * 0.12;
      const r2 = 2.18 + Math.sin(b * 7) * 0.12;
      points.push(
        Math.cos(a) * r1, Math.sin(a * 3) * 0.36, Math.sin(a) * r1,
        Math.cos(b) * r2, Math.sin(b * 3) * 0.36, Math.sin(b) * r2,
      );
    }
    const buffer = new THREE.BufferGeometry();
    buffer.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
    return buffer;
  }, []);

  useFrame((state, delta) => {
    if (mesh.current) mesh.current.rotation.y -= delta * 0.018;
  });

  return (
    <lineSegments ref={mesh} geometry={geometry} rotation={[0.48, 0.15, 0.08]}>
      <lineBasicMaterial color="#68b8ff" transparent opacity={0.14} />
    </lineSegments>
  );
}

function Dust({ count = 1500 }) {
  const ref = useRef();
  const positions = useMemo(() => {
    const values = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      values[i * 3] = (Math.random() - 0.5) * 17;
      values[i * 3 + 1] = (Math.random() - 0.5) * 10;
      values[i * 3 + 2] = (Math.random() - 0.5) * 8 - 1;
    }
    return values;
  }, [count]);

  useFrame((state, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.004;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.012} color="#7196ca" transparent opacity={0.48} depthWrite={false} />
    </points>
  );
}

function Core() {
  const ref = useRef();
  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 0.08;
      ref.current.rotation.x += delta * 0.025;
    }
  });
  return (
    <mesh ref={ref} scale={1.35}>
      <icosahedronGeometry args={[1, 2]} />
      <meshBasicMaterial color="#6dbbff" wireframe transparent opacity={0.055} />
    </mesh>
  );
}

export default function ParticleScene() {
  return (
    <div className="particle-scene" aria-hidden="true">
      <Canvas
        dpr={[1, 1.6]}
        camera={{ position: [0, 0, 8.6], fov: 45 }}
        gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
        fallback={<div className="scene-fallback" />}
      >
        <ambientLight intensity={0.4} />
        <pointLight position={[2, 2, 4]} color="#76dcff" intensity={3} />
        <Float speed={0.55} rotationIntensity={0.08} floatIntensity={0.12}>
          <group scale={0.96}>
            <ParticleTorus />
            <OrbitLines />
            <Core />
          </group>
        </Float>
        <Dust />
      </Canvas>
    </div>
  );
}
