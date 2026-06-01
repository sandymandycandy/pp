# Sandeep · Full-Stack Developer Portfolio

An interactive, space-themed developer portfolio built as a **scroll-driven 3D journey**: a rocket launches from Earth, the astronaut boards it, and it flies down the page past real and procedural planets — one per section — ending at Neptune. Wrapped in an "analog mission-control" visual identity with a terminal boot intro, a game HUD, and hidden collectibles.

> This README is written to be understood by both humans and AI coding agents. If you are an agent picking this up cold, read **[Agent notes & gotchas](#agent-notes--gotchas)** first — there are a few non-obvious things that will bite you.

---

## 1. Concept & design direction

**Visual identity: "Analog Mission Control"** — deliberately *not* a generic AI-looking site (no purple/cyan neon, no glassmorphism, no emoji icons).

- **Palette:** warm **bone** text (`#ece7dd`) on deep space **ink** (`#08090d`); **rocket-orange** (`#ff5a1f`) primary accent; cool **steel** (`#9aa6bd`) and **amber** (`#ffb000`) as secondary signals.
- **Type:** **Bricolage Grotesque** (display) · **Familjen Grotesk** (body) · **Space Mono** (telemetry/labels). Loaded via `next/font`.
- **Texture:** film-grain overlay, faint technical grid, registration corner-ticks on panels, monospace section labels (e.g. `[03] DEPLOYMENTS / LOG`), custom SVG icons.
- **Centerpiece:** a real WebGL 3D scene (react-three-fiber) rendered *behind* the content.

There is an older plain **static HTML/CSS/JS** version of this site preserved in [`legacy-static/`](./legacy-static) for reference. It is not used by the app.

---

## 2. Tech stack

| Concern | Choice |
| --- | --- |
| Framework | **Next.js 15** (App Router) + **React 19** + **TypeScript** |
| Styling | **Tailwind CSS v4** (CSS-first `@theme`, no `tailwind.config.js`) |
| 3D / WebGL | **three.js** + **@react-three/fiber** + **@react-three/drei** |
| Animation | **Framer Motion** (scroll-linked reveals/parallax) |
| Smooth scroll | **Lenis** (`lenis/react`) |
| Fonts | `next/font/google` |
| Sound | Web Audio API (generated at runtime — **no audio files**) |
| Backend | Next.js Route Handler (`/api/contact`) |

Node 18+ required (built/tested on Node 22). Dev server runs on **port 3000**.

---

## 3. Getting started

```bash
npm install
npm run dev        # http://localhost:3000
```

```bash
npm run build      # production build  (⚠ stop `npm run dev` first — see gotchas)
npm run start      # serve the production build on :3000
npm run lint
```

> **Fonts and planet textures are fetched at build time / first load**, so the first `dev`/`build` needs network access.

---

## 4. Project structure

```
app/
  layout.tsx          Root layout: fonts, <head> metadata, and ALL global chrome
                      (SmoothScroll → GameProvider → cursor, 3D scene, boot, nav, <main>, footer)
  page.tsx            Assembles the page sections in order
  globals.css         Tailwind v4 @theme tokens + base styles + custom component classes + keyframes
  api/contact/route.ts  POST endpoint for the contact form (currently logs; TODO: wire to email provider)

components/
  # --- global chrome ---
  SmoothScroll.tsx    Lenis <ReactLenis root> wrapper
  GameProvider.tsx    React context: sound engine, hints, secret collection, boot state, toast.
                      Renders <Hud/> and <Toast/>. Use via `useGame()`.
  CustomCursor.tsx    Dot + lagging ring cursor (disabled on touch)
  BootIntro.tsx       Terminal boot overlay (typed text, SKIP, scroll-lock). Calls finishBoot().
  ScrollProgress.tsx  Top progress bar (Framer `useScroll`)
  Nav.tsx, Footer.tsx
  Hud.tsx, Toast.tsx, Secret.tsx   Game UI (sound/hints/secrets counter, toasts, collectibles)

  # --- 3D journey (the centerpiece) ---
  Journey3D.tsx       Client wrapper. next/dynamic(ssr:false) + a FIXED full-screen div (.journey-canvas)
                      that gives the <Canvas> an explicit size. DO NOT remove the wrapper div.
  Journey3DScene.tsx  The whole WebGL scene: planets, rocket, astronaut, lights, drei <Stars>,
                      and the scroll choreography (reads window.scrollY in useFrame).
  AstronautModel.tsx  Astronaut built from three.js primitives (reused inside the rocket)
  planetTexture.ts    Procedural planet textures drawn on a <canvas> (rocky / gas giant)

  # --- reusable UI primitives ---
  Reveal.tsx          whileInView fade/slide wrapper
  Counter.tsx         Count-up number (animates in view)
  MagneticButton.tsx  Button that leans toward the cursor
  TiltCard.tsx        3D tilt on hover
  SectionHeading.tsx  Mono label + big display title
  icons.tsx           Custom inline SVG icons (frontend/backend/data/devops/helmet)

lib/
  data.ts             ALL editable content: stats, skills, projects, timeline, socials, TOTAL_SECRETS
  planets.ts          Planet configs (position/size/texture) + GAP + decorative far bodies

public/textures/      Planet image maps (Earth/Jupiter/Saturn/etc.) + CREDITS.txt (licensing)

legacy-static/        The original static HTML/CSS/JS version (not used by the app)
```

---

## 5. How the 3D journey works

All in [`components/Journey3DScene.tsx`](./components/Journey3DScene.tsx). It is rendered **behind** the page content (`z-index: -1`); the content scrolls over it.

**Scroll → progress.** Every frame, `Scene` reads `window.scrollY` and computes `p = scrollY / maxScroll` (0→1). Lenis drives native scroll, so this stays in sync.

**The planets move, the rocket stays.**
- All planets live in a `world` group. Planet `i` is at world-y `-i * GAP + yOff` (`GAP = 18`, in `lib/planets.ts`).
- `world.position.y = smoothstep(0.14, 1, p) * (numPlanets - 1) * GAP`. As you scroll, the world slides up so each planet passes through the viewport center — i.e. you descend past them.
- The **rocket + astronaut** (`Ship`) is *not* in the world group; it stays in view and "flies," which reads as travel.

**Boarding choreography** (`Ship`, driven by `p`):
- `board = smoothstep(0, 0.14, p)` — first ~14% of scroll: astronaut floats in from the side and the rocket lifts off Earth; exhaust ignites.
- `fly = smoothstep(0.14, 1, p)` — rest of the journey: rocket flies down the **center lane** (kept clear of the side content cards), banking with motion; the astronaut rides in the cockpit.

**Planets** come in two kinds (`lib/planets.ts` → `kind`):
- `"real"` — textured sphere from `public/textures/*` (Earth also has a cloud layer + normal map; Saturn has a UV-remapped ring).
- `"rocky"` / `"gas"` — **procedural**, generated on a canvas in `planetTexture.ts` (Mars is rocky; "Aurora" is a teal gas giant). Used because a couple of real textures weren't freely available.
- Every planet gets an additive **atmosphere glow** sprite.

**Extras:** `drei <Stars>` for a parallax starfield, a warm key light + orange rim light, and subtle **camera parallax to the mouse**.

### Z-index layering (set in `globals.css`)
```
body gradient (base)  <  .nebula (-3)  <  .grid-overlay (-2)  <  .journey-canvas (-1)
   <  page content (0)  <  .grain (1)  <  hud (80)  <  nav (90)  <  scroll bar (100)
   <  boot overlay (1000)  <  custom cursor (9999)
```

---

## 6. The "game" layer

- **Boot intro** (`BootIntro.tsx`): a terminal types a mission log on load; `SKIP` or any key dismisses it. It locks scroll (`lenis.stop()` + `body overflow`) until done, then calls `finishBoot()`, which slides the HUD up.
- **HUD** (`Hud.tsx`): `SOUND` toggle, `HINTS` toggle, and a `Secrets x/5` counter.
- **Sound** (`GameProvider.tsx`): a generated ambient drone + UI blips via Web Audio — no files. Off by default.
- **Secrets**: 5 hidden `<Secret/>` stars (ids `0–4`) scattered in sections. Turning on **HINTS** reveals them; clicking collects them; finding all 5 triggers a reward toast. `TOTAL_SECRETS` lives in `lib/data.ts`.

State is shared through `GameProvider` — call `const { ... } = useGame()` in any client component under it.

---

## 7. Customizing the site

| You want to change… | Edit… |
| --- | --- |
| Name, bio, stats, projects, timeline, social links | `lib/data.ts` (+ bio in `components/sections/About.tsx`) |
| Theme colors / fonts | `app/globals.css` → the `@theme { … }` block |
| Which planets appear, their size/position/order | `lib/planets.ts` |
| Skill icons | `components/icons.tsx` (referenced by key in `lib/data.ts`) |
| Hidden-secret positions | the `style` props on `<Secret/>` in each section |
| Contact form behavior | `app/api/contact/route.ts` |

**Planet placement tips** (`lib/planets.ts`): `x` = horizontal (negative = left), `z` = depth (more negative = farther/smaller), `yOff` = vertical nudge within its slot, `radius`, `atmo` = glow color. Put each focal planet on the **open side** of its section so the content panels don't cover it (e.g. About's card is on the right → Mars is placed left).

---

## 8. Deployment (Vercel)

This is a standard Next.js app — deploy with zero config:

```bash
npm i -g vercel
vercel            # preview
vercel --prod     # production
```

Or push to GitHub and import the repo at vercel.com. `public/textures/*` ship as static assets. The `/api/contact` route runs as a Vercel Function.

---

## 9. Agent notes & gotchas

Read these before changing things — each one has already caused a real failure here:

1. **Never run `npm run build` while `npm run dev` is running.** Both write to `.next/`; the production build overwrites the dev chunks the live page references, producing a fully-broken page with `404`s for every `/_next/static/*` asset. **Fix:** stop the dev server, `rm -rf .next` (PowerShell: `Remove-Item -Recurse -Force .next`), then restart `npm run dev`.

2. **The `<Canvas>` must keep its fixed-size wrapper.** react-three-fiber sets inline `position:relative; width/height:100%` on its container, which **overrides** any `position:fixed` className. So the canvas lives inside `Journey3D.tsx`'s `<div className="journey-canvas">` (fixed, full-screen) to get a real size. Removing that wrapper collapses the canvas to ~150px tall.

3. **The 3D scene only renders/animates in a real foreground browser tab.** Headless/background tabs pause `requestAnimationFrame` *and* `ResizeObserver`, so the canvas never sizes and `useFrame` never runs (the scene still *mounts* and loads textures — it just won't paint or move). Verify visuals in an actual browser, not a background/preview tab.

4. **Planet textures are downloaded assets with licenses.** See `public/textures/CREDITS.txt` (NASA via three.js examples — public domain; Solar System Scope — CC BY 4.0). **Mars is procedural** (its texture was hotlink-blocked), generated in `planetTexture.ts`.

5. **Tailwind is v4.** Tokens are defined in `app/globals.css` via `@theme`, not a `tailwind.config.js`. PostCSS uses `@tailwindcss/postcss`. `next/font` CSS variables are named `--ff-display/--ff-body/--ff-mono` (the `@theme` `--font-*` tokens reference them) to avoid colliding with Tailwind's own `--font-*`.

6. **WebGL is client-only.** `Journey3D` uses `next/dynamic(..., { ssr: false })`. Any new three.js component must be a client component reached through that boundary.

7. **Scroll math is deterministic.** The astronaut/rocket and the world translation are pure functions of scroll progress `p` — tune the constants in `Journey3DScene.tsx` (boarding window `0.14`, `GAP`, camera `z=20`/`fov=38`) rather than adding stateful animation.

---

## 10. Credits

- Planet textures: NASA (public domain, via the three.js project) and [Solar System Scope](https://www.solarsystemscope.com/textures/) (CC BY 4.0). Full attribution in `public/textures/CREDITS.txt`.
- Everything else (astronaut, rocket, procedural planets, UI, sound) is generated in-engine / hand-built for this project.
