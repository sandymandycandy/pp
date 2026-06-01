"use client";

import { CSSProperties } from "react";
import { useGame } from "./GameProvider";

export default function Secret({ id, style }: { id: number; style: CSSProperties }) {
  const { hintsOn, collect, isCollected } = useGame();
  const collected = isCollected(id);

  return (
    <button
      type="button"
      aria-label="Hidden star"
      style={style}
      onClick={() => collect(id)}
      className={`secret${hintsOn ? " revealed" : ""}${collected ? " collected" : ""}`}
    />
  );
}
