"use client";

import React, { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

const CELL_WIDTH = 56;
const CELL_HEIGHT = 40;

type HoveredCell = {
  column: number;
  row: number;
};

type BoxesProps = Omit<React.HTMLAttributes<HTMLDivElement>, "onPointerLeave" | "onPointerMove"> & {
  side?: "left" | "right";
};

export function BoxesCore({ className, side = "left", style, ...rest }: BoxesProps) {
  const [hoveredCell, setHoveredCell] = useState<HoveredCell | null>(null);
  const reduced = useReducedMotion();

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== "mouse") return;

    const bounds = event.currentTarget.getBoundingClientRect();
    const horizontalOffset = side === "right" ? bounds.right - event.clientX : event.clientX - bounds.left;
    const column = Math.floor(horizontalOffset / CELL_WIDTH);
    const row = Math.floor((event.clientY - bounds.top) / CELL_HEIGHT);

    setHoveredCell((current) => {
      if (current?.column === column && current.row === row) return current;
      return { column, row };
    });
  }

  return (
    <div
      aria-hidden="true"
      data-background-boxes
      className={cn("relative h-full w-full overflow-hidden", className)}
      onPointerMove={handlePointerMove}
      onPointerLeave={() => setHoveredCell(null)}
      style={{
        backgroundImage:
          "linear-gradient(to right, rgb(var(--color-accent) / .11) 1px, transparent 1px), linear-gradient(to bottom, rgb(var(--color-accent) / .11) 1px, transparent 1px), radial-gradient(circle at 0 0, rgb(var(--color-accent) / .28) 1px, transparent 1.5px)",
        backgroundSize: `${CELL_WIDTH}px ${CELL_HEIGHT}px`,
        backgroundPosition: side === "right" ? "right top" : "left top",
        ...style,
      }}
      {...rest}
    >
      <motion.div
        data-background-boxes-highlight
        className="pointer-events-none absolute top-0 border"
        style={{
          width: CELL_WIDTH,
          height: CELL_HEIGHT,
          ...(side === "right" ? { right: 0 } : { left: 0 }),
          backgroundColor: "rgb(var(--color-box-hover) / .25)",
          borderColor: "rgb(var(--color-box-hover) / .75)",
          opacity: hoveredCell ? 1 : 0,
          transform: `translate3d(${(hoveredCell?.column ?? 0) * CELL_WIDTH * (side === "right" ? -1 : 1)}px, ${(hoveredCell?.row ?? 0) * CELL_HEIGHT}px, 0)`,
          transition: reduced ? "none" : "opacity 140ms cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      />
    </div>
  );
}

export const Boxes = React.memo(BoxesCore);
