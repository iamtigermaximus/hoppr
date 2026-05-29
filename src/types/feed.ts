import type { User } from "@prisma/client";

export type FeedItem =
  | {
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
    }
  | {
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
    }
  | {
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
    };

export type TimeFilter = "now" | "today" | "tomorrow" | "afternoon" | "evening" | "night";
