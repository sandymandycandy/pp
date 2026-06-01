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
  // [0] HERO — Earth: RIGHT side, large, rocket launches & boards here
  {
    name: "Earth", kind: "real",
    map: "/textures/earth.jpg",
    clouds: "/textures/earth_clouds.png",
    normal: "/textures/earth_normal.jpg",
    radius: 5.0, x: 5.5, z: 2, atmo: "#5aa9ff", atmoColor: "#3a88ff",
    spin: 0.018, yOff: 0,
  },
  // [1] ABOUT — Mars: LEFT side, warm rusty red
  {
    name: "Mars", kind: "rocky",
    radius: 3.6, x: -5.0, z: 2, atmo: "#ff7a3c", atmoColor: "#ff5500",
    dark: "#5a2417", light: "#cc6e3c", spin: 0.032, yOff: 0,
  },
  // [2] SKILLS — Jupiter: RIGHT side, massive gas giant
  {
    name: "Jupiter", kind: "real",
    map: "/textures/jupiter.jpg",
    radius: 6.2, x: 6.0, z: 0, atmo: "#d9a06b", atmoColor: "#e8a050",
    spin: 0.038, yOff: 0,
  },
  // [3] PROJECTS — Aurora: LEFT side, vivid teal gas giant
  {
    name: "Aurora", kind: "gas",
    radius: 4.0, x: -5.5, z: 2, atmo: "#36e0c8", atmoColor: "#00ffcc",
    dark: "#0f3f39", light: "#62f0d8", bands: 12, spin: 0.042, yOff: 0,
  },
  // [4] JOURNEY — Saturn: RIGHT side, rings tilted for drama
  {
    name: "Saturn", kind: "real",
    map: "/textures/saturn.jpg", ring: "/textures/saturn_ring.png",
    radius: 4.5, x: 5.8, z: 1, atmo: "#e9c98a", atmoColor: "#d4a030",
    spin: 0.026, yOff: 0,
  },
  // [5] CONTACT — Neptune: LEFT side, deep cool blue, final stop
  {
    name: "Neptune", kind: "real",
    map: "/textures/neptune.jpg",
    radius: 4.8, x: -5.8, z: 2, atmo: "#4a6bff", atmoColor: "#2244ff",
    spin: 0.030, yOff: 0,
  },
];

/** Decorative small bodies for background parallax */
export const decor = [
  { map: "/textures/moon.jpg",    radius: 1.2, x: -9,  y: -8,  z: -12 },
  { map: "/textures/mercury.jpg", radius: 1.6, x: 10,  y: -48, z: -14 },
  { map: "/textures/moon.jpg",    radius: 0.9, x: -9,  y: -88, z: -13 },
];
