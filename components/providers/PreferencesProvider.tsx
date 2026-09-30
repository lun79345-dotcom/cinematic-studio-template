"use client";

import { createContext, ReactNode, useContext, useEffect, useLayoutEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { Locale, messages } from "@/lib/i18n";

export type Theme = "dark" | "light";
export type ContentFontSize = "sm" | "md" | "lg" | "xl";

type PreferencesContextValue = {
  locale: Locale;
  theme: Theme;
  contentFontSize: ContentFontSize;
  copy: (typeof messages)[Locale];
  toggleLocale: () => void;
  toggleTheme: () => void;
  setLocale: (locale: Locale) => void;
  setContentFontSize: (size: ContentFontSize) => void;
};

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [locale, setLocale] = useState<Locale>("zh");
  const [siteTheme, setSiteTheme] = useState<Theme>("dark");
  const [pageTheme, setPageTheme] = useState<{ pathname: string; theme: Theme }>({ pathname, theme: "light" });
  const isNews = pathname === "/news" || pathname.startsWith("/news/");
  // Each news route starts light; a manual toggle applies to the current route only.
  if (pageTheme.pathname !== pathname) setPageTheme({ pathname, theme: "light" });
  const theme = isNews ? (pageTheme.pathname === pathname ? pageTheme.theme : "light") : siteTheme;
  const [contentFontSize, setContentFontSize] = useState<ContentFontSize>("md");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const savedLocale = window.localStorage.getItem("studio-locale");
    const savedTheme = window.localStorage.getItem("studio-theme");
    const savedFontSize = window.localStorage.getItem("studio-content-font-size");
    if (savedLocale === "zh" || savedLocale === "en") setLocale(savedLocale);
    if (savedTheme === "dark" || savedTheme === "light") setSiteTheme(savedTheme);
    if (savedFontSize === "sm" || savedFontSize === "md" || savedFontSize === "lg" || savedFontSize === "xl") setContentFontSize(savedFontSize);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    document.documentElement.lang = locale === "zh" ? "zh-CN" : "en";
    window.localStorage.setItem("studio-locale", locale);
  }, [locale, ready]);

  useLayoutEffect(() => {
    if (!ready && !isNews) return;
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
  }, [isNews, ready, theme]);

  useEffect(() => {
    if (!ready) return;
    window.localStorage.setItem("studio-theme", siteTheme);
  }, [ready, siteTheme]);

  useEffect(() => {
    if (!ready) return;
    document.documentElement.dataset.contentSize = contentFontSize;
    window.localStorage.setItem("studio-content-font-size", contentFontSize);
  }, [contentFontSize, ready]);

  useEffect(() => {
    if (!ready || contentFontSize === "sm") return;

    const contentDelta = contentFontSize === "md" ? 2 : contentFontSize === "lg" ? 4 : 6;
    const headingDelta = contentFontSize === "xl" ? 2 : 0;
    const originalSizes = new Map<HTMLElement, string>();
    let animationFrame = 0;

    const contentSelector = [
      "p", "li", "label", "input", "textarea", "select", "button", "a", "dt", "dd", "figcaption", "td", "th",
      ".site-nav-type", ".marketing-meta", ".marketing-copy", ".service-feature-copy", ".case-card-copy",
      '[class*="text-"]',
    ].join(",");

    function restoreOriginal(element: HTMLElement) {
      const original = originalSizes.get(element);
      if (original) element.style.fontSize = original;
      else element.style.removeProperty("font-size");
    }

    function refreshFontSizes() {
      window.cancelAnimationFrame(animationFrame);
      animationFrame = window.requestAnimationFrame(() => {
        const contentElements = Array.from(document.querySelectorAll<HTMLElement>(contentSelector)).filter((element) => (
          !element.closest("[data-admin]")
          && !element.closest("[data-font-size-control]")
          && !element.closest("h1, h2, h3, h4, h5, h6")
        ));
        const headingElements = headingDelta
          ? Array.from(document.querySelectorAll<HTMLElement>("h1, h2, h3, h4, h5, h6")).filter((element) => !element.closest("[data-admin]"))
          : [];
        const elements = Array.from(new Set([...contentElements, ...headingElements]));

        elements.forEach((element) => {
          if (!originalSizes.has(element)) originalSizes.set(element, element.style.fontSize);
          restoreOriginal(element);
        });

        const computedSizes = new Map(elements.map((element) => [element, Number.parseFloat(window.getComputedStyle(element).fontSize)]));
        elements.forEach((element) => {
          const baseSize = computedSizes.get(element);
          if (!baseSize || Number.isNaN(baseSize)) return;
          element.style.fontSize = `${baseSize + (element.matches("h1, h2, h3, h4, h5, h6") ? headingDelta : contentDelta)}px`;
        });
      });
    }

    const observer = new MutationObserver(refreshFontSizes);
    observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener("resize", refreshFontSizes);
    refreshFontSizes();

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", refreshFontSizes);
      window.cancelAnimationFrame(animationFrame);
      originalSizes.forEach((_original, element) => restoreOriginal(element));
    };
  }, [contentFontSize, ready]);

  const value = useMemo<PreferencesContextValue>(() => ({
    locale,
    theme,
    contentFontSize,
    copy: messages[locale],
    toggleLocale: () => setLocale((current) => current === "zh" ? "en" : "zh"),
    toggleTheme: () => {
      if (isNews) setPageTheme({ pathname, theme: theme === "dark" ? "light" : "dark" });
      else setSiteTheme((current) => current === "dark" ? "light" : "dark");
    },
    setLocale,
    setContentFontSize,
  }), [contentFontSize, isNews, locale, pathname, theme]);

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences() {
  const value = useContext(PreferencesContext);
  if (!value) throw new Error("usePreferences must be used within PreferencesProvider");
  return value;
}
