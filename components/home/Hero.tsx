"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useRef } from "react";
import { HeroVideo } from "@/components/home/HeroVideo";
import { Button } from "@/components/ui/Button";
import { usePreferences } from "@/components/providers/PreferencesProvider";
import type { HeroVideo as HeroVideoItem } from "@/types/hero-video";

// 首页只让视频承担氛围，文字动效负责建立阅读顺序，二者都支持减少动态效果。
export function Hero({ videos, primaryAnchor = "services" }: { videos: HeroVideoItem[]; primaryAnchor?: "services" | "cases" }) {
  const sectionRef = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const { copy, locale } = usePreferences();
  const leadCharacters = Array.from(copy.hero.lead);
  const focusCharacters = Array.from(copy.hero.focus);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end start"] });
  const mediaY = useTransform(scrollYProgress, [0, 1], [0, reduced ? 0 : 72]);
  const copyY = useTransform(scrollYProgress, [0, 1], [0, reduced ? 0 : 38]);
  const reveal = { hidden: { opacity: 1, y: 12 }, visible: { opacity: 1, y: 0 } };

  return (
    <section ref={sectionRef} id="home" className="relative min-h-[100dvh] overflow-hidden pt-[72px]">
      <motion.div style={{ y: mediaY }} className="absolute -inset-y-20 inset-x-0">
        <HeroVideo videos={videos} />
      </motion.div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-3/4 bg-gradient-to-t from-mediaScrim/85 via-mediaScrim/35 to-transparent" aria-hidden="true" />

      <div className="relative flex min-h-[calc(100dvh-72px)] w-full items-end px-5 pb-28 pt-12 sm:px-8 sm:pb-20 lg:px-[clamp(2rem,3vw,4.5rem)] lg:pb-16">
        <motion.div style={{ y: copyY }} className="hero-copy max-w-full text-onMedia [text-shadow:0_1px_18px_rgb(8_7_5_/_0.42)]">
          <motion.p
            initial={reduced ? false : "hidden"}
            animate="visible"
            variants={reveal}
            transition={{ duration: 0.7 }}
            className="mb-5 font-mono text-xs uppercase tracking-[0.2em] text-gold"
          >
            {locale === "zh" ? "Studio Template · 创意工作室模板" : "STUDIO TEMPLATE · CREATIVE FRAMEWORK"}
          </motion.p>
          <motion.h1
            initial={reduced ? false : "hidden"}
            animate="visible"
            variants={reveal}
            transition={{ duration: 0.85, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
            className={`flex flex-wrap items-baseline gap-x-[0.13em] gap-y-2 leading-[1.12] ${locale === "en" ? "text-[clamp(2rem,5.2vw,5.5rem)] font-sans font-[450] tracking-[-0.035em]" : "text-[clamp(2.75rem,6vw,6rem)] font-cn font-medium tracking-[0.01em]"}`}
            aria-label={`${copy.hero.lead}${locale === "en" ? " " : ""}${copy.hero.focus}`}
          >
            <span className="block whitespace-nowrap" aria-hidden="true">
              {leadCharacters.map((character, index) => (
                <motion.span
                  key={`${character}-${index}`}
                  className="inline-block"
                  initial={false}
                  animate={{ opacity: 1, y: 0, rotateX: 0 }}
                  transition={{ duration: 0.78, delay: 0.12 + index * 0.06, ease: [0.16, 1, 0.3, 1] }}
                  style={{ transformOrigin: "50% 100%" }}
                >
                  {character === " " ? "\u00A0" : character}
                </motion.span>
              ))}
            </span>
            <span className="basis-full md:hidden" aria-hidden="true" />
            <span className="relative inline-block whitespace-nowrap pb-[0.09em] text-[0.92em] text-gold" aria-hidden="true">
              {focusCharacters.map((character, index) => (
                <motion.span
                  key={`${character}-${index}`}
                  className="inline-block"
                  initial={false}
                  animate={{ opacity: 1, y: 0, rotateX: 0 }}
                  transition={{ duration: 0.82, delay: 0.34 + index * 0.07, ease: [0.16, 1, 0.3, 1] }}
                  style={{ transformOrigin: "50% 100%" }}
                >
                  {character === " " ? "\u00A0" : character}
                </motion.span>
              ))}
              <motion.span
                className="absolute bottom-0 left-[0.08em] h-px w-[92%] origin-left bg-gold"
                initial={reduced ? false : { scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 1, delay: 0.62, ease: [0.16, 1, 0.3, 1] }}
              />
            </span>
          </motion.h1>
          <motion.p
            initial={reduced ? false : "hidden"}
            animate="visible"
            variants={reveal}
            transition={{ duration: 0.75, delay: 0.18 }}
            className="mt-7 max-w-[36em] text-pretty text-base leading-7 text-onMedia/90 sm:text-lg"
          >
            {copy.hero.description}
          </motion.p>
          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2">
            <Button href="/contact" className="!text-mediaScrim [text-shadow:none]">{copy.hero.consultation}</Button>
            <a href={`#${primaryAnchor}`} className="inline-flex min-h-12 items-center gap-2 text-sm text-onMedia underline-offset-4 hover:underline">
              {primaryAnchor === "services" ? copy.hero.scrollLabel : copy.nav.cases}
              <ChevronDown className="size-4" aria-hidden="true" />
            </a>
          </div>
        </motion.div>
      </div>

      <motion.a
        href={`#${primaryAnchor}`}
        aria-label={primaryAnchor === "services" ? copy.a11y.scrollServices : copy.nav.cases}
        initial={reduced ? false : { opacity: 1, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.72 }}
        className="group absolute bottom-6 right-5 z-10 flex min-h-12 items-center gap-2.5 text-onMedia sm:bottom-8 sm:right-8 lg:right-[clamp(2rem,3vw,4.5rem)]"
      >
        <span className="grid size-7 place-items-center transition-transform duration-300 group-hover:translate-y-0.5">
          <motion.span animate={reduced ? undefined : { y: [0, 4, 0] }} transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}>
            <ChevronDown className="size-5" strokeWidth={1.5} aria-hidden="true" />
          </motion.span>
        </span>
      </motion.a>
    </section>
  );
}
