"use client";

import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from "framer-motion";
import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type BeamOptions = {
  x: string;
  duration: number;
  delay?: number;
  repeatDelay?: number;
  height?: number;
  opacity?: number;
};

const BEAMS: BeamOptions[] = [
  { x: "7%", duration: 8.4, delay: 1.2, repeatDelay: 2.4, height: 52, opacity: 0.58 },
  { x: "21%", duration: 5.8, delay: 3.8, repeatDelay: 3.1, height: 28, opacity: 0.42 },
  { x: "36%", duration: 9.6, delay: 0.4, repeatDelay: 4.8, height: 72, opacity: 0.68 },
  { x: "50%", duration: 7.2, delay: 4.6, repeatDelay: 2.8, height: 42, opacity: 0.46 },
  { x: "64%", duration: 10.8, delay: 2.4, repeatDelay: 2.2, height: 82, opacity: 0.62 },
  { x: "79%", duration: 6.4, delay: 5.2, repeatDelay: 3.6, height: 34, opacity: 0.5 },
  { x: "93%", duration: 8.8, delay: 1.8, repeatDelay: 4.2, height: 58, opacity: 0.6 },
];

export function BackgroundBeamsWithCollision({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const parentRef = useRef<HTMLDivElement>(null);
  const collisionPlaneRef = useRef<HTMLDivElement>(null);
  const [travelDistance, setTravelDistance] = useState(1200);

  useEffect(() => {
    const parent = parentRef.current;
    if (!parent) return;

    const measure = () => setTravelDistance(Math.max(parent.offsetHeight + 220, 900));
    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(parent);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={parentRef}
      className={cn("relative w-full overflow-hidden", className)}
    >
      <div className="pointer-events-none absolute inset-0 z-0" aria-hidden="true">
        {BEAMS.map((beam) => (
          <CollisionBeam
            key={beam.x}
            options={beam}
            parentRef={parentRef}
            collisionPlaneRef={collisionPlaneRef}
            travelDistance={travelDistance}
          />
        ))}
        <div
          ref={collisionPlaneRef}
          className="absolute inset-x-0 bottom-0 h-px bg-gold/20"
          style={{ boxShadow: "0 0 24px rgb(var(--color-accent) / 0.18)" }}
        />
      </div>

      <div className="relative z-10">{children}</div>
    </div>
  );
}

function CollisionBeam({
  options,
  parentRef,
  collisionPlaneRef,
  travelDistance,
}: {
  options: BeamOptions;
  parentRef: React.RefObject<HTMLDivElement | null>;
  collisionPlaneRef: React.RefObject<HTMLDivElement | null>;
  travelDistance: number;
}) {
  const reducedMotion = useReducedMotion();
  const beamRef = useRef<HTMLDivElement>(null);
  const [beamKey, setBeamKey] = useState(0);
  const [cycleCollisionDetected, setCycleCollisionDetected] = useState(false);
  const [collision, setCollision] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (reducedMotion) return;

    const interval = window.setInterval(() => {
      if (
        cycleCollisionDetected ||
        !beamRef.current ||
        !collisionPlaneRef.current ||
        !parentRef.current
      ) {
        return;
      }

      const beamRect = beamRef.current.getBoundingClientRect();
      const planeRect = collisionPlaneRef.current.getBoundingClientRect();
      const parentRect = parentRef.current.getBoundingClientRect();

      if (beamRect.bottom >= planeRect.top) {
        setCollision({
          x: beamRect.left - parentRect.left + beamRect.width / 2,
          y: planeRect.top - parentRect.top,
        });
        setCycleCollisionDetected(true);
      }
    }, 50);

    return () => window.clearInterval(interval);
  }, [collisionPlaneRef, cycleCollisionDetected, parentRef, reducedMotion]);

  useEffect(() => {
    if (!collision) return;

    const clearExplosion = window.setTimeout(() => setCollision(null), 1500);
    const restartBeam = window.setTimeout(() => {
      setCycleCollisionDetected(false);
      setBeamKey((key) => key + 1);
    }, 1650);

    return () => {
      window.clearTimeout(clearExplosion);
      window.clearTimeout(restartBeam);
    };
  }, [collision]);

  return (
    <>
      <motion.div
        key={`${beamKey}-${travelDistance}`}
        ref={beamRef}
        initial={{ y: -140 }}
        animate={{ y: reducedMotion ? -20 : travelDistance }}
        transition={
          reducedMotion
            ? { duration: 0 }
            : {
                duration: options.duration,
                repeat: Infinity,
                repeatType: "loop",
                ease: "linear",
                delay: options.delay ?? 0,
                repeatDelay: options.repeatDelay ?? 0,
              }
        }
        className="absolute top-0 w-px rounded-full"
        style={{
          left: options.x,
          height: options.height ?? 56,
          opacity: options.opacity ?? 0.6,
          background:
            "linear-gradient(to top, rgb(var(--color-accent)), rgb(var(--color-accent-hover) / 0.72), transparent)",
          boxShadow: "0 0 10px rgb(var(--color-accent) / 0.3)",
        }}
      />

      <AnimatePresence>
        {collision ? (
          <Explosion
            key={`${collision.x}-${collision.y}`}
            x={collision.x}
            y={collision.y}
          />
        ) : null}
      </AnimatePresence>
    </>
  );
}

function Explosion({ x, y }: { x: number; y: number }) {
  const particles = Array.from({ length: 18 }, (_, index) => {
    const angle = Math.PI + (Math.PI * index) / 17;
    const distance = 22 + ((index * 17) % 34);
    return {
      id: index,
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance - 7,
      duration: 0.62 + (index % 5) * 0.12,
    };
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="absolute z-20 size-2"
      style={{ left: x, top: y, transform: "translate(-50%, -50%)" }}
    >
      <motion.div
        initial={{ opacity: 0, scaleX: 0.2 }}
        animate={{ opacity: [0, 1, 0], scaleX: [0.2, 1, 1.35] }}
        transition={{ duration: 1.15, ease: "easeOut" }}
        className="absolute left-1/2 top-0 h-1 w-16 -translate-x-1/2 rounded-full blur-[2px]"
        style={{
          background:
            "linear-gradient(to right, transparent, rgb(var(--color-accent-hover)), transparent)",
        }}
      />
      {particles.map((particle) => (
        <motion.span
          key={particle.id}
          initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
          animate={{
            x: particle.x,
            y: particle.y,
            opacity: 0,
            scale: 0.45,
          }}
          transition={{ duration: particle.duration, ease: "easeOut" }}
          className="absolute size-1 rounded-full bg-gold"
          style={{ boxShadow: "0 0 6px rgb(var(--color-accent-hover) / 0.7)" }}
        />
      ))}
    </motion.div>
  );
}
