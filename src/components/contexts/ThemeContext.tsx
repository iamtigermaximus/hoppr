"use client";
import { ThemeProvider as StyledThemeProvider } from "styled-components";
import { darkTheme } from "@/lib/theme";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return <StyledThemeProvider theme={darkTheme}>{children}</StyledThemeProvider>;
}
