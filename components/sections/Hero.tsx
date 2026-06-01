"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { stats } from "@/lib/data";
import Counter from "../Counter";
import MagneticButton from "../MagneticButton";
import Secret from "../Secret";

export default function Hero() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const yTitle = useTransform(scrollYProgress, [0, 1], [0, -90]);
  const opacity = useTransform(scrollYProgress, [0, 0.85], [1, 0]);

  return (
    <section ref={ref} id="hero" className="relative mx-auto flex min-h-screen max-w-[1180px] items-center px-5 pb-20 pt-32 sm:px-10">
      <motion.div style={{ opacity }} className="relative z-[2] max-w-[760px]">
        <motion.div style={{ y: yTitle }}>
          <motion.p
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.6 }}
            className="mb-6 flex items-center gap-3 font-mono text-[0.72rem] uppercase tracking-[0.22em] text-accent2"
          >
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-accent" />
            Transmission · Deep Space · 28.5729°N
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.7 }}
            className="mb-6 text-[clamp(3rem,11vw,7rem)] font-extrabold leading-[0.92] tracking-[-0.04em]"
          >
            <span className="block">FULL-STACK</span>
            <span className="gradient-text block">DEVELOPER</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.6 }}
            className="mb-9 max-w-[540px] text-[clamp(1rem,2vw,1.18rem)] text-muted"
          >
            Welcome aboard. I build web experiences that travel from the front-end cosmos to the
            server-side void — clean code, blazing performance, zero gravity. Scroll to begin the journey.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.6 }}
            className="mb-16 flex flex-wrap gap-4"
          >
            <MagneticButton href="#projects" className="inline-flex items-center gap-2 rounded-sm bg-accent px-7 py-3.5 font-mono text-[0.82rem] font-bold uppercase tracking-wider text-bg transition-colors hover:bg-[#ff7a45]">
              Explore Missions →
            </MagneticButton>
            <MagneticButton href="#contact" className="inline-flex items-center gap-2 rounded-sm border border-line px-7 py-3.5 font-mono text-[0.82rem] font-bold uppercase tracking-wider text-ink transition-colors hover:border-accent hover:text-accent">
              Open Comms
            </MagneticButton>
          </motion.div>
        </motion.div>

        <div className="flex flex-wrap gap-x-12 gap-y-4 border-t border-line pt-6">
          {stats.map((s) => (
            <div key={s.label} className="flex flex-col">
              <span className="text-[clamp(1.8rem,4vw,2.6rem)] font-extrabold tracking-tight">
                <Counter to={s.num} />
              </span>
              <span className="font-mono text-[0.66rem] uppercase tracking-[0.14em] text-muted">{s.label}</span>
            </div>
          ))}
        </div>
      </motion.div>

      <Secret id={0} style={{ top: "24%", right: "18%" }} />

      {/* ── Animated scroll affordance ── */}
      <div className="absolute bottom-8 left-5 flex flex-col items-start gap-2 sm:left-10">
        <span className="font-mono text-[0.68rem] uppercase tracking-[0.2em] text-muted">Scroll to Launch</span>
        <div className="flex flex-col items-start gap-0.5">
          {[0, 1, 2].map((i) => (
            <svg
              key={i}
              width="22" height="12" viewBox="0 0 22 12"
              className="animate-chevron"
              style={{ animationDelay: `${i * 0.22}s`, opacity: 1 - i * 0.28 }}
            >
              <polyline points="2,2 11,10 20,2" fill="none" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ))}
        </div>
      </div>
    </section>
  );
}
