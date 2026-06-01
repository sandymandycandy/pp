const SUIT = "#e9e4d9";
const SUIT_DARK = "#b8b3a6";
const PACK = "#23252d";
const ACCENT = "#ff5a1f";
const VISOR = "#0a0b10";

/** Presentational astronaut built from primitives. Positioning/animation handled by the parent. */
export default function AstronautModel() {
  return (
    <group>
      {/* helmet */}
      <mesh position={[0, 0.62, 0]}>
        <sphereGeometry args={[0.34, 48, 48]} />
        <meshStandardMaterial color={SUIT} roughness={0.55} metalness={0.05} />
      </mesh>
      {/* visor */}
      <mesh position={[0, 0.6, 0.12]} scale={[1, 0.82, 0.8]}>
        <sphereGeometry args={[0.27, 40, 40]} />
        <meshStandardMaterial color={VISOR} roughness={0.08} metalness={0.95} />
      </mesh>
      <mesh position={[-0.09, 0.66, 0.3]} rotation={[0, 0.4, 0.5]}>
        <planeGeometry args={[0.04, 0.16]} />
        <meshStandardMaterial color={ACCENT} emissive={ACCENT} emissiveIntensity={1.4} toneMapped={false} />
      </mesh>

      {/* torso */}
      <mesh position={[0, 0.16, 0]}>
        <capsuleGeometry args={[0.26, 0.34, 8, 20]} />
        <meshStandardMaterial color={SUIT} roughness={0.6} metalness={0.05} />
      </mesh>
      <mesh position={[0, 0.22, 0.24]}>
        <boxGeometry args={[0.2, 0.13, 0.05]} />
        <meshStandardMaterial color={PACK} roughness={0.4} metalness={0.3} />
      </mesh>
      <mesh position={[-0.04, 0.24, 0.27]}>
        <boxGeometry args={[0.03, 0.03, 0.02]} />
        <meshStandardMaterial color={ACCENT} emissive={ACCENT} emissiveIntensity={1.2} toneMapped={false} />
      </mesh>

      {/* backpack */}
      <mesh position={[0, 0.2, -0.26]}>
        <boxGeometry args={[0.42, 0.52, 0.22]} />
        <meshStandardMaterial color={PACK} roughness={0.5} metalness={0.25} />
      </mesh>

      {/* arms */}
      <group rotation={[0, 0, 0.5]} position={[-0.3, 0.28, 0]}>
        <mesh>
          <capsuleGeometry args={[0.1, 0.34, 6, 14]} />
          <meshStandardMaterial color={SUIT} roughness={0.6} metalness={0.05} />
        </mesh>
        <mesh position={[0, -0.28, 0]}>
          <sphereGeometry args={[0.11, 20, 20]} />
          <meshStandardMaterial color={ACCENT} roughness={0.5} />
        </mesh>
      </group>
      <group rotation={[0, 0, -0.5]} position={[0.3, 0.28, 0]}>
        <mesh>
          <capsuleGeometry args={[0.1, 0.34, 6, 14]} />
          <meshStandardMaterial color={SUIT} roughness={0.6} metalness={0.05} />
        </mesh>
        <mesh position={[0, -0.28, 0]}>
          <sphereGeometry args={[0.11, 20, 20]} />
          <meshStandardMaterial color={ACCENT} roughness={0.5} />
        </mesh>
      </group>

      {/* legs */}
      <group position={[-0.14, -0.38, 0]} rotation={[0, 0, 0.08]}>
        <mesh>
          <capsuleGeometry args={[0.12, 0.4, 6, 14]} />
          <meshStandardMaterial color={SUIT} roughness={0.6} metalness={0.05} />
        </mesh>
        <mesh position={[0, -0.32, 0.04]}>
          <boxGeometry args={[0.16, 0.12, 0.22]} />
          <meshStandardMaterial color={ACCENT} roughness={0.5} />
        </mesh>
      </group>
      <group position={[0.14, -0.38, 0]} rotation={[0, 0, -0.08]}>
        <mesh>
          <capsuleGeometry args={[0.12, 0.4, 6, 14]} />
          <meshStandardMaterial color={SUIT_DARK} roughness={0.6} metalness={0.05} />
        </mesh>
        <mesh position={[0, -0.32, 0.04]}>
          <boxGeometry args={[0.16, 0.12, 0.22]} />
          <meshStandardMaterial color={ACCENT} roughness={0.5} />
        </mesh>
      </group>
    </group>
  );
}
