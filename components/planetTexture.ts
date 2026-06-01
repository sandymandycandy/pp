import * as THREE from "three";

function hexToRgb(h: string) {
  const n = parseInt(h.replace("#", ""), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}
function mix(a: string, b: string, t: number) {
  const A = hexToRgb(a), B = hexToRgb(b);
  return `rgb(${Math.round(A.r + (B.r - A.r) * t)},${Math.round(A.g + (B.g - A.g) * t)},${Math.round(A.b + (B.b - A.b) * t)})`;
}

export interface PlanetTexOpts {
  type: "rocky" | "gas";
  dark: string;
  light: string;
  bands?: number;
}

/** Generates a believable planet surface on a canvas — no external image, no AI imagery. */
export function createPlanetTexture(opts: PlanetTexOpts): THREE.CanvasTexture {
  const W = 1024, H = 512;
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const x = c.getContext("2d")!;

  if (opts.type === "gas") {
    // horizontal cloud bands with turbulence
    for (let y = 0; y < H; y++) {
      const t = y / H;
      const bands = opts.bands ?? 9;
      const n =
        Math.sin(t * Math.PI * bands) * 0.5 +
        Math.sin(t * Math.PI * bands * 2.3 + 1.7) * 0.28 +
        Math.sin(t * Math.PI * bands * 5.1 + 0.4) * 0.12 +
        (Math.random() - 0.5) * 0.12;
      const l = Math.max(0, Math.min(1, 0.5 + n * 0.5));
      x.fillStyle = mix(opts.dark, opts.light, l);
      x.fillRect(0, y, W, 1);
    }
    // swirling storms
    for (let i = 0; i < 60; i++) {
      const cx = Math.random() * W, cy = Math.random() * H;
      const rw = 20 + Math.random() * 90, rh = 6 + Math.random() * 22;
      x.globalAlpha = 0.06 + Math.random() * 0.1;
      x.fillStyle = Math.random() > 0.5 ? opts.light : opts.dark;
      x.beginPath();
      x.ellipse(cx, cy, rw, rh, 0, 0, Math.PI * 2);
      x.fill();
    }
    x.globalAlpha = 1;
  } else {
    // rocky base
    x.fillStyle = opts.dark;
    x.fillRect(0, 0, W, H);
    // mottled terrain
    for (let i = 0; i < 6000; i++) {
      const px = Math.random() * W, py = Math.random() * H;
      const r = Math.random() * 7 + 1;
      x.globalAlpha = 0.04 + Math.random() * 0.1;
      x.fillStyle = mix(opts.dark, opts.light, Math.random());
      x.beginPath();
      x.arc(px, py, r, 0, Math.PI * 2);
      x.fill();
    }
    // craters
    for (let i = 0; i < 140; i++) {
      const px = Math.random() * W, py = Math.random() * H;
      const r = 3 + Math.random() * 16;
      x.globalAlpha = 0.18;
      x.strokeStyle = mix(opts.dark, "#000000", 0.5);
      x.lineWidth = 1.5;
      x.beginPath(); x.arc(px, py, r, 0, Math.PI * 2); x.stroke();
      x.globalAlpha = 0.12;
      x.fillStyle = mix(opts.light, "#ffffff", 0.2);
      x.beginPath(); x.arc(px - r * 0.2, py - r * 0.2, r * 0.7, 0, Math.PI * 2); x.fill();
    }
    x.globalAlpha = 1;
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}
