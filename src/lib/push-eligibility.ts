/**
 * Controls when the push notification opt-in banner is shown.
 *
 * Instead of asking on first app launch (before the user has experienced
 * any value), the banner only appears after the user completes a positive
 * action — viewing a promotion, following a bar, claiming a pass, etc.
 *
 * Usage:
 *   import { markEligibleForPushOptIn } from "@/lib/push-eligibility";
 *   // Call after a positive user action
 *   markEligibleForPushOptIn();
 */

const ELIGIBLE_KEY = "push_optin_eligible";

/** Call this after a positive user action to make the banner eligible to show. */
export function markEligibleForPushOptIn(): void {
  try {
    localStorage.setItem(ELIGIBLE_KEY, "true");
  } catch {
    // localStorage unavailable (SSR, private browsing) — ignore
  }
}

/** Check whether the user has performed an action that makes them eligible for the opt-in. */
export function isEligibleForPushOptIn(): boolean {
  try {
    return localStorage.getItem(ELIGIBLE_KEY) === "true";
  } catch {
    return false;
  }
}
