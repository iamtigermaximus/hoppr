"use client";
import { useQuery } from "@tanstack/react-query";
import type { FeedItem, TimeFilter } from "@/types/feed";

interface FeedParams {
  lat: number | null;
  lng: number | null;
  radius?: number;
  time?: TimeFilter;
}

export function useFeed({ lat, lng, radius = 10, time = "week" }: FeedParams) {
  return useQuery<FeedItem[]>({
    queryKey: ["feed", lat, lng, radius, time],
    queryFn: async () => {
      if (!lat || !lng) return [];
      const res = await fetch(`/api/feed?lat=${lat}&lng=${lng}&radius=${radius}&time=${time}`);
      if (!res.ok) throw new Error("Failed to fetch feed");
      return res.json();
    },
    enabled: !!lat && !!lng,
    staleTime: 30000,
  });
}
