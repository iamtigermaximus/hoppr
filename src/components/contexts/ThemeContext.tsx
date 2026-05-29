"use client";
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { ThemeProvider as StyledThemeProvider } from "styled-components";
import { darkTheme, lightTheme, type AppTheme } from "@/lib/theme";

interface ThemeContextType {
  theme: AppTheme;
  isDark: boolean;
  toggle: () => void;
}

const ThemeCtx = createContext<ThemeContextType>({
  theme: darkTheme,
  isDark: true,
  toggle: () => {},
});

export function useThemeToggle() {
  return useContext(ThemeCtx);
}

function applyCSSVars(theme: AppTheme) {
  const root = document.documentElement;
  const c = theme.colors;
  root.style.setProperty("--color-bg", c.bg);
  root.style.setProperty("--color-surface", c.surface);
  root.style.setProperty("--color-card", c.card);
  root.style.setProperty("--color-card-hover", c.cardHover);
  root.style.setProperty("--color-card-border", c.cardBorder);
  root.style.setProperty("--color-primary", c.primary);
  root.style.setProperty("--color-text-primary", c.textPrimary);
  root.style.setProperty("--color-text-secondary", c.textSecondary);
  root.style.setProperty("--color-text-muted", c.textMuted);
  root.style.setProperty("--color-header-bg", c.headerBg);
  root.style.setProperty("--color-header-border", c.headerBorder);
  root.style.setProperty("--color-input-bg", c.inputBg);
  root.style.setProperty("--color-input-border", c.inputBorder);
  document.body.style.backgroundColor = c.bg;
  document.body.style.color = c.textPrimary;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(true);
  const theme = isDark ? darkTheme : lightTheme;

  useEffect(() => {
    const saved = localStorage.getItem("hoppr-theme");
    if (saved === "light") setIsDark(false);
  }, []);

  useEffect(() => {
    applyCSSVars(theme);
    localStorage.setItem("hoppr-theme", isDark ? "dark" : "light");
  }, [theme, isDark]);

  const toggle = useCallback(() => setIsDark(prev => !prev), []);

  return (
    <ThemeCtx.Provider value={{ theme, isDark, toggle }}>
      <StyledThemeProvider theme={theme}>{children}</StyledThemeProvider>
    </ThemeCtx.Provider>
  );
}
