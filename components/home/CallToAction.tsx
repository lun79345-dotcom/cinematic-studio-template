"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { usePreferences } from "@/components/providers/PreferencesProvider";

// 收尾 CTA 用单一高对比动作聚焦转化，几何块仅提供缓慢的空间感。
export function CallToAction() {
  const reduced = useReducedMotion();
  const { copy } = usePreferences();
  return (
    <section id="contact" className="relative overflow-hidden py-28 sm:py-36 lg:py-44">
      <div aria-hidden="true" className="absolute inset-0 bg-stage-grid bg-[size:64px_64px] opacity-40" />
      <motion.div
        aria-hidden="true"
        animate={reduced ? undefined : { rotate: [8, 16, 8], y: [0, -18, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -right-20 top-8 size-72 rounded-card border border-gold/20 bg-gold/[0.035]"
      />
      <Container className="relative">
        <Reveal className="mx-auto flex max-w-4xl flex-col items-center text-center">
          <h2 className="text-balance font-serif text-6xl leading-[0.98] tracking-tight sm:text-7xl lg:text-8xl">{copy.cta.title}<br /><span className="italic text-gold">{copy.cta.focus}</span></h2>
          <p className="mt-7 text-mist">{copy.cta.description}</p>
          <Button href="/contact" className="mt-9">{copy.cta.button}</Button>
        </Reveal>
      </Container>
    </section>
  );
}
