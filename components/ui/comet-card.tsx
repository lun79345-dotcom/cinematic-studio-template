"use client";

import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";
import { PointerEvent, ReactNode, useRef } from "react";
import { cn } from "@/lib/utils";

type CometCardProps = {
  children: ReactNode;
  className?: string;
  rotateDepth?: number;
  translateDepth?: number;
};

const desktopPointerQuery = "(min-width: 1024px) and (hover: hover) and (pointer: fine)";

// 为桌面端影像卡片提供克制的视差、抬升和随指针移动的品牌金色高光。
export function CometCard({
  children,
  className,
  rotateDepth = 3,
  translateDepth = 4,
}: CometCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const hoverProgress = useMotionValue(0);

  const springConfig = { stiffness: 190, damping: 26, mass: 0.6 };
  const xSpring = useSpring(pointerX, springConfig);
  const ySpring = useSpring(pointerY, springConfig);
  const hoverSpring = useSpring(hoverProgress, springConfig);

  const rotateX = useTransform(ySpring, [-0.5, 0.5], [-rotateDepth, rotateDepth]);
  const rotateY = useTransform(xSpring, [-0.5, 0.5], [rotateDepth, -rotateDepth]);
  const x = useTransform(xSpring, [-0.5, 0.5], [-translateDepth, translateDepth]);
  const y = useTransform(ySpring, [-0.5, 0.5], [translateDepth, -translateDepth]);
  const scale = useTransform(hoverSpring, [0, 1], [1, 1.012]);
  const z = useTransform(hoverSpring, [0, 1], [0, 18]);
  const glareOpacity = useTransform(hoverSpring, [0, 1], [0, 0.58]);
  const glareX = useTransform(xSpring, [-0.5, 0.5], [8, 92]);
  const glareY = useTransform(ySpring, [-0.5, 0.5], [8, 92]);
  const glareBackground = useMotionTemplate`radial-gradient(circle at ${glareX}% ${glareY}%, rgb(222 189 135 / 0.42) 0%, rgb(222 189 135 / 0.14) 24%, transparent 62%)`;

  const canAnimate = () =>
    !reducedMotion &&
    typeof window !== "undefined" &&
    window.matchMedia(desktopPointerQuery).matches;

  const resetCard = () => {
    pointerX.set(0);
    pointerY.set(0);
    hoverProgress.set(0);
  };

  const handlePointerEnter = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "mouse" || !canAnimate()) return;
    hoverProgress.set(1);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "mouse" || !canAnimate() || !ref.current) return;

    const rect = ref.current.getBoundingClientRect();
    pointerX.set((event.clientX - rect.left) / rect.width - 0.5);
    pointerY.set((event.clientY - rect.top) / rect.height - 0.5);
  };

  return (
    <div className={cn("[perspective:1200px]", className)}>
      <motion.div
        ref={ref}
        className="relative h-full"
        onPointerEnter={handlePointerEnter}
        onPointerMove={handlePointerMove}
        onPointerLeave={resetCard}
        onPointerCancel={resetCard}
        style={{
          rotateX: reducedMotion ? 0 : rotateX,
          rotateY: reducedMotion ? 0 : rotateY,
          x: reducedMotion ? 0 : x,
          y: reducedMotion ? 0 : y,
          scale: reducedMotion ? 1 : scale,
          z: reducedMotion ? 0 : z,
          transformStyle: "preserve-3d",
        }}
      >
        {children}
        <motion.div
          className="pointer-events-none absolute inset-0 z-20 mix-blend-screen [clip-path:inset(0)]"
          style={{ background: glareBackground, opacity: reducedMotion ? 0 : glareOpacity }}
          aria-hidden="true"
        />
      </motion.div>
    </div>
  );
}
