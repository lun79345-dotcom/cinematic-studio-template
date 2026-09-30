"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, Check, ChevronDown } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { usePreferences } from "@/components/providers/PreferencesProvider";
import type { ServiceNavigationItem } from "@/types/home-content";

type ServiceMenuProps = {
  services: ServiceNavigationItem[];
  mobile?: boolean;
  onNavigate?: () => void;
  tone?: "default" | "training";
};

export function ServiceMenu({ services, mobile = false, onNavigate, tone = "default" }: ServiceMenuProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const reduced = useReducedMotion();
  const { copy, locale } = usePreferences();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeTimerRef = useRef<number | null>(null);
  const current = services.find((service) => pathname === `/services/${service.slug}`);
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
    if (!open || mobile) return;

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
  }, [mobile, open]);

  useEffect(() => () => clearCloseTimer(), []);

  if (mobile) {
    return (
      <div className={`border-b py-3 ${trainingTone ? "border-[rgb(var(--training-line))]" : "border-line/10"}`}>
        <label htmlFor="mobile-service-select" className={`block text-sm font-medium ${trainingTone ? "text-[rgb(var(--training-blue))]" : "text-gold"}`}>{copy.nav.services}</label>
        <div className="relative mt-2">
          <select
            id="mobile-service-select"
            value={current?.slug ?? ""}
            onChange={(event) => {
              if (!event.target.value) return;
              onNavigate?.();
              router.push(`/services/${event.target.value}`);
            }}
            className={`min-h-12 w-full appearance-none rounded-control border px-4 pr-11 text-base outline-none transition-colors ${trainingTone ? "border-[rgb(var(--training-line))] bg-white text-[rgb(var(--training-ink))] focus:border-[rgb(var(--training-blue))]" : "border-gold/25 bg-panel text-bone focus:border-gold"}`}
          >
            <option value="" disabled>{copy.serviceMenu.select}</option>
            {services.map((service) => <option key={service.slug} value={service.slug}>{service.name[locale] || service.name.zh}</option>)}
          </select>
          <ChevronDown className={`pointer-events-none absolute right-4 top-1/2 size-5 -translate-y-1/2 ${trainingTone ? "text-[rgb(var(--training-blue))]" : "text-gold"}`} strokeWidth={1.5} aria-hidden="true" />
        </div>
      </div>
    );
  }

  return (
    <div
      ref={rootRef}
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
        aria-expanded={open}
        aria-controls="desktop-service-menu"
        onClick={(event) => {
          clearCloseTimer();
          setOpen((value) => event.detail === 0 ? !value : true);
        }}
        className={`site-nav-type inline-flex min-h-11 items-center gap-1.5 transition-colors duration-300 ${trainingTone ? (open ? "text-[rgb(var(--training-blue))]" : "text-[rgb(var(--training-ink)/0.74)] hover:text-[rgb(var(--training-blue))]") : (open ? "text-gold" : "text-bone/72 hover:text-gold")}`}
      >
        {copy.nav.services}
        <ChevronDown className={`size-4 transition-transform ${open ? "rotate-180" : ""}`} strokeWidth={1.5} aria-hidden="true" />
      </button>

      <AnimatePresence>
        {open ? (
          <motion.nav
            id="desktop-service-menu"
            aria-label={copy.nav.services}
            initial={reduced ? false : { opacity: 0, y: -10, clipPath: "inset(0 0 10% 0)" }}
            animate={{ opacity: 1, y: 0, clipPath: "inset(0 0 0% 0)" }}
            exit={reduced ? undefined : { opacity: 0, y: -8, clipPath: "inset(0 0 8% 0)" }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className={`fixed inset-x-6 top-[70px] max-h-[calc(100dvh-92px)] origin-top overflow-y-auto overscroll-contain border backdrop-blur-2xl min-[1920px]:inset-x-8 ${trainingTone ? "border-[rgb(var(--training-line))] bg-[rgb(var(--training-canvas)/0.97)] shadow-[0_20px_60px_rgb(var(--training-dark)/0.14)]" : "border-gold/45 bg-ink/[0.9]"}`}
          >
            <div className="grid lg:grid-cols-[minmax(220px,0.85fr)_minmax(0,3.15fr)]">
              <div className="flex min-h-[320px] flex-col justify-between p-6 min-[1920px]:min-h-[340px] min-[1920px]:p-8">
                <h2 className={`text-balance font-serif text-2xl leading-tight min-[1920px]:text-3xl ${trainingTone ? "text-[rgb(var(--training-blue))]" : "text-gold"}`}>{copy.serviceMenu.title}</h2>
                <p className={`mt-10 max-w-[32ch] text-pretty text-sm leading-6 min-[1920px]:text-base min-[1920px]:leading-7 ${trainingTone ? "text-[rgb(var(--training-muted))]" : "text-bone/68"}`}>{copy.serviceMenu.description}</p>
              </div>

              <div className="grid grid-cols-2 xl:grid-cols-4">
                {services.map((service, index) => {
                  const active = pathname === `/services/${service.slug}`;
                  return (
                    <Link
                      key={service.slug}
                      href={`/services/${service.slug}`}
                      aria-current={active ? "page" : undefined}
                      onClick={() => {
                        clearCloseTimer();
                        setOpen(false);
                      }}
                      className={`group flex min-h-[320px] flex-col border-l p-5 transition-colors duration-300 ease-expo ${trainingTone ? "border-[rgb(var(--training-line))] focus-visible:bg-[rgb(var(--training-blue)/0.09)]" : "border-gold/20 focus-visible:bg-gold/[0.09]"} ${index >= 2 ? "border-t" : ""} ${index === 2 || index === 3 ? "xl:border-t-0" : ""} min-[1920px]:min-h-[340px] min-[1920px]:p-7 ${trainingTone ? (active ? "bg-[rgb(var(--training-blue)/0.09)]" : "hover:bg-[rgb(var(--training-blue)/0.05)]") : (active ? "bg-gold/[0.12]" : "hover:bg-gold/[0.07]")}`}
                    >
                      <span className="flex items-start justify-between gap-5">
                        <strong className={`text-balance text-base font-medium leading-snug min-[1920px]:text-lg ${trainingTone ? (active ? "text-[rgb(var(--training-blue))]" : "text-[rgb(var(--training-ink))] group-hover:text-[rgb(var(--training-blue))]") : (active ? "text-gold" : "text-bone group-hover:text-gold")}`}>{service.name[locale] || service.name.zh}</strong>
                        {active ? <Check className={`mt-0.5 size-4 shrink-0 ${trainingTone ? "text-[rgb(var(--training-blue))]" : "text-gold"}`} strokeWidth={1.6} aria-hidden="true" /> : <ArrowUpRight className={`mt-0.5 size-4 shrink-0 transition-transform duration-300 ease-expo group-hover:-translate-y-0.5 group-hover:translate-x-0.5 ${trainingTone ? "text-[rgb(var(--training-blue)/0.45)] group-hover:text-[rgb(var(--training-blue))]" : "text-gold/45 group-hover:text-gold"}`} strokeWidth={1.5} aria-hidden="true" />}
                      </span>
                      <span className={`mt-8 text-pretty text-sm leading-6 transition-colors duration-300 ${trainingTone ? "text-[rgb(var(--training-muted))] group-hover:text-[rgb(var(--training-ink)/0.82)]" : "text-bone/72 group-hover:text-bone/88"}`}>{service.description[locale] || service.description.zh}</span>
                      <span className={`mt-6 space-y-2.5 border-t pt-5 text-xs leading-5 transition-colors duration-300 ${trainingTone ? "border-[rgb(var(--training-line))] text-[rgb(var(--training-muted)/0.78)] group-hover:text-[rgb(var(--training-muted))]" : "border-gold/15 text-bone/52 group-hover:text-bone/72"}`}>
                        {(service.features[locale]?.length ? service.features[locale] : service.features.zh).slice(0, 3).map((feature) => (
                          <span key={feature} className="flex gap-2.5">
                            <span className={`mt-[0.6rem] h-px w-3 shrink-0 ${trainingTone ? "bg-[rgb(var(--training-blue)/0.45)]" : "bg-gold/45"}`} aria-hidden="true" />
                            <span>{feature}</span>
                          </span>
                        ))}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </motion.nav>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
