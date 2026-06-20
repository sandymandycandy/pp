export interface PlanetCfg {
  name: string;
  kind: "real" | "rocky" | "gas";
  map?: string;
  clouds?: string;
  normal?: string;
  ring?: string;
  radius: number;
  x: number;       // horizontal offset — positive = right, negative = left
  z: number;       // depth — closer to 0 = bigger in view
  atmo: string;
  atmoColor?: string;
  dark?: string;
  light?: string;
  bands?: number;
  spin: number;
  yOff?: number;   // vertical nudge within its section slot
}

/** Vertical spacing between sections, in world units */
export const GAP = 22;

/**
 * Planet layout — alternating LEFT / RIGHT so rocket zigzags.
 * Planets are brought CLOSE to camera (low |z|) so they fill the viewport edge.
 * Each planet is large enough to be clearly visible on its side.
 *
 * Rocket lands on the INNER face of each planet:
 *   Right planets → rocket lands on LEFT face  (cfg.x - cfg.radius - pad)
 *   Left  planets → rocket lands on RIGHT face (cfg.x + cfg.radius + pad)
 */
export const planets: PlanetCfg[] = [
  // Most planets LOOM large & close (big curve fills the section's open side).
  // Saturn is the exception — kept fully framed so its rings read clearly.
  // [0] HERO — Earth: RIGHT side, rocket launches & boards here
  {
    name: "Earth", kind: "real",
    map: "/textures/earth.jpg",
    clouds: "/textures/earth_clouds.png",
    normal: "/textures/earth_normal.jpg",
    radius: 7.2, x: 8.4, z: -1, atmo: "#5aa9ff", atmoColor: "#3a88ff",
    spin: 0.018, yOff: 0,
  },
  // [1] ABOUT — Mars: LEFT side, warm rusty red
  {
    name: "Mars", kind: "rocky",
    radius: 5.2, x: -7.2, z: -1, atmo: "#ff7a3c", atmoColor: "#ff5500",
    dark: "#5a2417", light: "#cc6e3c", spin: 0.032, yOff: 0,
  },
  // [2] SKILLS — Jupiter: RIGHT side, massive gas giant
  {
    name: "Jupiter", kind: "real",
    map: "/textures/jupiter.jpg",
    radius: 7.2, x: 8.6, z: -1, atmo: "#d9a06b", atmoColor: "#e8a050",
    spin: 0.038, yOff: 0,
  },
  // [3] PROJECTS — Aurora: LEFT side, vivid teal gas giant
  {
    name: "Aurora", kind: "gas",
    radius: 5.6, x: -7.4, z: -1, atmo: "#36e0c8", atmoColor: "#00ffcc",
    dark: "#0f3f39", light: "#62f0d8", bands: 12, spin: 0.042, yOff: 0,
  },
  // [4] JOURNEY — Saturn: RIGHT side, FULLY FRAMED so the rings show
  {
    name: "Saturn", kind: "real",
    map: "/textures/saturn.jpg", ring: "/textures/saturn_ring.png",
    radius: 2.8, x: 5.6, z: -4, atmo: "#e9c98a", atmoColor: "#d4a030",
    spin: 0.026, yOff: 0,
  },
  // [5] CONTACT — Neptune: LEFT side, deep cool blue, dramatic finale
  {
    name: "Neptune", kind: "real",
    map: "/textures/neptune.jpg",
    radius: 7.0, x: -7.6, z: -1, atmo: "#4a6bff", atmoColor: "#2244ff",
    spin: 0.030, yOff: 0,
  },
];

/** Decorative small bodies for background parallax */
export const decor = [
  { map: "/textures/moon.jpg",    radius: 1.2, x: -9,  y: -8,  z: -12 },
  { map: "/textures/mercury.jpg", radius: 1.6, x: 10,  y: -48, z: -14 },
  { map: "/textures/moon.jpg",    radius: 0.9, x: -9,  y: -88, z: -13 },
];
