"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useGame } from "./GameProvider";

export default function Toast() {
  const { toast } = useGame();

  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: 20, x: "-50%" }}
          animate={{ opacity: 1, y: 0, x: "-50%" }}
          exit={{ opacity: 0, y: 20, x: "-50%" }}
          transition={{ duration: 0.35 }}
          className="font-mono fixed bottom-[70px] left-1/2 z-[95] rounded-[10px] border border-accent2 bg-bg-soft/95 px-5 py-3 text-[0.85rem] text-ink shadow-[0_0_30px_rgba(0,212,255,0.3)]"
        >
          {toast}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
