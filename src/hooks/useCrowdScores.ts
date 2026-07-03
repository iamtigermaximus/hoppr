"use client";
import { useQuery } from "@tanstack/react-query";

export interface CrowdSignals {
  crowdReport: {
    level: string | null;
    reportedAt: string | null;
    score: number;
  };
  events: {
    activeEventCount: number;
    totalAttendees: number;
    score: number;
  };
  vipScans: {
    recentScanCount: number;
    score: number;
  };
  followers: {
    count: number;
    score: number;
  };
}

export type BarRelevance = "event" | "pass" | "followed";

export interface VenueCrowdScore {
  id: string;
  name: string;
  type: string;
  lat: number | null;
  lng: number | null;
  district: string | null;
  distance: number;
  compositeScore: number;
  computedLevel: string | null;
  signals: CrowdSignals;
  crowdLevel: string | null;
  crowdReportedAt: string | null;
  // User relevance (set client-side from /api/crowd/my-bars)
  relevance?: BarRelevance;
  relevanceLabel?: string;
}

export interface CrowdScoreFilters {
  types?: string[];
  openNow?: boolean;
  hasEvents?: boolean;
  minCrowdScore?: number;
  maxCrowdScore?: number;
}

export function useCrowdScores(
  lat: number | null,
  lng: number | null,
  filters?: CrowdScoreFilters,
) {
  const params = new URLSearchParams();
  if (lat != null && lng != null) {
    params.set("lat", lat.toString());
    params.set("lng", lng.toString());
  }
  if (filters?.types && filters.types.length > 0) {
    params.set("types", filters.types.join(","));
  }
  if (filters?.openNow) {
    params.set("openNow", "true");
  }
  if (filters?.hasEvents) {
    params.set("hasEvents", "true");
  }
  if (filters?.minCrowdScore !== undefined && filters.minCrowdScore > 0) {
    params.set("minCrowdScore", filters.minCrowdScore.toString());
  }
  if (filters?.maxCrowdScore !== undefined) {
    params.set("maxCrowdScore", filters.maxCrowdScore.toString());
  }

  return useQuery<VenueCrowdScore[]>({
    queryKey: ["crowd-scores", lat, lng, filters],
    queryFn: () =>
      fetch(`/api/crowd/scores?${params.toString()}`).then((r) => r.json()),
    enabled: lat != null && lng != null,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}
