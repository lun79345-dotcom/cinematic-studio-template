"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Moon, Sun } from "lucide-react";
import { FontSizeMenu } from "@/components/layout/FontSizeMenu";
import { LanguageMenu } from "@/components/layout/LanguageMenu";
import { usePreferences, type ContentFontSize } from "@/components/providers/PreferencesProvider";

const themeIconSizes: Record<ContentFontSize, string> = {
  sm: "size-[18px]",
  md: "size-5",
  lg: "size-[22px]",
  xl: "size-6",
};

export function SiteControls({ tone = "default", hideThemeToggle = false }: { tone?: "default" | "training"; hideThemeToggle?: boolean }) {
  const reduced = useReducedMotion();
  const { contentFontSize, copy, theme, toggleTheme } = usePreferences();
  const themeLabel = theme === "dark" ? copy.a11y.lightTheme : copy.a11y.darkTheme;
  const shortTransition = reduced ? { duration: 0 } : { duration: 0.25, ease: [0.16, 1, 0.3, 1] as const };
  const trainingTone = tone === "training";

  return (
    <div className="flex items-center gap-1" role="group" aria-label={copy.a11y.preferences}>
      <LanguageMenu tone={tone} />
      <span className={`h-4 w-px ${trainingTone ? "bg-[rgb(var(--training-line))]" : "bg-bone/18"}`} aria-hidden="true" />
      <FontSizeMenu tone={tone} />
      {!hideThemeToggle ? (
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={themeLabel}
          title={themeLabel}
          className="group grid size-11 place-items-center text-bone/70 transition-colors duration-300 hover:text-gold focus-visible:text-gold focus-visible:outline-none"
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={theme}
              initial={reduced ? false : { opacity: 0, rotate: theme === "dark" ? -35 : 35, scale: 0.72 }}
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              exit={reduced ? undefined : { opacity: 0, rotate: theme === "dark" ? 35 : -35, scale: 0.72 }}
              transition={shortTransition}
              className="grid size-8 place-items-center"
            >
              {theme === "dark" ? <Sun className={themeIconSizes[contentFontSize]} strokeWidth={1.5} aria-hidden="true" /> : <Moon className={themeIconSizes[contentFontSize]} strokeWidth={1.5} aria-hidden="true" />}
            </motion.span>
          </AnimatePresence>
        </button>
      ) : null}
    </div>
  );
}
