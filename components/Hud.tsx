"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGame } from "./GameProvider";
import { planets } from "@/lib/planets";

// Map each planet to which scroll section it corresponds to
const PLANET_ZONES = [
  { planet: "Earth",   emoji: "🌍", section: "hero"     },
  { planet: "Mars",    emoji: "🔴", section: "about"    },
  { planet: "Jupiter", emoji: "🟠", section: "skills"   },
  { planet: "Aurora",  emoji: "💚", section: "projects" },
  { planet: "Saturn",  emoji: "🪐", section: "journey"  },
  { planet: "Neptune", emoji: "🔵", section: "contact"  },
];

function PlanetCallout() {
  const [callout, setCallout] = useState<{ planet: string; emoji: string } | null>(null);
  const lastZone = useRef("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (max <= 0) return;
      const p = window.scrollY / max; // 0→1
      const n = planets.length;

      // Which zone are we closest to?
      let closest = 0;
      let minDist = Infinity;
      planets.forEach((_, i) => {
        const zoneCenter = i / (n - 1);
        const dist = Math.abs(p - zoneCenter);
        if (dist < minDist) { minDist = dist; closest = i; }
      });

      const zone = PLANET_ZONES[closest];
      if (!zone) return;

      // Only trigger callout when entering a new zone (within 8% of center)
      if (minDist < 0.08 && zone.planet !== lastZone.current) {
        lastZone.current = zone.planet;
        setCallout({ planet: zone.planet, emoji: zone.emoji });
        // Auto-dismiss after 2.8s
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => setCallout(null), 2800);
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <AnimatePresence>
      {callout && (
        <motion.div
          key={callout.planet}
          initial={{ x: 80, opacity: 0 }}
          animate={{ x: 0,  opacity: 1 }}
          exit={{    x: 80, opacity: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="pointer-events-none fixed right-5 top-1/2 z-[85] -translate-y-1/2 sm:right-8"
        >
          {/* Outer glow wrapper */}
          <div className="relative overflow-hidden rounded border border-accent/40 bg-bg-soft/90 px-4 py-3 shadow-[0_0_32px_rgba(255,90,31,0.18)] backdrop-blur-md">
            {/* Scan line */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent to-transparent opacity-60" />
            <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent" />

            {/* Corner ticks */}
            <span className="absolute left-1.5 top-1.5 h-2 w-2 border-l border-t border-accent/70" />
            <span className="absolute bottom-1.5 right-1.5 h-2 w-2 border-b border-r border-accent/70" />

            {/* Content */}
            <p className="mb-0.5 font-mono text-[0.6rem] uppercase tracking-[0.22em] text-accent2">
              ◉ proximity alert
            </p>
            <p className="font-mono text-[0.72rem] uppercase tracking-[0.18em] text-muted">
              Approaching
            </p>
            <p className="font-mono text-[1.05rem] font-bold uppercase tracking-wider text-accent">
              {callout.planet}
            </p>

            {/* Animated distance bar */}
            <div className="mt-2 h-0.5 w-full overflow-hidden rounded bg-line">
              <motion.div
                className="h-full bg-accent"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 2.8, ease: "linear" }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function Hud() {
  const { soundOn, toggleSound, toggleHints, hintsOn, found, total, bootDone } = useGame();

  return (
    <>
      {/* Planet proximity telemetry callout */}
      <PlanetCallout />

      {/* Bottom HUD bar */}
      <motion.div
        initial={{ y: "120%" }}
        animate={{ y: bootDone ? 0 : "120%" }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="font-mono fixed inset-x-0 bottom-0 z-[80] flex items-center gap-3 bg-gradient-to-t from-bg/90 to-transparent px-4 py-3 text-[0.82rem] sm:px-8"
      >
        <button
          onClick={toggleSound}
          className={`flex items-center gap-2 rounded-sm border bg-bg-soft/85 px-4 py-2.5 tracking-wider backdrop-blur transition ${soundOn ? "border-accent2 text-accent2" : "border-line text-ink hover:border-accent2 hover:text-accent2"}`}
        >
          <span className="text-accent2">♪</span> SOUND
          <span className={soundOn ? "text-[#28c840]" : "text-muted"}>{soundOn ? "ON" : "OFF"}</span>
        </button>

        <button
          onClick={toggleHints}
          className={`flex items-center gap-2 rounded-sm border bg-bg-soft/85 px-4 py-2.5 tracking-wider backdrop-blur transition ${hintsOn ? "border-accent2 text-accent2" : "border-line text-ink hover:border-accent2 hover:text-accent2"}`}
        >
          <span className="text-accent2">◉</span> HINTS
        </button>

        <div className="ml-auto flex items-center gap-2 rounded-sm border border-line bg-bg-soft/85 px-4 py-2.5 tracking-wide text-muted backdrop-blur">
          <span className="text-accent3">★</span> Secrets{" "}
          <strong className="text-accent2">{found}</strong>/{total}
          <span className="hidden sm:inline">— explore the galaxy</span>
        </div>
      </motion.div>
    </>
  );
}
