"use client";

import { useEffect, useRef, useState } from "react";
import { useInView } from "framer-motion";

export default function Counter({ to }: { to: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const [v, setV] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let cur = 0;
    const step = Math.max(1, Math.ceil(to / 40));
    const id = setInterval(() => {
      cur = Math.min(to, cur + step);
      setV(cur);
      if (cur >= to) clearInterval(id);
    }, 25);
    return () => clearInterval(id);
  }, [inView, to]);

  return <span ref={ref}>{v}</span>;
}
