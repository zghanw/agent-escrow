import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { StatusName } from "@/lib/contract";

// SEED: established with the user before implementation; re-run
// `/impeccable document` once this build settles. Direction: the escrow
// contract as a physical containment vault, not a progress bar - a
// wireframe shell holds a glowing orb (the locked BOT), a scanning ring
// appears while a bounty is Accepted or Submitted, the shell opens and the orb escapes
// on Released, or the shell seals red and the orb shrinks back on
// Refunded or Cancelled. Pure function of on-chain status - no timers, no phases,
// so it can never drift from what the contract actually says. Confirmed
// with the user as the "no limits" build for stage 4 over a 2D/CSS
// alternative.

const GOLD = new THREE.Color("#ffc700");
const RED = new THREE.Color("#ef4444");

interface VaultTargets {
  shellScale: number;
  shellOpacity: number;
  ringOpacity: number;
  orbScale: number;
  orbY: number;
  toRed: number; // 0 = gold, 1 = red
}

function targetsFor(status: StatusName | null): VaultTargets {
  switch (status) {
    case "Accepted":
      return { shellScale: 1.12, shellOpacity: 0.9, ringOpacity: 1, orbScale: 0.62, orbY: 0, toRed: 0 };
    case "Submitted":
      return { shellScale: 1.22, shellOpacity: 0.72, ringOpacity: 1, orbScale: 0.68, orbY: 0.08, toRed: 0 };
    case "Released":
      return { shellScale: 1.5, shellOpacity: 0.12, ringOpacity: 0, orbScale: 0, orbY: 1.5, toRed: 0 };
    case "Refunded":
    case "Cancelled":
      return { shellScale: 0.88, shellOpacity: 0.9, ringOpacity: 0, orbScale: 0.32, orbY: -0.08, toRed: 1 };
    case "Open":
    default:
      return { shellScale: 1, shellOpacity: 0.85, ringOpacity: 0, orbScale: 0.5, orbY: 0, toRed: 0 };
  }
}

function VaultScene({ status, busy }: { status: StatusName | null; busy: boolean }) {
  const shellRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const orbRef = useRef<THREE.Mesh>(null);
  const current = useRef<VaultTargets>({ shellScale: 1, shellOpacity: 0.85, ringOpacity: 0, orbScale: 0.5, orbY: 0, toRed: 0 });
  const reduceMotion = useMemo(() => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false, []);

  useFrame((state, delta) => {
    const target = targetsFor(status);
    const smooth = reduceMotion ? 0.05 : 0.35;
    const c = current.current;
    c.shellScale += (target.shellScale - c.shellScale) * Math.min(delta / smooth, 1);
    c.shellOpacity += (target.shellOpacity - c.shellOpacity) * Math.min(delta / smooth, 1);
    c.ringOpacity += (target.ringOpacity - c.ringOpacity) * Math.min(delta / smooth, 1);
    c.orbScale += (target.orbScale - c.orbScale) * Math.min(delta / smooth, 1);
    c.orbY += (target.orbY - c.orbY) * Math.min(delta / smooth, 1);
    c.toRed += (target.toRed - c.toRed) * Math.min(delta / smooth, 1);

    const t = state.clock.elapsedTime;
    const idleBob = reduceMotion ? 0 : Math.sin(t * 1.4) * 0.03;
    const spinSpeed = reduceMotion
      ? 0
      : status === "Accepted" || status === "Submitted"
        ? 0.9
        : busy
          ? 0.6
          : 0.18;

    if (shellRef.current) {
      shellRef.current.rotation.y += delta * spinSpeed;
      shellRef.current.rotation.x = Math.sin(t * 0.3) * 0.15;
      shellRef.current.scale.setScalar(c.shellScale);
      const mat = shellRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = c.shellOpacity;
      mat.color.copy(GOLD).lerp(RED, c.toRed);
    }
    if (ringRef.current) {
      ringRef.current.rotation.z += delta * 1.6;
      const mat = ringRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = c.ringOpacity * 0.8;
    }
    if (orbRef.current) {
      orbRef.current.position.y = c.orbY + idleBob;
      orbRef.current.scale.setScalar(Math.max(c.orbScale, 0.0001));
      const mat = orbRef.current.material as THREE.MeshStandardMaterial;
      mat.color.copy(GOLD).lerp(RED, c.toRed);
      mat.emissive.copy(GOLD).lerp(RED, c.toRed);
      mat.emissiveIntensity = 1.4 + Math.sin(t * 2.2) * 0.3;
    }
  });

  return (
    <>
      <ambientLight intensity={0.35} />
      <pointLight position={[2, 2, 3]} intensity={40} color="#ffc700" />
      <pointLight position={[-2, -1, -2]} intensity={12} color="#60a5fa" />

      <mesh ref={shellRef}>
        <icosahedronGeometry args={[1, 0]} />
        <meshBasicMaterial color={GOLD} wireframe transparent opacity={0.85} />
      </mesh>

      <mesh ref={ringRef} rotation={[Math.PI / 2.4, 0, 0]}>
        <torusGeometry args={[1.35, 0.015, 8, 64]} />
        <meshBasicMaterial color="#60a5fa" transparent opacity={0} />
      </mesh>

      <mesh ref={orbRef}>
        <sphereGeometry args={[0.5, 24, 24]} />
        <meshStandardMaterial color={GOLD} emissive={GOLD} emissiveIntensity={1.4} roughness={0.2} metalness={0.1} />
      </mesh>
    </>
  );
}

export function Vault({ status, busy }: { status: StatusName | null; busy: boolean }) {
  return (
    <div className="vault-frame relative">
      <span className="verify-bracket verify-bracket-tl" aria-hidden="true" />
      <span className="verify-bracket verify-bracket-br" aria-hidden="true" />
      <Canvas
        camera={{ position: [0, 0.3, 3.4], fov: 45 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
        aria-hidden="true"
      >
        <VaultScene status={status} busy={busy} />
      </Canvas>
    </div>
  );
}
