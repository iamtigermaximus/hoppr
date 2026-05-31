import type { User } from "@prisma/client";

/** Common metadata added by the feed personalization engine */
interface RecommendationMeta {
  /** Human-readable reasons this item was recommended (max 2) */
  recommendationReasons?: string[];
  /** Personalization score (0–1), only set for authenticated users */
  score?: number;
}

export type FeedItem =
  | (RecommendationMeta & {
      type: "event";
      id: string;
      title: string;
      venueId: string;
      venueName: string;
      venueType?: string;
      startTime: string;
      endTime?: string;
      attendeeCount: number;
      distance: number;
      image?: string;
      attendees?: { id: string; name: string | null; image: string | null }[];
    })
  | (RecommendationMeta & {
      type: "promotion";
      id: string;
      title: string;
      venueId: string;
      venueName: string;
      description: string;
      validFrom: string;
      validTo: string;
      distance: number;
      image?: string;
      accentColor?: string;
    })
  | (RecommendationMeta & {
      type: "pass";
      id: string;
      title: string;
      venueId: string;
      venueName: string;
      price: number;
      originalPrice?: number;
      validUntil: string;
      distance: number;
      imageUrl?: string;
    });

export type TimeFilter = "now" | "today" | "tomorrow" | "afternoon" | "evening" | "night";
