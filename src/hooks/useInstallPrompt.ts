"use client";

import { useState, useEffect, useCallback } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

/**
 * Captures the beforeinstallprompt event and tracks whether the PWA
 * install banner should be shown. The banner appears after the user
 * has visited 3+ times (tracked via localStorage) and hasn't dismissed
 * it in the last 7 days.
 *
 * Also exposes `triggerInstall()` for programmatic triggers — e.g.
 * after a user follows their first bar.
 */

const VISIT_COUNT_KEY = "hoppr_visit_count";
const DISMISSED_AT_KEY = "hoppr_install_dismissed_at";
const MIN_VISITS = 3;
const DISMISS_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSetItem(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // localStorage unavailable (e.g. private browsing) — silently skip
  }
}

function getVisitCount(): number {
  if (typeof window === "undefined") return 0;
  const raw = safeGetItem(VISIT_COUNT_KEY);
  return raw ? parseInt(raw, 10) : 0;
}

function incrementVisitCount(): number {
  const next = getVisitCount() + 1;
  safeSetItem(VISIT_COUNT_KEY, String(next));
  return next;
}

function wasRecentlyDismissed(): boolean {
  if (typeof window === "undefined") return false;
  const raw = safeGetItem(DISMISSED_AT_KEY);
  if (!raw) return false;
  const dismissedAt = parseInt(raw, 10);
  return Date.now() - dismissedAt < DISMISS_COOLDOWN_MS;
}

export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [installed, setInstalled] = useState(false);

  // Bump visit count on mount and decide whether to show
  useEffect(() => {
    // Already installed — don't show anything
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setInstalled(true);
      return;
    }

    const visits = incrementVisitCount();
    const dismissed = wasRecentlyDismissed();
    const hasPrompt = deferredPrompt !== null;

    // Show if: 3+ visits, not recently dismissed, prompt is available
    if (visits >= MIN_VISITS && !dismissed && hasPrompt) {
      setShowBanner(true);
    }
  }, [deferredPrompt]);

  // Capture the install prompt event
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);

    // Also listen for appinstalled to clean up
    const installedHandler = () => {
      setInstalled(true);
      setShowBanner(false);
      setDeferredPrompt(null);
    };
    window.addEventListener("appinstalled", installedHandler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installedHandler);
    };
  }, []);

  /** Programmatically trigger the install prompt (e.g. after following a bar) */
  const triggerInstall = useCallback(async (): Promise<boolean> => {
    if (!deferredPrompt) return false;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      setShowBanner(false);

      if (outcome === "accepted") {
        setInstalled(true);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [deferredPrompt]);

  /** Dismiss the banner and suppress it for 7 days */
  const dismiss = useCallback(() => {
    safeSetItem(DISMISSED_AT_KEY, String(Date.now()));
    setShowBanner(false);
  }, []);

  /** Force-show the banner (e.g. from settings or after meaningful action) */
  const show = useCallback(() => {
    if (!installed && deferredPrompt && !wasRecentlyDismissed()) {
      setShowBanner(true);
    }
  }, [installed, deferredPrompt]);

  return {
    /** Whether the app is already installed */
    installed,
    /** Whether the install prompt is available (Chrome/Edge on Android, Samsung Internet) */
    promptAvailable: deferredPrompt !== null,
    /** Whether the banner should be visible */
    showBanner,
    /** Call to programmatically trigger the native install dialog */
    triggerInstall,
    /** Dismiss the banner (won't show again for 7 days) */
    dismiss,
    /** Force-show the banner (ignores visit count, respects cooldown) */
    show,
  };
}
