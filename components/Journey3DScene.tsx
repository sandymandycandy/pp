"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Stars, useTexture, useGLTF } from "@react-three/drei";
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
   JOURNEY TIMING
   ────────────────────────────────────────────────────────────
     0.00–0.14  Launch off the boot → descend → land on Earth → board
     0.14–1.00  Journey — rocket weaves a zig-zag path past every planet
───────────────────────────────────────────────────────────── */
const BOARDING_END = 0.14;
const N_JOURNEY    = planets.length - 1;

/* The view-space X the rocket flies to as it passes each planet.
   Planets alternate left/right, so interpolating these traces a zig-zag. */
const VISIT_X = planets.map((cfg) => clamp(cfg.x * 0.4, -2.6, 2.6));

/* Swap the craft here (any GLB — auto-fit handles size/orientation). */
const SHIP_MODEL = "/models/space-rocket.glb";

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
  const { scene } = useGLTF(SHIP_MODEL);

  // Clone + auto-fit: centre on origin, scale by the largest dimension (works
  // for a tall rocket or a wide ship), and report the base Y for the flame.
  const { model, baseY } = useMemo(() => {
    const m = scene.clone(true);
    m.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (mesh.isMesh) { mesh.castShadow = true; mesh.receiveShadow = true; }
    });
    const box = new THREE.Box3().setFromObject(m);
    const size = new THREE.Vector3(); box.getSize(size);
    const center = new THREE.Vector3(); box.getCenter(center);
    const s = 5.0 / Math.max(size.x, size.y, size.z);
    m.scale.setScalar(s);
    m.position.set(-center.x * s, -center.y * s, -center.z * s);
    return { model: m, baseY: -(size.y * s) / 2 };
  }, [scene]);

  return (
    <group>
      <primitive object={model} />

      {/* Exhaust — 3-layer additive plume, anchored at the engine base */}
      <group position={[0, baseY - 0.05, 0]}>
        <mesh ref={flameRef} position={[0, -0.4, 0]} rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[0.55, 2.4, 24]} />
          <meshBasicMaterial ref={flameMat1} color="#ff9a3f" transparent opacity={0}
            blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
        </mesh>
        <mesh ref={flame2Ref} position={[0, -0.2, 0]} rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[0.32, 1.7, 18]} />
          <meshBasicMaterial ref={flameMat2} color="#ffcc44" transparent opacity={0}
            blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
        </mesh>
        <mesh ref={flame3Ref} position={[0, -0.1, 0]} rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[0.15, 1.0, 14]} />
          <meshBasicMaterial ref={flameMat3} color="#fff8e0" transparent opacity={0}
            blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
        </mesh>
        <pointLight ref={lightRef} position={[0, -0.3, 0]} color="#ff7a1f" intensity={0} distance={10} />
      </group>
    </group>
  );
}
useGLTF.preload(SHIP_MODEL);

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

  // Smoothed flight position + previous X (for banking)
  const pos   = useRef(new THREE.Vector3(VISIT_X[0], -9, 6.5));
  const prevX = useRef(VISIT_X[0]);

  useFrame((state) => {
    if (!ship.current) return;

    const p  = clamp(progress.current ?? 0, 0, 1);
    const bl = clamp(bootLaunch.current ?? 0, 0, 1);
    const t  = state.clock.elapsedTime;

    const boarding = smooth(0, BOARDING_END, p);   // 0→1 launch + board
    const journeyP = smooth(BOARDING_END, 1, p);   // 0→1 winding journey

    let tx: number, ty: number, tz: number, flameAmount: number;

    if (journeyP <= 0.0001) {
      // ── LAUNCH off the boot → fly in → settle by Earth → board ──
      const riseY = lerp(-9, 0.4, smooth(0, 1, bl));   // clock-driven rise
      tx = lerp(VISIT_X[0] + 0.6, VISIT_X[0], boarding) + Math.sin(t * 0.7) * 0.05;
      ty = riseY + Math.sin(t * 1.2) * 0.12 * boarding;
      tz = 6.5;
      flameAmount = Math.max(bl * (1 - boarding * 0.5), boarding * 0.25);
    } else {
      // ── JOURNEY — weave across planet waypoints (zig-zag) ──
      const f = journeyP * N_JOURNEY;                          // 0 → N
      const i = clamp(Math.floor(f), 0, N_JOURNEY - 1);
      const e = smooth(0, 1, f - i);                           // eased within segment
      tx = lerp(VISIT_X[i], VISIT_X[i + 1], e) + Math.sin(t * 1.0) * 0.12;
      ty = Math.sin(journeyP * Math.PI * 7) * 0.55 + Math.sin(t * 1.3) * 0.1;
      tz = 6.0;
      flameAmount = 0.9;
    }

    // Smooth position
    pos.current.x = lerp(pos.current.x, tx, 0.07);
    pos.current.y = lerp(pos.current.y, ty, 0.07);
    pos.current.z = lerp(pos.current.z, tz, 0.07);
    ship.current.position.copy(pos.current);

    // Bank into horizontal motion (roll), gentle pitch + yaw drift
    const vx = pos.current.x - prevX.current;
    prevX.current = pos.current.x;
    const targetRollZ = clamp(-vx * 7, -0.6, 0.6);
    ship.current.rotation.z = lerp(ship.current.rotation.z, targetRollZ, 0.06);
    ship.current.rotation.x = lerp(ship.current.rotation.x, -0.05 + Math.sin(t * 0.5) * 0.03, 0.05);
    ship.current.rotation.y = lerp(ship.current.rotation.y, Math.sin(t * 0.4) * 0.12, 0.05);

    // ── Astronaut boarding ──
    if (astro.current) {
      astro.current.position.x = lerp(-1.6, 0,    boarding);
      astro.current.position.y = lerp(-0.6, 0.70, boarding) + Math.sin(t * 1.6) * 0.06 * (1 - boarding);
      astro.current.position.z = lerp(0.1,  0.55, boarding);
      astro.current.rotation.z = lerp(0.4,  0,    boarding);
      astro.current.rotation.y = lerp(Math.sin(t) * 0.4, 0.18, boarding);
      astro.current.scale.setScalar(lerp(0.5, 0.34, boarding));
      astro.current.visible = boarding < 0.94;
    }

    // ── Exhaust flame ──
    const flicker = 0.82 + Math.sin(t * 48) * 0.18 + Math.sin(t * 71) * 0.07;
    const fi = flameAmount * flicker;
    if (mat1.current)  mat1.current.opacity = fi * 0.75;
    if (mat2.current)  mat2.current.opacity = fi * 0.88;
    if (mat3.current)  mat3.current.opacity = fi;
    if (light.current) light.current.intensity = fi * 6.0;
    if (flame.current)  flame.current.scale.y  = 0.4 + flameAmount * (1.2 + Math.sin(t * 40) * 0.25);
    if (flame2.current) flame2.current.scale.y = 0.3 + flameAmount * (0.95 + Math.sin(t * 55) * 0.2);
    if (flame3.current) flame3.current.scale.y = 0.2 + flameAmount * (0.72 + Math.sin(t * 62) * 0.18);
  });

  return (
    <group ref={ship} scale={0.5}>
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

      {/* Rocket + astronaut */}
      <Ship progress={progress} bootLaunch={bootLaunch} />
    </>
  );
}

/* ════════════════════════════════════════════════════════════
   ROOT EXPORT
════════════════════════════════════════════════════════════ */
export default function Journey3DScene({ bootDone }: { bootDone?: boolean }) {
  const bootLaunch = useRef(0);

  // Clock-driven launch — fires when the boot intro finishes, so the rocket
  // "launches off the boot", flies in, and lands on Earth.
  useEffect(() => {
    if (!bootDone) return;
    let start: number | null = null;
    let raf = 0;
    const DURATION = 2800;
    const animate = (now: number) => {
      if (!start) start = now;
      bootLaunch.current = Math.min((now - start) / DURATION, 1);
      if (bootLaunch.current < 1) raf = requestAnimationFrame(animate);
    };
    const id = setTimeout(() => { raf = requestAnimationFrame(animate); }, 300);
    return () => { clearTimeout(id); cancelAnimationFrame(raf); };
  }, [bootDone]);

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
