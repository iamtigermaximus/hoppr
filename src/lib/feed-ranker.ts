/**
 * Feed Personalization Engine
 *
 * Scores and ranks feed items based on user preferences and behavior.
 * Falls back to distance-based ordering when no user data is available.
 *
 * Scoring weights (sum to 1.0) — distance-weighted for "near me":
 *   Distance        — 0.35  (closer = higher, inverse linear decay)
 *   Interest match  — 0.25  (user interests/drinkPrefs vs item text + bar type)
 *   Venue affinity  — 0.20  (user has visited/purchased from this bar before)
 *   Social proof    — 0.10  (attendee count, redemptions, bar quality score)
 *   Freshness       — 0.10  (newer items slightly favored)
 */

import type { FeedItem } from "@/types/feed";

// ---- Types ----

export interface UserProfile {
  id: string;
  interests: string[];
  drinkPrefs: string[];
  languages: string[];
}

export interface UserHistory {
  visitedVenueIds: Set<string>;   // bars user has events at or visited
  purchasedVenueIds: Set<string>; // bars user bought passes from
  joinedEventTypes: Set<string>;  // event venue types user has joined
}

export interface RankingSignals {
  interestScore: number;   // 0–1
  affinityScore: number;   // 0–1
  socialScore: number;     // 0–1
  distanceScore: number;   // 0–1
  freshnessScore: number;  // 0–1
  totalScore: number;      // weighted sum
  reasons: string[];       // human-readable recommendation reasons
}

export interface ScoredItem {
  item: FeedItem;
  score: number;
  reasons: string[];
}

// ---- Configuration ----

const WEIGHTS = {
  distance: 0.35,
  interest: 0.25,
  affinity: 0.20,
  social: 0.10,
  freshness: 0.10,
} as const;

const DIVERSITY_WINDOW = 6; // ensure type diversity in first N results

// ---- Public API ----

/**
 * Score and rank feed items for a user.
 * If userProfile is null, returns distance-sorted items with no personalization.
 */
export function rankFeed(
  items: FeedItem[],
  userProfile: UserProfile | null,
  userHistory: UserHistory | null,
): FeedItem[] {
  if (!userProfile || !userHistory) {
    // No personalization — distance-based fallback (nearest first)
    return sortByDistance(items);
  }

  const scored: ScoredItem[] = items.map((item) => {
    const signals = computeSignals(item, userProfile, userHistory);
    return {
      item: enrichItem(item, signals),
      score: signals.totalScore,
      reasons: signals.reasons,
    };
  });

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  // Apply diversity re-ranking
  const diversified = diversify(scored);

  return diversified.map((s) => s.item);
}

/**
 * Extract user profile fields needed for personalization
 */
export function extractProfile(user: Record<string, unknown>): UserProfile {
  return {
    id: user.id as string,
    interests: (user.interests as string[]) || [],
    drinkPrefs: (user.drinkPrefs as string[]) || [],
    languages: (user.languages as string[]) || [],
  };
}

/**
 * Build user history from DB records
 */
export function buildHistory(
  eventsCreated: { venueId: string; venueType?: string | null }[],
  eventsJoined: { venueId: string; venueType?: string | null }[],
  passes?: { barId: string | null }[], // VIP passes hidden until Stripe
): UserHistory {
  const visitedVenueIds = new Set<string>();
  const joinedEventTypes = new Set<string>();

  for (const e of eventsCreated) {
    visitedVenueIds.add(e.venueId);
    if (e.venueType) joinedEventTypes.add(e.venueType.toLowerCase());
  }
  for (const e of eventsJoined) {
    visitedVenueIds.add(e.venueId);
    if (e.venueType) joinedEventTypes.add(e.venueType.toLowerCase());
  }

  const purchasedVenueIds = new Set(
    (passes || []).filter((p) => p.barId != null).map((p) => p.barId!),
  );

  return { visitedVenueIds, purchasedVenueIds, joinedEventTypes };
}

// ---- Scoring Functions ----

function computeSignals(
  item: FeedItem,
  profile: UserProfile,
  history: UserHistory,
): RankingSignals {
  const interestScore = computeInterestScore(item, profile);
  const affinityScore = computeAffinityScore(item, history);
  const socialScore = computeSocialScore(item);
  const distanceScore = computeDistanceScore(item.distance);
  const freshnessScore = computeFreshnessScore(item);

  const totalScore =
    interestScore * WEIGHTS.interest +
    affinityScore * WEIGHTS.affinity +
    socialScore * WEIGHTS.social +
    distanceScore * WEIGHTS.distance +
    freshnessScore * WEIGHTS.freshness;

  const reasons: string[] = [];
  if (interestScore > 0.6) reasons.push("Matches your interests");
  if (affinityScore > 0.6)
    reasons.push(
      history.purchasedVenueIds.has(item.venueId)
        ? "You've purchased here before"
        : "You've been here before",
    );
  if (socialScore > 0.7) reasons.push("Popular right now");
  if (distanceScore > 0.8) reasons.push("Very close to you");

  return {
    interestScore,
    affinityScore,
    socialScore,
    distanceScore,
    freshnessScore,
    totalScore,
    reasons,
  };
}

/**
 * Interest match: compare user interests/drinkPrefs against item text fields.
 * Returns 0–1 where 1 = strong match.
 */
function computeInterestScore(item: FeedItem, profile: UserProfile): number {
  const keywords = [
    ...profile.interests.map((s) => s.toLowerCase()),
    ...profile.drinkPrefs.map((s) => s.toLowerCase()),
  ];

  if (keywords.length === 0) return 0.5; // neutral — no interests set

  // Build a searchable text blob from the item
  const searchText = buildItemSearchText(item).toLowerCase();

  // Count keyword matches
  let matchCount = 0;
  let totalWeight = 0;

  for (const keyword of keywords) {
    totalWeight += 1;
    if (searchText.includes(keyword)) {
      matchCount += 1;
    }
  }

  if (totalWeight === 0) return 0.5;

  const ratio = matchCount / totalWeight;

  // Bonus for title match (title matches count double)
  const title = (getItemTitle(item) || "").toLowerCase();
  const titleMatches = keywords.filter((k) => title.includes(k)).length;
  const titleBonus = keywords.length > 0 ? (titleMatches / keywords.length) * 0.3 : 0;

  return Math.min(1, ratio * 0.7 + titleBonus);
}

/**
 * Venue affinity: how much the user has interacted with this bar.
 * Returns 0–1.
 */
function computeAffinityScore(item: FeedItem, history: UserHistory): number {
  let score = 0;

  if (history.visitedVenueIds.has(item.venueId)) score += 0.6;
  if (history.purchasedVenueIds.has(item.venueId)) score += 0.4;

  // Bonus for matching venue type to user's historical preferences
  if (item.type === "event" && "venueType" in item && item.venueType) {
    if (history.joinedEventTypes.has(item.venueType.toLowerCase())) {
      score += 0.2;
    }
  }

  return Math.min(1, score);
}

/**
 * Social proof: popularity signals.
 * Returns 0–1.
 */
function computeSocialScore(item: FeedItem): number {
  if (item.type === "event") {
    // Attendee count: 0 attendees = 0.1, 50+ = 1.0
    const count = item.attendeeCount || 0;
    return Math.min(1, 0.1 + count * 0.018);
  }

  if (item.type === "promotion") {
    // Promotions default to moderate social score
    return 0.4;
  }

  // VIP passes hidden until Stripe integration
  // if (item.type === "pass") { ... }

  return 0.5;
}

/**
 * Distance: closer = higher score.
 * Linear decay: 0km = 1.0, 10km+ = 0.
 */
function computeDistanceScore(distanceKm: number): number {
  return Math.max(0, 1 - distanceKm / 10);
}

/**
 * Freshness: newer items score higher within their type's timespan.
 * Returns 0–1.
 */
function computeFreshnessScore(item: FeedItem): number {
  const now = Date.now();

  let startTime: number;
  let endTime: number;

  if (item.type === "featured") {
    // Featured listings are always "fresh"
    return 0.9;
  } else if (item.type === "event") {
    startTime = new Date(item.startTime).getTime();
    endTime = item.endTime ? new Date(item.endTime).getTime() : startTime + 4 * 3600 * 1000;
  } else if (item.type === "promotion") {
    startTime = new Date(item.validFrom).getTime();
    endTime = item.validTo ? new Date(item.validTo).getTime() : startTime + 30 * 24 * 3600 * 1000; // permanent promos: 30-day window
  } else {
    return 0.5; // unreachable: all FeedItem types handled above
  }

  const totalSpan = endTime - startTime;
  if (totalSpan <= 0) return 0.5;

  // How far through its lifespan is this item?
  const elapsed = now - startTime;
  const progress = Math.max(0, Math.min(1, elapsed / totalSpan));

  // Items early in their lifespan get higher scores (inverted)
  return 1 - progress * 0.7; // ranges from 1.0 (just started) to 0.3 (almost over)
}

// ---- Diversity Re-Ranking ----

/**
 * Ensure the first N results contain at least one of each content type
 * when available. Uses a simple round-robin re-ranking.
 */
function diversify(scored: ScoredItem[]): ScoredItem[] {
  if (scored.length < 3) return scored;

  const byType = {
    event: scored.filter((s) => s.item.type === "event"),
    promotion: scored.filter((s) => s.item.type === "promotion"),
    // pass: hidden until Stripe integration
  };

  const result: ScoredItem[] = [];
  const used = new Set<string>();

  // Round-robin: pick highest-scored from each type in turn
  const types = ["event", "promotion"] as const;
  let round = 0;

  while (result.length < DIVERSITY_WINDOW && round < 10) {
    for (const type of types) {
      const candidates = byType[type].filter((s) => !used.has(s.item.id));
      if (candidates.length > round) {
        const pick = candidates[round]; // pre-sorted by score
        result.push(pick);
        used.add(pick.item.id);
      }
    }
    round++;
  }

  // Append remaining items (not yet included) sorted by score
  const remaining = scored.filter((s) => !used.has(s.item.id));
  result.push(...remaining);

  return result;
}

// ---- Enrichment ----

function enrichItem(item: FeedItem, signals: RankingSignals): FeedItem {
  return {
    ...item,
    recommendationReasons: signals.reasons.slice(0, 2), // max 2 reasons
    score: signals.totalScore,
  } as FeedItem;
}

// ---- Fallback ----

function sortByDistance(items: FeedItem[]): FeedItem[] {
  return [...items].sort((a, b) => (a.distance ?? 99) - (b.distance ?? 99));
}

// ---- Helpers ----

function buildItemSearchText(item: FeedItem): string {
  const parts: string[] = [getItemTitle(item) || ""];

  if (item.type === "promotion") {
    parts.push(item.description || "");
  }

  // Venue name and type are relevant for interest matching
  parts.push(item.venueName || "");
  if (item.type === "event" && "venueType" in item && item.venueType) {
    parts.push(item.venueType);
  }

  return parts.join(" ");
}

function getItemTitle(item: FeedItem): string {
  return item.title || "";
}
