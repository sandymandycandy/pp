"use client";

import { createContext, useCallback, useContext, useRef, useState, ReactNode } from "react";
import { TOTAL_SECRETS } from "@/lib/data";
import Hud from "./Hud";
import Toast from "./Toast";

type Sfx = "click" | "collect" | "power" | "win";

interface GameCtx {
  soundOn: boolean;
  toggleSound: () => void;
  hintsOn: boolean;
  toggleHints: () => void;
  found: number;
  total: number;
  collect: (id: number) => void;
  isCollected: (id: number) => boolean;
  bootDone: boolean;
  finishBoot: () => void;
  playSfx: (t: Sfx) => void;
  toast: string;
}

const Ctx = createContext<GameCtx | null>(null);

export function useGame() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useGame must be used within GameProvider");
  return c;
}

export default function GameProvider({ children }: { children: ReactNode }) {
  const [soundOn, setSoundOn] = useState(false);
  const [hintsOn, setHintsOn] = useState(false);
  const [found, setFound] = useState(0);
  const [bootDone, setBootDone] = useState(false);
  const [toast, setToast] = useState("");

  const soundRef = useRef(false);
  const hintsRef = useRef(false);
  const collectedRef = useRef<Set<number>>(new Set());
  const audioRef = useRef<AudioContext | null>(null);
  const ambientRef = useRef<{ stop: () => void } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const ensureCtx = () => {
    if (!audioRef.current) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioRef.current = new AC();
    }
    if (audioRef.current.state === "suspended") audioRef.current.resume();
    return audioRef.current;
  };

  const playSfx = useCallback((type: Sfx) => {
    if (!soundRef.current && type !== "power") return;
    const ctx = ensureCtx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    const now = ctx.currentTime;
    const map: Record<Sfx, number> = { click: 880, collect: 1320, power: 440, win: 660 };
    o.type = "triangle";
    o.frequency.setValueAtTime(map[type], now);
    if (type === "collect") o.frequency.exponentialRampToValueAtTime(1980, now + 0.12);
    if (type === "win") o.frequency.exponentialRampToValueAtTime(1320, now + 0.3);
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(0.15, now + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, now + (type === "win" ? 0.5 : 0.18));
    o.connect(g).connect(ctx.destination);
    o.start(now);
    o.stop(now + 0.6);
  }, []);

  const startAmbient = useCallback(() => {
    const ctx = ensureCtx();
    const gain = ctx.createGain();
    gain.gain.value = 0.05;
    gain.connect(ctx.destination);
    const nodes: OscillatorNode[] = [];
    [55, 82.5, 110].forEach((f, i) => {
      const o = ctx.createOscillator();
      o.type = "sine";
      o.frequency.value = f;
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.value = 0.05 + i * 0.03;
      lfoGain.gain.value = 2;
      lfo.connect(lfoGain).connect(o.frequency);
      o.connect(gain);
      o.start();
      lfo.start();
      nodes.push(o, lfo);
    });
    ambientRef.current = {
      stop: () => {
        nodes.forEach((n) => { try { n.stop(); } catch { /* already stopped */ } });
        gain.disconnect();
      },
    };
  }, []);

  const showToast = useCallback((m: string) => {
    setToast(m);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 3200);
  }, []);

  const toggleSound = useCallback(() => {
    const next = !soundRef.current;
    soundRef.current = next;
    setSoundOn(next);
    if (next) startAmbient();
    else { ambientRef.current?.stop(); ambientRef.current = null; }
    playSfx("power");
  }, [startAmbient, playSfx]);

  const toggleHints = useCallback(() => {
    const next = !hintsRef.current;
    hintsRef.current = next;
    setHintsOn(next);
    playSfx("click");
    showToast(next ? "◉ Hints ON — glowing stars revealed. Click them!" : "◉ Hints OFF");
  }, [playSfx, showToast]);

  const collect = useCallback((id: number) => {
    if (collectedRef.current.has(id)) return;
    const next = new Set(collectedRef.current);
    next.add(id);
    collectedRef.current = next;
    setFound(next.size);
    const count = next.size;
    if (count === TOTAL_SECRETS) {
      playSfx("win");
      showToast("🏆 ALL SECRETS FOUND — Honors unlocked! You explored the whole galaxy.");
    } else {
      playSfx("collect");
      showToast(`★ Secret ${count}/${TOTAL_SECRETS} found! Keep exploring…`);
    }
  }, [playSfx, showToast]);

  const isCollected = useCallback((id: number) => collectedRef.current.has(id), []);
  const finishBoot = useCallback(() => { setBootDone(true); playSfx("power"); }, [playSfx]);

  const value: GameCtx = {
    soundOn, toggleSound, hintsOn, toggleHints,
    found, total: TOTAL_SECRETS, collect, isCollected,
    bootDone, finishBoot, playSfx, toast,
  };

  return (
    <Ctx.Provider value={value}>
      {children}
      <Hud />
      <Toast />
    </Ctx.Provider>
  );
}
