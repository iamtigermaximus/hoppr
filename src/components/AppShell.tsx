"use client";

import type { ReactNode } from "react";
import NotificationOptInBanner from "@/components/NotificationOptInBanner";

/**
 * Client-side app shell that renders the notification opt-in banner
 * inside the PushNotificationProvider context.
 */
export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <NotificationOptInBanner />
    </>
  );
}
