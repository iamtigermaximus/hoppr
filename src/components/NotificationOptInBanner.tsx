"use client";

import { useState, useEffect } from "react";
import { usePushNotifications } from "@/components/contexts/PushNotificationProvider";
import { isEligibleForPushOptIn } from "@/lib/push-eligibility";

const DISMISSED_KEY = "push_optin_dismissed";

/**
 * Notification opt-in banner shown to users who:
 * - Have a browser that supports push
 * - Haven't granted or denied permission yet (default state)
 * - Haven't dismissed the banner in the last 7 days
 * - Have completed a meaningful action (viewed a promo, followed a bar, etc.)
 *
 * The banner is gated behind an eligibility signal set by positive user
 * actions rather than showing on first app launch. This follows the
 * established pattern of asking for permission after value delivery
 * (see: Duolingo, Strava, etc.).
 */
export default function NotificationOptInBanner() {
  const { supported, permission, requestPermission, loading } =
    usePushNotifications();
  const [visible, setVisible] = useState(false);
  const [dismissing, setDismissing] = useState(false);

  useEffect(() => {
    // Only show if push is supported and user hasn't made a decision yet
    if (!supported) return;
    if (permission !== "default") return;

    // Don't ask until the user has done something valuable in the app.
    // This is set by markEligibleForPushOptIn() called from engagement
    // points like promo views, bar follows, and pass claims.
    if (!isEligibleForPushOptIn()) return;

    // Check if recently dismissed (within 7 days)
    const dismissedAt = localStorage.getItem(DISMISSED_KEY);
    if (dismissedAt) {
      const dismissedDate = new Date(parseInt(dismissedAt));
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      if (dismissedDate > sevenDaysAgo) return;
    }

    // Small delay so it doesn't flash on page load
    const timer = setTimeout(() => setVisible(true), 2000);
    return () => clearTimeout(timer);
  }, [supported, permission]);

  const handleEnable = async () => {
    await requestPermission();
    setVisible(false);
  };

  const handleDismiss = () => {
    setDismissing(true);
    localStorage.setItem(DISMISSED_KEY, String(Date.now()));
    // Animate out
    setTimeout(() => {
      setVisible(false);
      setDismissing(false);
    }, 300);
  };

  if (!visible) return null;

  return (
    <div
      className={`fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md transition-all duration-300 ${
        dismissing
          ? "translate-y-4 opacity-0"
          : "translate-y-0 opacity-100"
      }`}
    >
      <div className="rounded-xl bg-gray-900 p-4 text-white shadow-lg ring-1 ring-white/10">
        <div className="flex items-start gap-3">
          {/* Bell icon */}
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-purple-600">
            <svg
              className="h-5 w-5"
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
            <p className="text-sm font-medium">
              Stay in the loop
            </p>
            <p className="mt-1 text-xs text-gray-400">
              Get notified about events and promotions from bars you follow. No
              spam — only the stuff you care about.
            </p>
            <div className="mt-3 flex gap-2">
              <button
                onClick={handleEnable}
                disabled={loading}
                className="rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-purple-500 disabled:opacity-50 transition-colors"
              >
                {loading ? "Enabling..." : "Enable notifications"}
              </button>
              <button
                onClick={handleDismiss}
                className="rounded-lg px-3 py-1.5 text-xs font-medium text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                Not now
              </button>
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 rounded-lg p-1 text-gray-500 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Dismiss"
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
