"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { usePushNotifications } from "@/components/contexts/PushNotificationProvider";
import { isEligibleForPushOptIn } from "@/lib/push-eligibility";

const DISMISSED_KEY = "push_optin_dismissed_permanent";

/**
 * Compact notification opt-in banner shown on the home page only.
 * Auto-dismisses after 8 seconds and stays gone permanently once dismissed.
 * Suppressed until onboarding is complete.
 */
export default function NotificationOptInBanner() {
  const { data: session, status } = useSession();
  const { supported, permission, requestPermission, loading } =
    usePushNotifications();
  const [visible, setVisible] = useState(false);

  const onboardingCompleted = (session?.user as Record<string, unknown> | undefined)
    ?.onboardingCompleted as boolean | undefined;

  useEffect(() => {
    if (status !== "authenticated" || onboardingCompleted !== true) return;
    if (!supported) return;
    if (permission !== "default") return;
    if (!isEligibleForPushOptIn()) return;

    // Permanently dismissed?
    try {
      if (localStorage.getItem(DISMISSED_KEY) === "true") return;
      if (sessionStorage.getItem(DISMISSED_KEY) === "true") return;
    } catch {}

    // Show after a short delay
    const showTimer = setTimeout(() => setVisible(true), 3000);

    // Auto-dismiss after 8 seconds if user hasn't interacted
    const dismissTimer = setTimeout(() => setVisible(false), 11000);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(dismissTimer);
    };
  }, [status, onboardingCompleted, supported, permission]);

  const handleEnable = async () => {
    await requestPermission();
    setVisible(false);
  };

  const handleDismiss = () => {
    try { localStorage.setItem(DISMISSED_KEY, "true"); } catch {}
    try { sessionStorage.setItem(DISMISSED_KEY, "true"); } catch {}
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        margin: "0 16px 12px",
        padding: "8px 12px",
        background: "rgba(124, 58, 237, 0.08)",
        border: "1px solid rgba(124, 58, 237, 0.15)",
        borderRadius: "10px",
      }}
    >
      {/* Small bell */}
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#a78bfa"
        strokeWidth={2}
        style={{ flexShrink: 0 }}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
        />
      </svg>

      <span style={{ flex: 1, color: "#a78bfa", fontSize: "11px", fontWeight: 500 }}>
        Get notified about events and promos from your bars
      </span>

      <button
        onClick={handleEnable}
        disabled={loading}
        style={{
          background: "#7c3aed",
          color: "#fff",
          border: "none",
          borderRadius: "6px",
          padding: "4px 10px",
          fontSize: "10px",
          fontWeight: 600,
          cursor: "pointer",
          whiteSpace: "nowrap",
        }}
      >
        {loading ? "..." : "Enable"}
      </button>

      <button
        onClick={handleDismiss}
        style={{
          background: "none",
          border: "none",
          color: "#525252",
          fontSize: "14px",
          cursor: "pointer",
          padding: "0 2px",
          lineHeight: 1,
        }}
      >
        ×
      </button>
    </div>
  );
}
