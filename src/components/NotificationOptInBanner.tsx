"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { usePushNotifications } from "@/components/contexts/PushNotificationProvider";
import { isEligibleForPushOptIn } from "@/lib/push-eligibility";

const DISMISSED_KEY = "push_optin_dismissed";
const DISMISSED_SESSION_KEY = "push_optin_dismissed_session";

/**
 * Notification opt-in banner shown to users who:
 * - Have completed onboarding
 * - Have a browser that supports push
 * - Haven't granted or denied permission yet (default state)
 * - Haven't dismissed the banner (in this session or within 7 days)
 * - Have completed a meaningful action (viewed a promo, followed a bar, etc.)
 */
export default function NotificationOptInBanner() {
  const { data: session, status } = useSession();
  const { supported, permission, requestPermission, loading } =
    usePushNotifications();
  const [visible, setVisible] = useState(false);
  const [dismissing, setDismissing] = useState(false);

  const onboardingCompleted = (session?.user as Record<string, unknown> | undefined)
    ?.onboardingCompleted as boolean | undefined;

  useEffect(() => {
    // Don't ask during onboarding — wait until the user is settled on the home feed
    if (status !== "authenticated" || onboardingCompleted !== true) return;

    // Only show if push is supported and user hasn't made a decision yet
    if (!supported) return;
    if (permission !== "default") return;

    // Don't ask until the user has done something valuable in the app.
    if (!isEligibleForPushOptIn()) return;

    // Dismissed in this session? (handles incognito where localStorage is ephemeral)
    try {
      if (sessionStorage.getItem(DISMISSED_SESSION_KEY) === "true") return;
    } catch {
      // sessionStorage unavailable — ignore
    }

    // Dismissed recently? (within 7 days, persists across normal sessions)
    try {
      const dismissedAt = localStorage.getItem(DISMISSED_KEY);
      if (dismissedAt) {
        const dismissedDate = new Date(parseInt(dismissedAt));
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        if (dismissedDate > sevenDaysAgo) return;
      }
    } catch {
      // localStorage unavailable — ignore
    }

    // Small delay so it doesn't flash on page load
    const timer = setTimeout(() => setVisible(true), 2000);
    return () => clearTimeout(timer);
  }, [status, onboardingCompleted, supported, permission]);

  const handleEnable = async () => {
    await requestPermission();
    setVisible(false);
  };

  const handleDismiss = () => {
    setDismissing(true);
    // Store in sessionStorage so it stays dismissed for the current session
    // (handles incognito where localStorage clears on window close)
    try { sessionStorage.setItem(DISMISSED_SESSION_KEY, "true"); } catch {}
    // Store in localStorage for cross-session persistence (7-day check above)
    try { localStorage.setItem(DISMISSED_KEY, String(Date.now())); } catch {}
    // Animate out
    setTimeout(() => {
      setVisible(false);
      setDismissing(false);
    }, 300);
  };

  if (!visible) return null;

  return (
    <div
      className={`fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-sm transition-all duration-300 ${
        dismissing
          ? "translate-y-4 opacity-0"
          : "translate-y-0 opacity-100"
      }`}
    >
      <div className="rounded-xl bg-gray-900 p-3 text-white shadow-lg ring-1 ring-white/10">
        <div className="flex items-center gap-2.5">
          {/* Bell icon — compact */}
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-purple-600/80">
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold">
              Stay in the loop
            </p>
            <p className="mt-0.5 text-[11px] text-gray-400 leading-snug">
              Get notified about events and promos from bars you follow. No spam.
            </p>
            <div className="mt-2 flex gap-2">
              <button
                onClick={handleEnable}
                disabled={loading}
                className="rounded-md bg-purple-600 px-2.5 py-1 text-[11px] font-medium text-white hover:bg-purple-500 disabled:opacity-50 transition-colors"
              >
                {loading ? "Enabling..." : "Enable"}
              </button>
              <button
                onClick={handleDismiss}
                className="rounded-md px-2.5 py-1 text-[11px] font-medium text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                Not now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
