"use client";

import dynamic from "next/dynamic";
import { useGame } from "./GameProvider";

// WebGL is client-only — load the journey scene with SSR disabled.
const Scene = dynamic(() => import("./Journey3DScene"), { ssr: false });

export default function Journey3D() {
  const { bootDone } = useGame();
  // Fixed full-screen wrapper gives the <Canvas> an explicit size to fill
  // (r3f sets its own inline width/height:100%, so it needs a sized parent).
  return (
    <div className="journey-canvas">
      <Scene bootDone={bootDone} />
    </div>
  );
}
