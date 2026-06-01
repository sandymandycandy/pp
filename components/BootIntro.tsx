"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useLenis } from "lenis/react";
import { useGame } from "./GameProvider";

const LINES = [
  { t: "> initializing mission.sys ...", c: "t-cmd" },
  { t: "> loading flight systems ........ OK", c: "t-out" },
  { t: "> calibrating star map .......... OK", c: "t-out" },
  { t: "> pilot: SANDEEP — full-stack developer", c: "t-key" },
  { t: "> objective: build across the universe", c: "t-out" },
  { t: "> all systems nominal. welcome aboard.", c: "t-ok" },
];

export default function BootIntro() {
  const { finishBoot } = useGame();
  const lenis = useLenis();
  const [visible, setVisible] = useState(true);
  const [rendered, setRendered] = useState<{ text: string; c: string }[]>([]);
  const doneRef = useRef(false);

  const finish = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    setVisible(false);
    finishBoot();
  }, [finishBoot]);

  // typing effect
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setRendered(LINES.map((l) => ({ text: l.t, c: l.c })));
      const id = setTimeout(finish, 1200);
      return () => clearTimeout(id);
    }
    let li = 0, ci = 0;
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      if (doneRef.current) return;
      if (li >= LINES.length) { timer = setTimeout(finish, 700); return; }
      const line = LINES[li];
      const curLi = li, curCi = ci;
      setRendered((prev) => {
        const copy = [...prev];
        copy[curLi] = { text: line.t.slice(0, curCi + 1), c: line.c };
        return copy;
      });
      ci++;
      if (ci >= line.t.length) { li++; ci = 0; timer = setTimeout(tick, 240); }
      else timer = setTimeout(tick, 18 + Math.random() * 30);
    };
    tick();
    return () => clearTimeout(timer);
  }, [finish]);

  // lock scroll while booting
  useEffect(() => {
    if (visible) { document.body.style.overflow = "hidden"; lenis?.stop(); }
    else { document.body.style.overflow = ""; lenis?.start(); }
    return () => { document.body.style.overflow = ""; };
  }, [visible, lenis]);

  // skip on key press
  useEffect(() => {
    const onKey = () => finish();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [finish]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          onClick={(e) => { if (e.target === e.currentTarget) finish(); }}
          className="fixed inset-0 z-[1000] flex items-center justify-center"
          style={{ background: "radial-gradient(ellipse at center, #0a0c1b 0%, #05060f 70%)" }}
        >
          <div className="boot-scanlines" />
          <div className="terminal ticks relative z-[1] w-[min(760px,90vw)] border !border-line px-7 py-6 font-mono shadow-[0_0_60px_rgba(255,90,31,0.1)]">
            <div className="mb-4 flex items-center justify-between">
              <span className="rounded-md border border-accent3 px-2.5 py-1 text-[0.78rem] text-accent3">mission.sys</span>
              <span className="rounded-md border border-accent2 px-2.5 py-1 text-[0.78rem] tracking-[0.15em] text-accent2">READY</span>
            </div>
            <pre className="min-h-[9.5em] whitespace-pre-wrap text-[clamp(0.82rem,2vw,1rem)] leading-[1.9]">
              {rendered.map((l, i) => (
                <span key={i} className={l.c}>{l.text}{"\n"}</span>
              ))}
              <span className="blink">▋</span>
            </pre>
            <div className="mt-5 flex items-center justify-between">
              <span className="text-[0.78rem] tracking-[0.12em] text-muted">[ press any key or click to skip ]</span>
              <button
                onClick={finish}
                className="rounded-md border border-accent3 bg-accent3/10 px-4 py-2 font-bold tracking-[0.12em] text-accent3 transition hover:bg-accent3 hover:text-bg hover:shadow-[0_0_20px_rgba(255,94,160,0.5)]"
              >
                SKIP ▸
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
