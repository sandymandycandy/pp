"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Stars, useTexture } from "@react-three/drei";
import { Suspense, useEffect, useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import AstronautModel from "./AstronautModel";
import { createPlanetTexture } from "./planetTexture";
import { planets, decor, GAP, PlanetCfg } from "@/lib/planets";

const lerp  = THREE.MathUtils.lerp;
const clamp = THREE.MathUtils.clamp;

/** Smoothstep from edge a→b at value t */
function smooth(a: number, b: number, t: number) {
  const x = clamp((t - a) / (b - a), 0, 1);
  return x * x * (3 - 2 * x);
}

/* ────────────────────────────────────────────────────────────
   LANDING CHOREOGRAPHY CONSTANTS
   ────────────────────────────────────────────────────────────
   Scroll is divided into:
     0.00–0.10  Boot launch (clock-driven, no scroll)
     0.00–0.13  Boarding  (astronaut walks to rocket)
     0.13–1.00  Journey   (rocket visits each planet: approach→land→surface→liftoff)

   The journey (0.13→1.0) is split into 5 equal segments (planets[1]…planets[5]).
   Within each segment [0→1]:
     0.00–0.38  APPROACH — arc toward planet
     0.38–0.60  DESCEND  — slow final descent, engines braking
     0.60–0.74  SURFACE  — engines off, gentle bob on surface
     0.74–1.00  LIFTOFF  — engines ignite, rise and arc to next planet
───────────────────────────────────────────────────────────── */
const BOARDING_END  = 0.13;
const N_JOURNEY     = planets.length - 1; // 5 visits (skip Earth)
const SEG           = (1 - BOARDING_END) / N_JOURNEY;

/** Compute landing spot for a planet: on the inner face facing the center */
function landingPos(cfg: PlanetCfg): THREE.Vector3 {
  const isLeft = cfg.x < 0;
  const pad = 0.65; // gap between planet surface and rocket body center
  const lx = isLeft
    ? cfg.x + cfg.radius + pad   // land on right face of left planet
    : cfg.x - cfg.radius - pad;  // land on left face of right planet
  return new THREE.Vector3(lx, cfg.yOff ?? 0, cfg.z + 2.5);
}

/** Pre-compute approach position (comes in from the center side) */
function approachPos(cfg: PlanetCfg): THREE.Vector3 {
  const lp = landingPos(cfg);
  const isLeft = cfg.x < 0;
  return new THREE.Vector3(lp.x + (isLeft ? 2.5 : -2.5), lp.y + 2.0, lp.z);
}

/** Pre-compute liftoff position (rises then arcs away) */
function liftoffPos(cfg: PlanetCfg): THREE.Vector3 {
  const lp = landingPos(cfg);
  const isLeft = cfg.x < 0;
  return new THREE.Vector3(lp.x + (isLeft ? 1.5 : -1.5), lp.y + 3.5, lp.z);
}

/** Rotation Z when sitting on a planet surface (tilts toward it) */
function landingRollZ(cfg: PlanetCfg): number {
  return cfg.x < 0 ? -0.22 : 0.22;
}

/* ─── Pre-cache per-planet landing data (computed once) ─── */
const PLANET_LANDING = planets.slice(1).map((cfg) => ({
  land:     landingPos(cfg),
  approach: approachPos(cfg),
  liftoff:  liftoffPos(cfg),
  rollZ:    landingRollZ(cfg),
}));

/* ────────────────────────────────────────────────────────────
   GLOW SPRITE TEXTURE (shared, cached)
───────────────────────────────────────────────────────────── */
let GLOW_TEX: THREE.CanvasTexture | null = null;
function glowTexture() {
  if (GLOW_TEX) return GLOW_TEX;
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0,   "rgba(255,255,255,1)");
  g.addColorStop(0.3, "rgba(255,255,255,0.5)");
  g.addColorStop(0.7, "rgba(255,255,255,0.1)");
  g.addColorStop(1,   "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  GLOW_TEX = new THREE.CanvasTexture(c);
  return GLOW_TEX;
}

/* ─── Atmosphere glow sprite ─── */
function Atmosphere({ color, radius }: { color: string; radius: number }) {
  const tex = useMemo(() => glowTexture(), []);
  return (
    <sprite scale={radius * 3.6}>
      <spriteMaterial
        map={tex} color={color}
        blending={THREE.AdditiveBlending}
        transparent opacity={0.72}
        depthWrite={false}
      />
    </sprite>
  );
}

/* ─── Real (textured) planet ─── */
function RealPlanet({ cfg, index }: { cfg: PlanetCfg; index: number }) {
  const spin = useRef<THREE.Mesh>(null!);
  const urls = useMemo(() => {
    const a: string[] = [cfg.map!];
    if (cfg.clouds) a.push(cfg.clouds);
    if (cfg.normal) a.push(cfg.normal);
    if (cfg.ring)   a.push(cfg.ring);
    return a;
  }, [cfg]);
  const textures = useTexture(urls);

  let i = 1;
  const map    = textures[0];
  const clouds = cfg.clouds ? textures[i++] : undefined;
  const normal = cfg.normal ? textures[i++] : undefined;
  const ring   = cfg.ring   ? textures[i++] : undefined;

  useMemo(() => {
    map.colorSpace = THREE.SRGBColorSpace;
    if (clouds) clouds.colorSpace = THREE.SRGBColorSpace;
    if (ring)   ring.colorSpace   = THREE.SRGBColorSpace;
  }, [map, clouds, ring]);

  const ringGeo = useMemo(() => {
    if (!cfg.ring) return null;
    const inner = cfg.radius * 1.3, outer = cfg.radius * 2.45;
    const g = new THREE.RingGeometry(inner, outer, 128, 1);
    const pos = g.attributes.position, uv = g.attributes.uv, v = new THREE.Vector3();
    for (let k = 0; k < pos.count; k++) {
      v.fromBufferAttribute(pos, k);
      uv.setXY(k, (v.length() - inner) / (outer - inner), 1);
    }
    return g;
  }, [cfg]);

  useFrame((_, d) => { if (spin.current) spin.current.rotation.y += cfg.spin * d; });

  return (
    <group position={[cfg.x, -index * GAP + (cfg.yOff ?? 0), cfg.z]}>
      <mesh ref={spin}>
        <sphereGeometry args={[cfg.radius, 80, 80]} />
        <meshStandardMaterial map={map} normalMap={normal} roughness={0.78} metalness={0.05} />
      </mesh>
      {clouds && (
        <mesh scale={1.012}>
          <sphereGeometry args={[cfg.radius, 64, 64]} />
          <meshStandardMaterial map={clouds} transparent opacity={0.88} depthWrite={false} />
        </mesh>
      )}
      {ring && ringGeo && (
        <mesh geometry={ringGeo} rotation={[-Math.PI / 2.3, 0, 0.3]}>
          <meshBasicMaterial
            map={ring} color="#edd89a"
            transparent side={THREE.DoubleSide}
            depthWrite={false} opacity={0.96}
          />
        </mesh>
      )}
      <Atmosphere color={cfg.atmo} radius={cfg.radius} />
    </group>
  );
}

/* ─── Procedural planet ─── */
function ProcPlanet({ cfg, index }: { cfg: PlanetCfg; index: number }) {
  const spin = useRef<THREE.Mesh>(null!);
  const tex  = useMemo(
    () => createPlanetTexture({ type: cfg.kind === "gas" ? "gas" : "rocky", dark: cfg.dark!, light: cfg.light!, bands: cfg.bands }),
    [cfg]
  );
  useFrame((_, d) => { if (spin.current) spin.current.rotation.y += cfg.spin * d; });
  return (
    <group position={[cfg.x, -index * GAP + (cfg.yOff ?? 0), cfg.z]}>
      <mesh ref={spin}>
        <sphereGeometry args={[cfg.radius, 80, 80]} />
        <meshStandardMaterial map={tex} roughness={cfg.kind === "gas" ? 0.65 : 0.9} metalness={0.04} />
      </mesh>
      <Atmosphere color={cfg.atmo} radius={cfg.radius} />
    </group>
  );
}

function Planet({ cfg, index }: { cfg: PlanetCfg; index: number }) {
  return cfg.kind === "real"
    ? <RealPlanet cfg={cfg} index={index} />
    : <ProcPlanet cfg={cfg} index={index} />;
}

function DecorPlanet({ d }: { d: (typeof decor)[number] }) {
  const tex = useTexture(d.map);
  useMemo(() => { tex.colorSpace = THREE.SRGBColorSpace; }, [tex]);
  return (
    <mesh position={[d.x, d.y, d.z]}>
      <sphereGeometry args={[d.radius, 36, 36]} />
      <meshStandardMaterial map={tex} roughness={0.88} metalness={0} />
    </mesh>
  );
}

/* ════════════════════════════════════════════════════════════
   REALISTIC ROCKET MODEL
════════════════════════════════════════════════════════════ */
type RocketRefs = {
  flameRef:   RefObject<THREE.Mesh | null>;
  flame2Ref:  RefObject<THREE.Mesh | null>;
  flame3Ref:  RefObject<THREE.Mesh | null>;
  flameMat1:  RefObject<THREE.MeshBasicMaterial | null>;
  flameMat2:  RefObject<THREE.MeshBasicMaterial | null>;
  flameMat3:  RefObject<THREE.MeshBasicMaterial | null>;
  lightRef:   RefObject<THREE.PointLight | null>;
};

function RealRocket({ flameRef, flame2Ref, flame3Ref, flameMat1, flameMat2, flameMat3, lightRef }: RocketRefs) {
  const BODY   = "#d8d4cc";
  const ORANGE = "#ff5a1f";
  const DARK   = "#1a1c22";
  const MID    = "#2e313a";
  const STRIPE = "#c2bdb0";
  const NOZZLE = "#3a3d47";

  return (
    <group>
      {/* Body */}
      <mesh>
        <cylinderGeometry args={[0.42, 0.45, 2.6, 32]} />
        <meshPhysicalMaterial color={BODY} metalness={0.55} roughness={0.35} clearcoat={0.65} clearcoatRoughness={0.2} />
      </mesh>

      {/* Fuel band rings */}
      {[-0.7, 0, 0.7].map((y, i) => (
        <mesh key={i} position={[0, y, 0]}>
          <torusGeometry args={[0.455, 0.026, 10, 32]} />
          <meshPhysicalMaterial color={i === 1 ? ORANGE : STRIPE} metalness={0.7} roughness={0.3} />
        </mesh>
      ))}

      {/* Nose cone */}
      <mesh position={[0, 2.0, 0]}>
        <coneGeometry args={[0.42, 1.2, 32]} />
        <meshPhysicalMaterial color={ORANGE} metalness={0.4} roughness={0.38} clearcoat={0.5} />
      </mesh>
      {/* Nose tip */}
      <mesh position={[0, 2.68, 0]}>
        <sphereGeometry args={[0.065, 16, 16]} />
        <meshPhysicalMaterial color={DARK} metalness={0.92} roughness={0.08} />
      </mesh>

      {/* Cockpit window */}
      <mesh position={[0, 0.6, 0.44]}>
        <circleGeometry args={[0.2, 36]} />
        <meshPhysicalMaterial color="#081520" metalness={0.95} roughness={0.04} emissive="#1a5aaa" emissiveIntensity={0.8} />
      </mesh>
      <mesh position={[0, 0.6, 0.435]}>
        <torusGeometry args={[0.21, 0.033, 12, 36]} />
        <meshPhysicalMaterial color={STRIPE} metalness={0.8} roughness={0.25} />
      </mesh>
      <pointLight position={[0, 0.6, 0.65]} color="#4488ff" intensity={1.0} distance={2} />

      {/* Mission patch */}
      <mesh position={[0.435, 0.12, 0.1]} rotation={[0, -Math.PI / 2.5, 0]}>
        <circleGeometry args={[0.13, 20]} />
        <meshStandardMaterial color={ORANGE} emissive={ORANGE} emissiveIntensity={0.5} />
      </mesh>

      {/* Interstage skirt */}
      <mesh position={[0, -1.45, 0]}>
        <cylinderGeometry args={[0.55, 0.63, 0.32, 32]} />
        <meshPhysicalMaterial color={MID} metalness={0.65} roughness={0.42} />
      </mesh>

      {/* Engine base plate */}
      <mesh position={[0, -1.72, 0]}>
        <cylinderGeometry args={[0.63, 0.58, 0.26, 32]} />
        <meshPhysicalMaterial color={DARK} metalness={0.78} roughness={0.45} />
      </mesh>

      {/* 3 Engine bells */}
      {[0, 1, 2].map((n) => {
        const angle = (n * Math.PI * 2) / 3;
        return (
          <group key={n} position={[Math.sin(angle) * 0.27, -2.0, Math.cos(angle) * 0.27]}>
            <mesh>
              <cylinderGeometry args={[0.09, 0.19, 0.38, 20]} />
              <meshPhysicalMaterial color={NOZZLE} metalness={0.82} roughness={0.48} />
            </mesh>
            <mesh position={[0, -0.2, 0]}>
              <torusGeometry args={[0.19, 0.016, 10, 20]} />
              <meshPhysicalMaterial color="#555" metalness={0.9} roughness={0.3} />
            </mesh>
          </group>
        );
      })}

      {/* 3 Delta fins */}
      {[0, 1, 2].map((n) => {
        const angle = (n * Math.PI * 2) / 3 + Math.PI / 6;
        return (
          <group key={n} rotation={[0, angle, 0]} position={[0, -1.2, 0]}>
            <mesh position={[0.54, -0.38, 0]} rotation={[0, 0, 0.58]}>
              <boxGeometry args={[0.065, 0.92, 0.58]} />
              <meshPhysicalMaterial color={ORANGE} metalness={0.45} roughness={0.5} />
            </mesh>
            <mesh position={[0.74, -0.62, 0]} rotation={[0, 0, 0.58]}>
              <boxGeometry args={[0.026, 0.58, 0.59]} />
              <meshPhysicalMaterial color={BODY} metalness={0.5} roughness={0.4} />
            </mesh>
          </group>
        );
      })}

      {/* Exhaust — 3 layer plume */}
      <mesh ref={flameRef} position={[0, -2.45, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.55, 2.4, 24]} />
        <meshBasicMaterial ref={flameMat1} color="#ff9a3f" transparent opacity={0}
          blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
      <mesh ref={flame2Ref} position={[0, -2.2, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.32, 1.7, 18]} />
        <meshBasicMaterial ref={flameMat2} color="#ffcc44" transparent opacity={0}
          blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
      <mesh ref={flame3Ref} position={[0, -2.05, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.15, 1.0, 14]} />
        <meshBasicMaterial ref={flameMat3} color="#fff8e0" transparent opacity={0}
          blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>

      <pointLight ref={lightRef} position={[0, -2.2, 0]} color="#ff7a1f" intensity={0} distance={10} />
    </group>
  );
}

/* ════════════════════════════════════════════════════════════
   SHIP — Full landing choreography
   
   Scroll 0→1:
     0.00–0.13  Boarding  (astronaut approaches rocket near Earth)
     0.13–1.00  Journey   (5 planet visits, each: APPROACH→DESCEND→SURFACE→LIFTOFF)
════════════════════════════════════════════════════════════ */
function Ship({ progress, bootLaunch }: {
  progress:   RefObject<number>;
  bootLaunch: RefObject<number>;
}) {
  const ship    = useRef<THREE.Group>(null!);
  const astro   = useRef<THREE.Group>(null!);
  const flame   = useRef<THREE.Mesh>(null);
  const flame2  = useRef<THREE.Mesh>(null);
  const flame3  = useRef<THREE.Mesh>(null);
  const mat1    = useRef<THREE.MeshBasicMaterial>(null);
  const mat2    = useRef<THREE.MeshBasicMaterial>(null);
  const mat3    = useRef<THREE.MeshBasicMaterial>(null);
  const light   = useRef<THREE.PointLight>(null);

  // Smoothed position for gentle motion
  const smoothedPos = useRef(new THREE.Vector3(4.0, -3.0, 6.5));
  const smoothedRot = useRef(new THREE.Euler());

  useFrame((state) => {
    if (!ship.current) return;

    const p  = clamp(progress.current ?? 0, 0, 1);
    const bl = clamp(bootLaunch.current ?? 0, 0, 1);
    const t  = state.clock.elapsedTime;

    // ── Pre-compute phases ──
    const boarding = smooth(0, BOARDING_END, p);           // 0→1 during boarding
    const journeyP = smooth(BOARDING_END, 1, p);           // 0→1 during journey

    // Which planet segment (0–4 → planet index 1–5)
    const rawSeg   = journeyP * N_JOURNEY;
    const segIdx   = clamp(Math.floor(rawSeg), 0, N_JOURNEY - 1);
    const segP     = rawSeg - segIdx;                      // 0→1 within current segment

    const ld = PLANET_LANDING[segIdx];

    // Sub-phase smoothsteps within each segment
    const sApproach = smooth(0,    0.38, segP);  // arc toward planet
    const sDescend  = smooth(0.38, 0.60, segP);  // slow final descent
    const sSurface  = smooth(0.60, 0.74, segP);  // on the surface
    const sLiftoff  = smooth(0.74, 1.00, segP);  // rise and arc away

    // ── Target position calculation ──
    let targetX: number, targetY: number, targetZ: number;
    let targetRollZ: number, targetRollX: number, targetRollY: number;
    let flameAmount: number;

    if (boarding < 0.99 && journeyP < 0.01) {
      // ── BOOT LAUNCH + BOARDING ──
      const launchY = lerp(-7, 0, bl);
      targetX   = lerp(4.5, 0.5, boarding) + Math.sin(t * 0.7) * 0.05 * boarding;
      targetY   = launchY + lerp(-0.5, 0.6, boarding) + Math.sin(t * 1.2) * 0.15 * boarding;
      targetZ   = 6.5;
      targetRollZ = lerp(0.22, -0.03, boarding);
      targetRollX = lerp(-0.12, 0, boarding);
      targetRollY = Math.sin(t * 0.35) * 0.1;
      flameAmount = Math.max(bl, boarding * 0.4);

    } else {
      // ── JOURNEY: APPROACH → DESCEND → SURFACE → LIFTOFF ──

      if (sDescend === 0 && sSurface === 0 && sLiftoff === 0) {
        // APPROACH phase — arc in from liftoff/boarding position toward approach point
        const prevPos = segIdx === 0
          ? new THREE.Vector3(0.5, 0.6, 6.5)        // first approach: from boarding hover
          : PLANET_LANDING[segIdx - 1].liftoff;      // subsequent: from previous liftoff

        targetX   = lerp(prevPos.x, ld.approach.x, sApproach) + Math.sin(t * 1.1) * 0.08 * (1 - sApproach);
        targetY   = lerp(prevPos.y, ld.approach.y, sApproach) + Math.sin(t * 1.4) * 0.12;
        targetZ   = lerp(prevPos.z, ld.approach.z, sApproach);
        // Bank toward the planet side
        targetRollZ = lerp(0, ld.rollZ * 0.6, sApproach);
        targetRollX = -0.05;
        targetRollY = Math.sin(t * 0.4) * 0.08;
        flameAmount = 0.75 + sApproach * 0.25;

      } else if (sLiftoff === 0 && sSurface === 0) {
        // DESCEND phase — slow, careful approach to surface
        targetX   = lerp(ld.approach.x, ld.land.x, sDescend);
        targetY   = lerp(ld.approach.y, ld.land.y, sDescend) + Math.sin(t * 0.8) * 0.04;
        targetZ   = lerp(ld.approach.z, ld.land.z, sDescend);
        // Tilt toward planet surface
        targetRollZ = lerp(ld.rollZ * 0.6, ld.rollZ, sDescend);
        targetRollX = lerp(-0.05, 0, sDescend);
        targetRollY = Math.sin(t * 0.3) * 0.05;
        // Heavy retrograde braking flame
        flameAmount = lerp(0.9, 0.35, sDescend);

      } else if (sLiftoff === 0) {
        // SURFACE phase — sitting on planet, engines off, gentle bob
        targetX   = ld.land.x + Math.sin(t * 0.6) * 0.04;
        targetY   = ld.land.y + Math.sin(t * 0.9) * 0.06;
        targetZ   = ld.land.z;
        targetRollZ = ld.rollZ;
        targetRollX = 0.04;
        targetRollY = 0;
        flameAmount = 0; // engines completely off

      } else {
        // LIFTOFF phase — rise and arc toward next planet
        targetX   = lerp(ld.land.x, ld.liftoff.x, sLiftoff) + Math.sin(t * 0.8) * 0.06 * sLiftoff;
        targetY   = lerp(ld.land.y, ld.liftoff.y, sLiftoff) + Math.sin(t * 1.3) * 0.08 * sLiftoff;
        targetZ   = lerp(ld.land.z, ld.liftoff.z, sLiftoff);
        targetRollZ = lerp(ld.rollZ, 0, sLiftoff);
        targetRollX = lerp(0.04, -0.08, sLiftoff);
        targetRollY = Math.sin(t * 0.4) * 0.06 * sLiftoff;
        // Engines ramp back up on liftoff
        flameAmount = sLiftoff;
      }
    }

    // ── Smooth out all movement (exponential lerp) ──
    const SMOOTH_POS = 0.07;
    const SMOOTH_ROT = 0.08;
    smoothedPos.current.x = lerp(smoothedPos.current.x, targetX, SMOOTH_POS);
    smoothedPos.current.y = lerp(smoothedPos.current.y, targetY, SMOOTH_POS);
    smoothedPos.current.z = lerp(smoothedPos.current.z, targetZ, SMOOTH_POS);

    ship.current.position.copy(smoothedPos.current);
    ship.current.rotation.z = lerp(ship.current.rotation.z, targetRollZ, SMOOTH_ROT);
    ship.current.rotation.x = lerp(ship.current.rotation.x, targetRollX, SMOOTH_ROT);
    ship.current.rotation.y = lerp(ship.current.rotation.y, targetRollY, SMOOTH_ROT);

    // ── Astronaut boarding animation ──
    if (astro.current) {
      astro.current.position.x = lerp(-1.5, 0,    boarding);
      astro.current.position.y = lerp(-0.5, 0.60, boarding) + Math.sin(t * 1.6) * 0.06 * (1 - boarding);
      astro.current.position.z = lerp(0.1,  0.52, boarding);
      astro.current.rotation.z = lerp(0.4,  0,    boarding);
      astro.current.rotation.y = lerp(Math.sin(t) * 0.4, 0.18, boarding);
      astro.current.rotation.x = lerp(0.15, 0, boarding);
      astro.current.scale.setScalar(lerp(0.44, 0.3, boarding));
      // Hide once aboard
      astro.current.visible = boarding < 0.95;
    }

    // ── Exhaust flame ──
    const flicker = 0.82 + Math.sin(t * 48) * 0.18 + Math.sin(t * 71) * 0.07;
    const flame_i = flameAmount * flicker;

    if (mat1.current)  mat1.current.opacity  = flame_i * 0.75;
    if (mat2.current)  mat2.current.opacity  = flame_i * 0.88;
    if (mat3.current)  mat3.current.opacity  = flame_i;
    if (light.current) light.current.intensity = flame_i * 6.0;

    if (flame.current)  flame.current.scale.y  = 0.4 + flameAmount * (1.2 + Math.sin(t * 40) * 0.25);
    if (flame2.current) flame2.current.scale.y = 0.3 + flameAmount * (0.95 + Math.sin(t * 55) * 0.2);
    if (flame3.current) flame3.current.scale.y = 0.2 + flameAmount * (0.72 + Math.sin(t * 62) * 0.18);
  });

  return (
    <group ref={ship} scale={0.88}>
      <RealRocket
        flameRef={flame} flame2Ref={flame2} flame3Ref={flame3}
        flameMat1={mat1} flameMat2={mat2} flameMat3={mat3}
        lightRef={light}
      />
      <group ref={astro}>
        <AstronautModel />
      </group>
    </group>
  );
}

/* ════════════════════════════════════════════════════════════
   FLOATING ASTRONAUT (Foreground)
════════════════════════════════════════════════════════════ */
function FloatingAstronaut({ progress }: { progress: RefObject<number> }) {
  const ref = useRef<THREE.Group>(null!);

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    const p = progress.current ?? 0;

    // Floats in the foreground (z=14), slowly bobbing
    ref.current.position.x = 3.5 + Math.sin(t * 0.35) * 0.4;
    ref.current.position.y = -0.5 + Math.sin(t * 0.4) * 0.3 - p * 3.0; // slight scroll parallax
    ref.current.position.z = 14 + Math.sin(t * 0.25) * 0.5;

    ref.current.rotation.x = Math.sin(t * 0.2) * 0.15;
    ref.current.rotation.y = t * 0.12;
    ref.current.rotation.z = Math.sin(t * 0.3) * 0.1;
  });

  return (
    <group ref={ref} scale={0.75}>
      <AstronautModel />
      <pointLight color="#00ffcc" intensity={0.4} distance={4} position={[0, 1, 1]} />
    </group>
  );
}

/* ════════════════════════════════════════════════════════════
   MARS METEOR CRASH SEQUENCE
════════════════════════════════════════════════════════════ */
function MarsMeteors({ progress }: { progress: RefObject<number> }) {
  const meteors = useRef<THREE.Group>(null!);
  const explosion = useRef<THREE.Points>(null!);
  const scorch = useRef<THREE.Mesh>(null!);
  const flash = useRef<THREE.PointLight>(null!);

  const nParticles = 300;
  const { positions, velocities } = useMemo(() => {
    const pos = new Float32Array(nParticles * 3);
    const vel = new Float32Array(nParticles * 3);
    for (let i = 0; i < nParticles; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const speed = Math.random() * 12 + 6;
      vel[i * 3]     = Math.sin(phi) * Math.cos(theta) * speed;
      vel[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * speed;
      vel[i * 3 + 2] = Math.cos(phi) * speed;
    }
    return { positions: pos, velocities: vel };
  }, []);

  const IMPACT_POS = new THREE.Vector3(1.74, 2.62, 1.74); // on surface of radius 3.6
  const START_POS = new THREE.Vector3(15, 12, -5);

  useEffect(() => {
    if (scorch.current) scorch.current.lookAt(0, 0, 0);
  }, []);

  useFrame(() => {
    const p = progress.current ?? 0;
    const journeyP = smooth(BOARDING_END, 1, p);
    const rawSeg = journeyP * N_JOURNEY; // 0 to 1 during Mars segment
    const t = rawSeg;

    // Crash sequence: 
    // 0.05 to 0.18: Meteors fly in
    // 0.18 to 0.35: Explosion

    if (meteors.current) {
      const crashProgress = clamp((t - 0.05) / 0.13, 0, 1);
      meteors.current.position.lerpVectors(START_POS, IMPACT_POS, crashProgress);
      meteors.current.visible = crashProgress > 0 && crashProgress < 1;
    }

    if (explosion.current && flash.current) {
      const expProgress = clamp((t - 0.18) / 0.17, 0, 1);
      const isExploding = expProgress > 0 && expProgress < 1;
      explosion.current.visible = isExploding;
      
      if (isExploding) {
        const posAttr = explosion.current.geometry.attributes.position;
        const posArray = posAttr.array as Float32Array;
        // Ease out explosion speed
        const easeExp = 1 - Math.pow(1 - expProgress, 3);
        
        for (let i = 0; i < nParticles; i++) {
          posArray[i * 3]     = velocities[i * 3] * easeExp;
          posArray[i * 3 + 1] = velocities[i * 3 + 1] * easeExp;
          posArray[i * 3 + 2] = velocities[i * 3 + 2] * easeExp;
        }
        posAttr.needsUpdate = true;
        (explosion.current.material as THREE.PointsMaterial).opacity = 1 - expProgress;
        flash.current.intensity = (1 - expProgress) * 8.0;
      } else {
        flash.current.intensity = 0;
      }
    }

    if (scorch.current) {
      // Fade in the scorch mark right after impact
      const scorchOpacity = clamp((t - 0.18) / 0.05, 0, 0.85);
      scorch.current.visible = scorchOpacity > 0;
      (scorch.current.material as THREE.MeshBasicMaterial).opacity = scorchOpacity;
    }
  });

  return (
    <group position={[-5.0, -1 * GAP, 2]}>
      {/* Meteors */}
      <group ref={meteors}>
        <mesh>
          <dodecahedronGeometry args={[0.35, 0]} />
          <meshStandardMaterial color="#331100" roughness={0.9} />
        </mesh>
        <mesh position={[0.6, 0.4, -0.2]} scale={0.6}>
          <dodecahedronGeometry args={[0.35, 0]} />
          <meshStandardMaterial color="#331100" roughness={0.9} />
        </mesh>
        <mesh position={[-0.4, 0.5, 0.3]} scale={0.4}>
          <dodecahedronGeometry args={[0.35, 0]} />
          <meshStandardMaterial color="#331100" roughness={0.9} />
        </mesh>
        {/* Meteor fire trail */}
        <pointLight color="#ff4a1f" intensity={3} distance={15} />
      </group>

      {/* Explosion particles */}
      <points ref={explosion} position={IMPACT_POS}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.12} color="#ff9933" transparent blending={THREE.AdditiveBlending} depthWrite={false} />
      </points>

      {/* Impact flash */}
      <pointLight ref={flash} position={IMPACT_POS} color="#ffaa55" intensity={0} distance={20} decay={2} />

      {/* Scorch mark on the surface */}
      <mesh ref={scorch} position={IMPACT_POS}>
        <circleGeometry args={[1.2, 24]} />
        <meshBasicMaterial color="#0a0402" transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  );
}

/* ════════════════════════════════════════════════════════════
   DYNAMIC PLANET ZONE LIGHTING
════════════════════════════════════════════════════════════ */
function PlanetZoneLights({ progress }: { progress: RefObject<number> }) {
  const refs = useRef<(THREE.PointLight | null)[]>([]);

  useFrame(() => {
    const p = progress.current ?? 0;
    const n = planets.length;
    planets.forEach((cfg, i) => {
      const l = refs.current[i];
      if (!l || !cfg.atmoColor) return;
      const zoneCenter = i / (n - 1);
      const dist = Math.abs(p - zoneCenter);
      l.intensity = Math.max(0, 1 - dist * n * 1.6) * 2.8;
    });
  });

  return (
    <>
      {planets.map((cfg, i) => cfg.atmoColor ? (
        <pointLight
          key={cfg.name}
          ref={(el) => { refs.current[i] = el; }}
          position={[cfg.x * 0.35, -i * GAP + (cfg.yOff ?? 0), 8]}
          color={cfg.atmoColor}
          intensity={0}
          distance={24}
          decay={2}
        />
      ) : null)}
    </>
  );
}

/* ════════════════════════════════════════════════════════════
   MAIN SCENE
════════════════════════════════════════════════════════════ */
function Scene({ bootLaunch }: { bootLaunch: RefObject<number> }) {
  const world    = useRef<THREE.Group>(null!);
  const progress = useRef(0);
  const ptr      = useRef({ x: 0, y: 0 });
  const { camera } = useThree();

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      ptr.current.x = e.clientX / window.innerWidth - 0.5;
      ptr.current.y = -(e.clientY / window.innerHeight - 0.5);
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  useFrame(() => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const p   = max > 0 ? clamp(window.scrollY / max, 0, 1) : 0;
    progress.current = p;

    // World slides up so each planet passes through the viewport center
    const travel = smooth(BOARDING_END, 1, p);
    if (world.current) {
      world.current.position.y = travel * (planets.length - 1) * GAP;
    }

    // Gentle camera parallax to mouse
    camera.position.x = lerp(camera.position.x, ptr.current.x * 1.0, 0.03);
    camera.position.y = lerp(camera.position.y, ptr.current.y * 0.7, 0.03);
    camera.lookAt(0, 0, 0);
  });

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.18} color="#b0c0d5" />
      <directionalLight position={[8, 6, 10]} intensity={2.8} color="#fff5ee" />
      <directionalLight position={[-6, 2, -4]} intensity={0.8} color="#ff5a1f" />
      <directionalLight position={[0, -8, 5]}  intensity={0.4} color="#2233bb" />

      {/* Stars — denser field */}
      <Stars radius={150} depth={80} count={5000} factor={5.5} saturation={0.1} fade speed={0.25} />

      {/* Planet zone colored lights */}
      <PlanetZoneLights progress={progress} />

      {/* Planet world group — slides up as user scrolls */}
      <group ref={world}>
        {planets.map((cfg, i) => <Planet key={cfg.name} cfg={cfg} index={i} />)}
        {decor.map((d, i) => <DecorPlanet key={i} d={d} />)}
        <MarsMeteors progress={progress} />
      </group>

      {/* Rocket + astronauts */}
      <Ship progress={progress} bootLaunch={bootLaunch} />
      <FloatingAstronaut progress={progress} />
    </>
  );
}

/* ════════════════════════════════════════════════════════════
   ROOT EXPORT
════════════════════════════════════════════════════════════ */
export default function Journey3DScene({ bootDone }: { bootDone?: boolean }) {
  const bootLaunch = useRef(0);

  // Clock-driven launch animation (not scroll-driven)
  useEffect(() => {
    let start: number | null = null;
    const DURATION = 2800;
    const animate  = (now: number) => {
      if (!start) start = now;
      bootLaunch.current = Math.min((now - start) / DURATION, 1);
      if (bootLaunch.current < 1) requestAnimationFrame(animate);
    };
    const id = setTimeout(() => requestAnimationFrame(animate), 400);
    return () => clearTimeout(id);
  }, []);

  return (
    <Canvas
      gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
      dpr={[1, 2]}
      camera={{ position: [0, 0, 20], fov: 42 }}
    >
      <Suspense fallback={null}>
        <Scene bootLaunch={bootLaunch} />
      </Suspense>
    </Canvas>
  );
}
