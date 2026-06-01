"use client";

import { motion, useScroll, useSpring } from "framer-motion";

export default function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30, restDelta: 0.001 });

  return (
    <motion.div
      style={{ scaleX }}
      className="fixed left-0 top-0 z-[100] h-[3px] w-full origin-left"
    >
      <div className="h-full w-full bg-gradient-to-r from-accent2 via-accent to-accent3 shadow-[0_0_12px_var(--color-accent2)]" />
    </motion.div>
  );
}
