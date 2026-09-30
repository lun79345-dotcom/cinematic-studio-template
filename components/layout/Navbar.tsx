"use client";

import { AnimatePresence, motion, useMotionValueEvent, useReducedMotion, useScroll } from "framer-motion";
import { ArrowUpRight, Menu, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { ServiceMenu } from "@/components/layout/ServiceMenu";
import { SiteControls } from "@/components/layout/SiteControls";
import { usePreferences } from "@/components/providers/PreferencesProvider";
import type { ServiceNavigationItem } from "@/types/home-content";

// 导航通过 Motion 的滚动值切换毛玻璃状态，避免监听原生 scroll 事件。
export function Navbar({ services, tone = "default" }: { services: ServiceNavigationItem[]; tone?: "default" | "training" }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { scrollY } = useScroll();
  const reduced = useReducedMotion();
  const { copy, theme } = usePreferences();
  const dropdownServices = services.filter((service) => service.showInNavigation);
  const leadingLinks = [
    [copy.nav.home, "/#home"],
    [copy.nav.news, "/news"],
    [copy.nav.cases, "/#cases"],
  ] as const;
  const trailingLinks = [
    [copy.nav.contact, "/contact"],
  ] as const;
  const trainingTone = tone === "training";
  const navLinkClass = trainingTone
    ? "site-nav-type text-[rgb(var(--training-ink)/0.74)] transition-colors hover:text-[rgb(var(--training-blue))]"
    : "site-nav-type text-bone/72 transition-colors hover:text-gold";

  useMotionValueEvent(scrollY, "change", (latest) => setScrolled(latest > 40));

  return (
    <header className="fixed inset-x-0 top-0 z-40">
      <div
        className={`relative z-10 h-[72px] border-b transition-colors duration-300 ${trainingTone ? "border-[rgb(var(--training-line))] bg-[rgb(var(--training-canvas))]" : scrolled || open ? "border-gold/15 bg-ink/[0.88] backdrop-blur-xl" : theme === "light" ? "border-gold/10 bg-ink/[0.76] backdrop-blur-xl" : "border-transparent bg-ink/0"}`}
      >
        <div className="relative flex h-full w-full items-center justify-between px-5 sm:px-8 lg:px-[clamp(2rem,3vw,4.5rem)]">
          <Link href="/" aria-label={copy.a11y.home} className="flex items-center">
            <BrandLogo className="h-auto w-[118px] sm:w-[158px] min-[1920px]:w-[176px]" priority />
          </Link>

          <div className="flex items-center gap-1.5 lg:gap-7 min-[1920px]:gap-10">
            <nav className="hidden items-center gap-7 lg:flex min-[1920px]:gap-10" aria-label={copy.a11y.mainNav}>
              {leadingLinks.map(([label, href]) => <Link key={href} href={href} className={navLinkClass}>{label}</Link>)}
              {dropdownServices.length ? <ServiceMenu services={dropdownServices} tone={tone} /> : null}
              {trailingLinks.map(([label, href]) => <Link key={href} href={href} className={navLinkClass}>{label}</Link>)}
            </nav>
            <span className={`hidden h-4 w-px lg:block ${trainingTone ? "bg-[rgb(var(--training-line))]" : "bg-bone/15"}`} aria-hidden="true" />
            <SiteControls tone={tone} hideThemeToggle={trainingTone} />
            <button
              type="button"
              className={`grid size-11 place-items-center rounded-full border lg:hidden ${trainingTone ? "border-[rgb(var(--training-blue)/0.32)] text-[rgb(var(--training-blue))]" : "border-gold/25 text-gold"}`}
              onClick={() => setOpen((value) => !value)}
              aria-expanded={open}
              aria-label={open ? copy.a11y.closeMenu : copy.a11y.openMenu}
            >
              {open ? <X className="size-5" strokeWidth={1.5} /> : <Menu className="size-5" strokeWidth={1.5} />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={reduced ? false : { opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className={`max-h-[calc(100dvh-72px)] overflow-y-auto border-t backdrop-blur-2xl lg:hidden ${trainingTone ? "border-[rgb(var(--training-line))] bg-[rgb(var(--training-canvas)/0.98)] text-[rgb(var(--training-ink))]" : "border-line/10 bg-ink/95"}`}
          >
            <Container className="flex min-h-[calc(100dvh-72px)] flex-col justify-center py-12">
              <nav className="flex flex-col" aria-label={copy.a11y.mobileNav}>
                {leadingLinks.map(([label, href], index) => (
                  <motion.div
                    key={href}
                    initial={reduced ? false : { opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link
                      href={href}
                      onClick={() => setOpen(false)}
                      className={`block border-b py-4 font-serif text-4xl ${trainingTone ? "border-[rgb(var(--training-line))]" : "border-line/10"}`}
                    >
                      {label}
                    </Link>
                  </motion.div>
                ))}
                <motion.div
                  initial={reduced ? false : { opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  {dropdownServices.length ? <ServiceMenu services={dropdownServices} mobile tone={tone} onNavigate={() => setOpen(false)} /> : null}
                </motion.div>
                {trailingLinks.map(([label, href], index) => (
                  <motion.div
                    key={href}
                    initial={reduced ? false : { opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: (index + 3) * 0.05 }}
                  >
                    <Link href={href} onClick={() => setOpen(false)} className={`block border-b py-4 font-serif text-4xl ${trainingTone ? "border-[rgb(var(--training-line))]" : "border-line/10"}`}>
                      {label}
                    </Link>
                  </motion.div>
                ))}
              </nav>
              {trainingTone ? (
                <Link href="/contact" className="mt-10 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-control border border-[rgb(var(--training-blue))] bg-[rgb(var(--training-blue))] px-5 text-sm font-medium text-white transition-colors hover:border-[rgb(var(--training-blue-hover))] hover:bg-[rgb(var(--training-blue-hover))]">
                  {copy.nav.start}<ArrowUpRight className="size-4" strokeWidth={1.5} aria-hidden="true" />
                </Link>
              ) : <Button href="/contact" className="mt-10 w-full">{copy.nav.start}</Button>}
            </Container>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
