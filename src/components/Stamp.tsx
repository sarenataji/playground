import { Canvas, useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Group } from "three";
import { pointer } from "@/lib/pointer";

function Face() {
  const ref = useRef<Group>(null);
  useFrame(() => {
    const g = ref.current;
    if (!g) return;
    g.rotation.y += (pointer.x * 0.55 - g.rotation.y) * 0.08;
    g.rotation.x += (-pointer.y * 0.4 - g.rotation.x) * 0.08;
  });

  return (
    <group ref={ref}>
      <mesh>
        <torusGeometry args={[0.72, 0.045, 16, 64]} />
        <meshStandardMaterial color="#161412" roughness={0.45} metalness={0.1} />
      </mesh>
      <mesh position={[-0.22, 0.12, 0.02]}>
        <sphereGeometry args={[0.055, 16, 16]} />
        <meshStandardMaterial color="#161412" />
      </mesh>
      <mesh position={[0.22, 0.12, 0.02]}>
        <sphereGeometry args={[0.055, 16, 16]} />
        <meshStandardMaterial color="#161412" />
      </mesh>
      <mesh position={[0, -0.18, 0.02]} rotation={[0, 0, Math.PI]}>
        <torusGeometry args={[0.22, 0.04, 8, 24, Math.PI]} />
        <meshStandardMaterial color="#161412" />
      </mesh>
    </group>
  );
}

export function Stamp() {
  return (
    <div className="stamp" aria-hidden>
      <svg className="stamp-ring" viewBox="0 0 200 200">
        <defs>
          <path id="stampArc" d="M100,100 m-78,0 a78,78 0 1,1 156,0 a78,78 0 1,1 -156,0" />
        </defs>
        <text className="stamp-type">
          <textPath href="#stampArc" startOffset="0%">
            YOU ARE SAFE HERE · REST · YOU ARE SAFE HERE ·
          </textPath>
        </text>
      </svg>
      <div className="stamp-gl">
        <Canvas
          camera={{ position: [0, 0, 2.4], fov: 35 }}
          gl={{ antialias: true, alpha: true }}
          dpr={[1, 1.5]}
        >
          <ambientLight intensity={1.1} />
          <directionalLight position={[2, 2, 4]} intensity={1.4} />
          <Face />
        </Canvas>
      </div>
    </div>
  );
}
