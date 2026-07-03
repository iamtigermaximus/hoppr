"use client";

import type { ReactNode } from "react";

/**
 * Client-side app shell. Notification opt-in is rendered directly on
 * the home page rather than here so it doesn't appear on every route.
 */
export default function AppShell({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
