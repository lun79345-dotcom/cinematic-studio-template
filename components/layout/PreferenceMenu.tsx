"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check } from "lucide-react";
import { type ReactNode, useEffect, useRef, useState } from "react";

type PreferenceOption<T extends string> = {
  value: T;
  label: string;
  selected: boolean;
};

type PreferenceMenuProps<T extends string> = {
  id: string;
  ariaLabel: string;
  trigger: ReactNode;
  options: PreferenceOption<T>[];
  onSelect: (value: T) => void;
  tone?: "default" | "training";
};

export function PreferenceMenu<T extends string>({ id, ariaLabel, trigger, options, onSelect, tone = "default" }: PreferenceMenuProps<T>) {
  const [open, setOpen] = useState(false);
  const reduced = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeTimerRef = useRef<number | null>(null);
  const trainingTone = tone === "training";

  function clearCloseTimer() {
    if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
    closeTimerRef.current = null;
  }

  function openMenu() {
    clearCloseTimer();
    setOpen(true);
  }

  function scheduleClose() {
    clearCloseTimer();
    closeTimerRef.current = window.setTimeout(() => setOpen(false), 140);
  }

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  useEffect(() => () => clearCloseTimer(), []);

  return (
    <div
      ref={rootRef}
      data-font-size-control
      className="relative"
      onPointerEnter={(event) => {
        if (event.pointerType === "mouse") openMenu();
      }}
      onPointerLeave={(event) => {
        if (event.pointerType === "mouse") scheduleClose();
      }}
      onFocusCapture={openMenu}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) scheduleClose();
      }}
    >
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={id}
        aria-label={ariaLabel}
        title={ariaLabel}
        onClick={openMenu}
        className={`group grid h-11 min-w-11 place-items-center px-1.5 transition-colors duration-300 focus-visible:outline-none ${trainingTone ? (open ? "text-[rgb(var(--training-blue))]" : "text-[rgb(var(--training-ink)/0.72)] hover:text-[rgb(var(--training-blue))]") : (open ? "text-gold" : "text-bone/70 hover:text-gold")}`}
      >
        {trigger}
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            id={id}
            role="menu"
            aria-label={ariaLabel}
            initial={reduced ? false : { opacity: 0, x: "-50%", y: -8, clipPath: "inset(0 0 12% 0)" }}
            animate={{ opacity: 1, x: "-50%", y: 0, clipPath: "inset(0 0 0% 0)" }}
            exit={reduced ? undefined : { opacity: 0, x: "-50%", y: -6, clipPath: "inset(0 0 10% 0)" }}
            transition={{ duration: reduced ? 0 : 0.22, ease: [0.16, 1, 0.3, 1] }}
            className={`absolute left-1/2 top-[calc(100%+4px)] w-40 border p-1.5 backdrop-blur-2xl ${trainingTone ? "border-[rgb(var(--training-line))] bg-[rgb(var(--training-canvas)/0.97)] shadow-[0_16px_40px_rgb(var(--training-dark)/0.12)]" : "border-gold/35 bg-ink/[0.92]"}`}
          >
            {options.map((option, index) => (
              <button
                key={option.value}
                type="button"
                role="menuitemradio"
                aria-checked={option.selected}
                onClick={() => {
                  onSelect(option.value);
                  setOpen(false);
                }}
                className={`flex min-h-11 w-full items-center justify-between gap-3 px-3 text-left transition-colors duration-200 ${trainingTone ? (option.selected ? "bg-[rgb(var(--training-blue)/0.09)] text-[rgb(var(--training-blue))]" : "text-[rgb(var(--training-muted))] hover:bg-[rgb(var(--training-blue)/0.05)] hover:text-[rgb(var(--training-ink))]") : (option.selected ? "bg-gold/[0.12] text-gold" : "text-bone/68 hover:bg-gold/[0.07] hover:text-bone")}`}
              >
                <span className="flex items-baseline gap-3">
                  <span className={`w-5 font-mono text-[10px] ${trainingTone ? "text-[rgb(var(--training-blue)/0.62)]" : "text-gold/55"}`}>{String(index + 1).padStart(2, "0")}</span>
                  <span className="text-sm font-medium">{option.label}</span>
                </span>
                {option.selected ? <Check className="size-4 shrink-0" strokeWidth={1.6} aria-hidden="true" /> : null}
              </button>
            ))}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
