"use client";

import { animate, motion, useInView, useMotionValue, useReducedMotion, useTransform } from "framer-motion";
import { useEffect, useRef } from "react";
import { Container } from "@/components/ui/Container";
import { usePreferences } from "@/components/providers/PreferencesProvider";

function Counter({ value, suffix }: { value: number; suffix: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-15%" });
  const reduced = useReducedMotion();
  const number = useMotionValue(reduced ? value : 0);
  const rounded = useTransform(number, (latest) => Math.round(latest));

  useEffect(() => {
    if (!inView || reduced) return;
    const controls = animate(number, value, { duration: 1.8, ease: [0.16, 1, 0.3, 1] });
    return controls.stop;
  }, [inView, number, reduced, value]);

  return <span ref={ref}><motion.span>{rounded}</motion.span>{suffix}</span>;
}

// 数字只在首次进入视口时增长，并为减少动态偏好直接展示最终值。
export function Stats({ stats = [] }: { stats?: { value: number; suffix: string }[] }) {
  const { copy } = usePreferences();
  if (!stats.length) return null;
  return (
    <section className="border-y border-line/10 bg-panel py-20 sm:py-24">
      <Container className="grid grid-cols-2 gap-x-5 gap-y-12 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <div key={copy.stats[index]} className="border-l border-gold/40 pl-5 sm:pl-7">
            <p className="font-serif text-5xl tracking-tight sm:text-6xl"><Counter value={stat.value} suffix={stat.suffix} /></p>
            <p className="mt-3 text-sm text-mist">{copy.stats[index]}</p>
          </div>
        ))}
      </Container>
    </section>
  );
}
