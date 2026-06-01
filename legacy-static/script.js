/* ============== BOOT TERMINAL INTRO ============== */
(function boot() {
  const boot = document.getElementById("boot");
  const textEl = document.getElementById("bootText");
  const cursor = document.getElementById("bootCursor");
  const skipBtn = document.getElementById("bootSkip");
  document.body.classList.add("booting");

  const lines = [
    { t: "> initializing mission.sys ...", c: "b-accent" },
    { t: "> loading flight systems ........ OK", c: "" },
    { t: "> calibrating star map .......... OK", c: "" },
    { t: "> pilot: SANDEEP — full-stack developer", c: "b-pink" },
    { t: "> objective: build across the universe", c: "" },
    { t: "> all systems nominal. welcome aboard.", c: "b-accent" },
  ];

  let li = 0, ci = 0, done = false;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  function finish() {
    if (done) return;
    done = true;
    boot.classList.add("done");
    document.body.classList.remove("booting");
    document.getElementById("hud").classList.add("show");
    setTimeout(() => boot.remove(), 700);
    window.__sfx && window.__sfx("power");
  }

  function type() {
    if (done) return;
    if (li >= lines.length) { cursor.style.display = "none"; setTimeout(finish, 700); return; }
    const line = lines[li];
    if (ci === 0) {
      const span = document.createElement("span");
      if (line.c) span.className = line.c;
      span.dataset.idx = li;
      textEl.appendChild(span);
    }
    const span = textEl.querySelector(`[data-idx="${li}"]`);
    span.textContent = line.t.slice(0, ci + 1);
    ci++;
    if (ci >= line.t.length) {
      textEl.appendChild(document.createTextNode("\n"));
      li++; ci = 0;
      setTimeout(type, 240);
    } else {
      setTimeout(type, 18 + Math.random() * 30);
    }
  }

  if (reduce) { lines.forEach(l => { const s = document.createElement("span"); s.className = l.c; s.textContent = l.t + "\n"; textEl.appendChild(s); }); cursor.style.display = "none"; setTimeout(finish, 1200); }
  else type();

  skipBtn.addEventListener("click", finish);
  boot.addEventListener("click", (e) => { if (e.target !== skipBtn) finish(); });
  addEventListener("keydown", function onKey() { finish(); removeEventListener("keydown", onKey); });
})();

/* ============== SOUND ENGINE (WebAudio, no files) ============== */
(function sound() {
  let ctx, ambientGain, ambientNodes = [], on = false;
  const btn = document.getElementById("soundBtn");
  const state = document.getElementById("soundState");

  function ensureCtx() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === "suspended") ctx.resume();
  }

  // short blip for UI
  window.__sfx = function (type) {
    if (!on && type !== "power") return;
    ensureCtx();
    const o = ctx.createOscillator(), g = ctx.createGain();
    const now = ctx.currentTime;
    const map = { click: 880, collect: 1320, power: 440, win: 660 };
    o.type = "triangle";
    o.frequency.setValueAtTime(map[type] || 600, now);
    if (type === "collect") o.frequency.exponentialRampToValueAtTime(1980, now + 0.12);
    if (type === "win") o.frequency.exponentialRampToValueAtTime(1320, now + 0.3);
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(0.15, now + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, now + (type === "win" ? 0.5 : 0.18));
    o.connect(g).connect(ctx.destination);
    o.start(now); o.stop(now + 0.6);
  };

  function startAmbient() {
    ensureCtx();
    ambientGain = ctx.createGain();
    ambientGain.gain.value = 0.05;
    ambientGain.connect(ctx.destination);
    [55, 82.5, 110].forEach((f, i) => {
      const o = ctx.createOscillator();
      o.type = "sine"; o.frequency.value = f;
      const lfo = ctx.createOscillator(), lfoGain = ctx.createGain();
      lfo.frequency.value = 0.05 + i * 0.03; lfoGain.gain.value = 2;
      lfo.connect(lfoGain).connect(o.frequency);
      o.connect(ambientGain); o.start(); lfo.start();
      ambientNodes.push(o, lfo);
    });
  }
  function stopAmbient() {
    ambientNodes.forEach(n => { try { n.stop(); } catch (e) {} });
    ambientNodes = [];
    if (ambientGain) ambientGain.disconnect();
  }

  btn.addEventListener("click", () => {
    on = !on;
    btn.classList.toggle("active", on);
    state.textContent = on ? "ON" : "OFF";
    if (on) { startAmbient(); window.__sfx("power"); } else { stopAmbient(); }
  });
})();

/* ============== SECRETS ============== */
(function secrets() {
  const secretEls = document.querySelectorAll(".secret");
  const countEl = document.getElementById("secretCount");
  const hintBtn = document.getElementById("hintBtn");
  const total = secretEls.length;
  let found = 0, hintsOn = false;

  secretEls.forEach((el) => {
    el.addEventListener("click", () => {
      if (el.classList.contains("collected")) return;
      el.classList.add("collected");
      found++;
      countEl.textContent = found;
      window.__sfx && window.__sfx("collect");
      if (found === total) {
        toast("🏆 ALL SECRETS FOUND — Honors unlocked! You explored the whole galaxy.");
        window.__sfx && window.__sfx("win");
        document.querySelector(".hud-secrets").style.borderColor = "#28c840";
      } else {
        toast(`★ Secret ${found}/${total} found! Keep exploring…`);
      }
    });
  });

  hintBtn.addEventListener("click", () => {
    hintsOn = !hintsOn;
    hintBtn.classList.toggle("active", hintsOn);
    secretEls.forEach((el) => el.classList.toggle("revealed", hintsOn && !el.classList.contains("collected")));
    window.__sfx && window.__sfx("click");
    toast(hintsOn ? "◉ Hints ON — glowing stars revealed. Click them!" : "◉ Hints OFF");
  });
})();

/* ============== TOAST ============== */
let toastTimer;
function toast(msg) {
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 3200);
}

/* ============== ANIMATED STARFIELD ============== */
(function starfield() {
  const canvas = document.getElementById("starfield");
  const ctx = canvas.getContext("2d");
  let w, h, stars, shootingStars, dpr;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.width = innerWidth * dpr;
    h = canvas.height = innerHeight * dpr;
    canvas.style.width = innerWidth + "px";
    canvas.style.height = innerHeight + "px";
    initStars();
  }
  function initStars() {
    const count = Math.floor((innerWidth * innerHeight) / 5000);
    stars = Array.from({ length: count }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      r: (Math.random() * 1.3 + 0.2) * dpr, a: Math.random(),
      tw: Math.random() * 0.025 + 0.005, dir: Math.random() > 0.5 ? 1 : -1,
      vx: (Math.random() - 0.5) * 0.04 * dpr, vy: (Math.random() - 0.5) * 0.04 * dpr,
    }));
    shootingStars = [];
  }
  function spawnShooting() {
    if (Math.random() < 0.012 && shootingStars.length < 3) {
      shootingStars.push({
        x: Math.random() * w * 0.7, y: Math.random() * h * 0.4,
        len: (Math.random() * 120 + 80) * dpr, speed: (Math.random() * 6 + 6) * dpr, angle: Math.PI / 5,
      });
    }
  }
  let px = 0, py = 0, tx = 0, ty = 0;
  addEventListener("mousemove", (e) => {
    tx = (e.clientX / innerWidth - 0.5) * 18 * dpr;
    ty = (e.clientY / innerHeight - 0.5) * 18 * dpr;
  });
  function draw() {
    ctx.clearRect(0, 0, w, h);
    px += (tx - px) * 0.05; py += (ty - py) * 0.05;
    for (const s of stars) {
      s.a += s.tw * s.dir;
      if (s.a <= 0.1 || s.a >= 1) s.dir *= -1;
      s.x += s.vx; s.y += s.vy;
      if (s.x < 0) s.x = w; if (s.x > w) s.x = 0;
      if (s.y < 0) s.y = h; if (s.y > h) s.y = 0;
      ctx.globalAlpha = s.a; ctx.fillStyle = "#dfe6ff";
      ctx.beginPath(); ctx.arc(s.x + px * s.r, s.y + py * s.r, s.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
    spawnShooting();
    for (let i = shootingStars.length - 1; i >= 0; i--) {
      const sh = shootingStars[i];
      const dx = Math.cos(sh.angle) * sh.len, dy = Math.sin(sh.angle) * sh.len;
      const grad = ctx.createLinearGradient(sh.x, sh.y, sh.x - dx, sh.y - dy);
      grad.addColorStop(0, "rgba(0,212,255,0.9)"); grad.addColorStop(1, "rgba(0,212,255,0)");
      ctx.strokeStyle = grad; ctx.lineWidth = 2 * dpr;
      ctx.beginPath(); ctx.moveTo(sh.x, sh.y); ctx.lineTo(sh.x - dx, sh.y - dy); ctx.stroke();
      sh.x += Math.cos(sh.angle) * sh.speed; sh.y += Math.sin(sh.angle) * sh.speed;
      if (sh.x > w || sh.y > h) shootingStars.splice(i, 1);
    }
    requestAnimationFrame(draw);
  }
  resize(); addEventListener("resize", resize); draw();
})();

/* ============== TRAVELING ASTRONAUT ============== */
(function traveler() {
  const el = document.getElementById("traveler");
  if (!el) return;
  const trail = el.querySelector(".astro-trail");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // current + target position in vw / vh
  let cur = { x: 50, y: 16 }, tgt = { x: 50, y: 16 };
  let prevPx = null, heading = 0, bank = 0, thrustHold = 0;

  function computeTarget() {
    const max = document.documentElement.scrollHeight - innerHeight;
    const p = max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0;
    tgt.y = 14 + p * 72;                                  // top -> bottom as you scroll
    tgt.x = 50 + Math.sin(p * Math.PI * 3 + 0.4) * 30;    // weaves left <-> right
  }

  // Apply current state to the DOM. Shared by the scroll handler and the rAF
  // smoother, so the astronaut still travels even if rAF is throttled.
  function step(ease) {
    cur.x += (tgt.x - cur.x) * ease;
    cur.y += (tgt.y - cur.y) * ease;

    const px = (cur.x / 100) * innerWidth;
    const py = (cur.y / 100) * innerHeight;
    if (!prevPx) prevPx = { x: px, y: py };
    const vx = px - prevPx.x, vy = py - prevPx.y;
    const speed = Math.hypot(vx, vy);

    if (speed > 0.4) {
      heading = (Math.atan2(vy, vx) * 180) / Math.PI;
      thrustHold = 12;
    }
    thrustHold > 0 ? (thrustHold--, el.classList.add("thrusting")) : el.classList.remove("thrusting");

    const targetBank = Math.max(-26, Math.min(26, vx * 1.4));
    bank += (targetBank - bank) * 0.15;

    el.style.setProperty("--x", cur.x.toFixed(2));
    el.style.setProperty("--y", cur.y.toFixed(2));
    el.style.setProperty("--rot", bank.toFixed(2) + "deg");
    trail.style.setProperty("--trailRot", (heading - bank).toFixed(2) + "deg");
    prevPx = { x: px, y: py };
  }

  computeTarget();
  cur.x = tgt.x; cur.y = tgt.y; step(1);   // place immediately on load

  if (reduce) {                            // no motion: park it, no animation loop
    cur = { x: 82, y: 18 }; tgt = { ...cur }; step(1);
    return;
  }

  // Scroll drives it directly (works without rAF); rAF just smooths between events.
  addEventListener("scroll", () => { computeTarget(); step(0.4); }, { passive: true });
  addEventListener("resize", () => { computeTarget(); step(1); });
  (function loop() { step(0.08); requestAnimationFrame(loop); })();
})();

/* ============== SCROLL REVEAL ============== */
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add("in"); revealObserver.unobserve(e.target); }
  });
}, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
document.querySelectorAll("[data-reveal]").forEach((el, i) => {
  el.style.transitionDelay = `${(i % 4) * 70}ms`;
  revealObserver.observe(el);
});

/* ============== ANIMATED COUNTERS ============== */
const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    const el = entry.target, target = +el.dataset.count;
    let cur = 0; const step = Math.max(1, Math.ceil(target / 40));
    const tick = () => { cur = Math.min(target, cur + step); el.textContent = cur; if (cur < target) requestAnimationFrame(tick); };
    tick(); counterObserver.unobserve(el);
  });
}, { threshold: 0.6 });
document.querySelectorAll("[data-count]").forEach((c) => counterObserver.observe(c));

/* ============== NAV + PROGRESS ============== */
const nav = document.getElementById("nav");
const navToggle = document.getElementById("navToggle");
const navLinks = document.getElementById("navLinks");
const progress = document.getElementById("scrollProgress");
function onScroll() {
  nav.classList.toggle("scrolled", window.scrollY > 40);
  const max = document.documentElement.scrollHeight - innerHeight;
  progress.style.width = (window.scrollY / max) * 100 + "%";
}
addEventListener("scroll", onScroll, { passive: true }); onScroll();
navToggle.addEventListener("click", () => { navToggle.classList.toggle("active"); navLinks.classList.toggle("open"); });
navLinks.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => {
  navToggle.classList.remove("active"); navLinks.classList.remove("open");
  window.__sfx && window.__sfx("click");
}));

/* ============== CONTACT FORM ============== */
const form = document.getElementById("contactForm");
const note = document.getElementById("formNote");
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const msg = document.getElementById("message").value.trim();
  if (!name || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || !msg) {
    note.textContent = "⚠ Please complete all fields with a valid email.";
    note.className = "form-note err"; return;
  }
  note.textContent = `🚀 Transmission received, ${name}! I'll respond at light speed.`;
  note.className = "form-note ok";
  window.__sfx && window.__sfx("win");
  form.reset();
});

/* ============== YEAR ============== */
document.getElementById("year").textContent = new Date().getFullYear();
