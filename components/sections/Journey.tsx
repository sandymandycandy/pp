"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { timeline } from "@/lib/data";
import SectionHeading from "../SectionHeading";
import Reveal from "../Reveal";

export default function Journey() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start center", "end center"] });
  const scaleY = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <section id="journey" className="relative mx-auto max-w-[1180px] px-5 py-[clamp(80px,12vh,140px)] sm:px-10">
      <SectionHeading index="04" title="Flight Log" label="Trajectory / History" />

      <div ref={ref} className="relative mx-auto max-w-[760px] pl-[30px]">
        <div className="absolute bottom-1.5 left-[5px] top-1.5 w-px bg-line" />
        <motion.div
          style={{ scaleY }}
          className="absolute bottom-1.5 left-[5px] top-1.5 w-px origin-top bg-gradient-to-b from-accent via-accent3 to-transparent"
        />
        {timeline.map((t, i) => (
          <Reveal key={t.role} delay={i * 0.05} className="relative pb-11 pl-7">
            <span className="absolute left-[-28px] top-1.5 h-3 w-3 rounded-full border-2 border-accent bg-bg shadow-[0_0_12px_rgba(255,90,31,0.6)]" />
            <span className="font-mono text-[0.72rem] uppercase tracking-[0.14em] text-accent2">{t.year}</span>
            <h3 className="mb-1.5 mt-2 text-[1.35rem] font-bold tracking-tight">{t.role}</h3>
            <p className="text-muted">{t.blurb}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
