"use client";

import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";

export type AdminTheme = "dark" | "light";
export type AdminFontSize = "sm" | "md" | "lg" | "xl";

type AdminThemeContextValue = {
  theme: AdminTheme;
  fontSize: AdminFontSize;
  toggleTheme: () => void;
  setFontSize: (size: AdminFontSize) => void;
};

const AdminThemeContext = createContext<AdminThemeContextValue | null>(null);

const FONT_SIZE_KEY = "studio-admin-font-size";
const THEME_KEY = "studio-admin-theme";

function isFontSize(value: string | null): value is AdminFontSize {
  return value === "sm" || value === "md" || value === "lg" || value === "xl";
}

export function AdminThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<AdminTheme>("light");
  const [fontSize, setFontSize] = useState<AdminFontSize>("md");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const savedTheme = window.localStorage.getItem(THEME_KEY);
    const savedFontSize = window.localStorage.getItem(FONT_SIZE_KEY);
    if (savedTheme === "dark" || savedTheme === "light") {
      setTheme(savedTheme);
    } else setTheme("light");
    if (isFontSize(savedFontSize)) setFontSize(savedFontSize);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    window.localStorage.setItem(THEME_KEY, theme);
  }, [ready, theme]);

  useEffect(() => {
    if (!ready) return;
    window.localStorage.setItem(FONT_SIZE_KEY, fontSize);
  }, [fontSize, ready]);

  const value = useMemo<AdminThemeContextValue>(() => ({
    theme,
    fontSize,
    toggleTheme: () => setTheme((current) => (current === "dark" ? "light" : "dark")),
    setFontSize,
  }), [fontSize, theme]);

  return (
    <AdminThemeContext.Provider value={value}>
      {/* data-theme 与前台 html 的 data-theme 隔离，仅影响 admin 子树 */}
      <div data-admin data-theme={theme} data-font-size={fontSize} style={{ colorScheme: theme }}>
        {children}
      </div>
    </AdminThemeContext.Provider>
  );
}

export function useAdminTheme() {
  const value = useContext(AdminThemeContext);
  if (!value) throw new Error("useAdminTheme must be used within AdminThemeProvider");
  return value;
}
