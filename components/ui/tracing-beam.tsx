"use client";

import { ReactNode, useEffect, useRef, useState } from "react";
import { motion, type MotionValue, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

type TracingBeamProps = {
  children: ReactNode;
  className?: string;
};

type BeamRailProps = {
  active: boolean;
  height: number;
  headY: MotionValue<number>;
  progress: MotionValue<number>;
  side: "left" | "right";
};

function BeamRail({ active, headY, height, progress, side }: BeamRailProps) {
  const edge = side === "left" ? 2 : 18;
  const inner = side === "left" ? 18 : 2;
  const corner = Math.min(120, Math.max(56, height * 0.08));
  const path = `M ${edge} 0 V ${corner} L ${inner} ${corner + 22} V ${height - corner - 22} L ${edge} ${height - corner} V ${height}`;

  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-y-0 z-[2] w-5",
        side === "left" ? "left-0" : "right-0",
      )}
      aria-hidden="true"
    >
      <svg viewBox={`0 0 20 ${height}`} width="20" height={height} className="block overflow-visible">
        <path d={path} fill="none" stroke="rgb(var(--color-accent))" strokeOpacity="0.16" />
        {active ? (
          <motion.path
            d={path}
            fill="none"
            stroke="rgb(var(--color-accent))"
            strokeOpacity="0.92"
            strokeWidth="1.4"
            strokeLinecap="round"
            style={{
              filter: "drop-shadow(0 0 4px rgb(var(--color-accent) / .45))",
              pathLength: progress,
            }}
          />
        ) : null}
      </svg>
      {active ? (
        <motion.span
          style={{ top: headY, boxShadow: "0 0 12px rgb(var(--color-accent) / .82)" }}
          className={cn(
            "absolute size-2 -translate-y-1/2 rounded-full bg-gold",
            side === "left" ? "left-[-2px]" : "right-[-2px]",
          )}
        />
      ) : null}
    </div>
  );
}

export function TracingBeam({ children, className }: TracingBeamProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: rootRef,
    offset: ["start 0.78", "end 0.22"],
  });
  const beamProgress = useSpring(scrollYProgress, { stiffness: 320, damping: 54, mass: 0.35 });
  const headY = useTransform(beamProgress, [0, 1], [0, Math.max(1, height)]);

  useEffect(() => {
    const node = contentRef.current;
    if (!node) return;

    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const next = Math.max(1, Math.ceil(node.getBoundingClientRect().height));
        setHeight((current) => current === next ? current : next);
      });
    };
    update();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", update);
      return () => {
        cancelAnimationFrame(frame);
        window.removeEventListener("resize", update);
      };
    }

    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, []);

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      {height > 1 ? (
        <>
          <BeamRail active={!reduced} headY={headY} height={height} progress={beamProgress} side="left" />
          <BeamRail active={!reduced} headY={headY} height={height} progress={beamProgress} side="right" />
        </>
      ) : null}
      <div ref={contentRef}>{children}</div>
    </div>
  );
}
