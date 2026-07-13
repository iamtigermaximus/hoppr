"use client";

import { useMemo } from "react";
import { useSession } from "next-auth/react";
import styled from "styled-components";
import { useQuery } from "@tanstack/react-query";
import { useGeolocation } from "@/hooks/useGeolocation";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { HomeCard, CardGrid, type HomeCardItem } from "./HomeCard";
import type { FeedItem } from "@/types/feed";

const EmptyPrompt = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32px 16px;
  margin: 0 16px;
  background: #1a1a1a;
  border: 1px solid #262626;
  border-radius: 14px;
  text-align: center;
`;

const SkeletonCard = styled.div`
  min-width: 260px;
  border-radius: 14px;
  background: #1a1a1a;
  border: 1px solid #262626;
  padding: 16px;
  scroll-snap-align: start;

  @media (min-width: 768px) {
    min-width: unset;
  }
`;

const SkeletonBlock = styled.div<{ $h?: number; $w?: string }>`
  height: ${({ $h }) => $h ?? 12}px;
  width: ${({ $w }) => $w ?? "100%"};
  background: #262626;
  border-radius: 4px;
  margin-bottom: 6px;
`;

export function FromYourBars() {
  const { data: session } = useSession();
  const userId = (session?.user as Record<string, unknown> | undefined)?.id as
    | string
    | undefined;
  const { lat, lng } = useGeolocation();
  const hasCoords = lat != null && lng != null;

  const { data: followingData, isLoading: loadingFollows } = useQuery<{
    following: { id: string; name: string }[];
    total: number;
  }>({
    queryKey: ["me", "following"],
    queryFn: () => fetch("/api/me/following").then((r) => r.json()),
    enabled: !!userId,
    staleTime: 60000,
  });

  const followedBars = followingData?.following ?? [];
  const followedIds = useMemo(
    () => followedBars.map((b) => b.id),
    [followedBars],
  );

  const { data: feedItems = [], isLoading: loadingFeed } = useQuery<FeedItem[]>(
    {
      queryKey: ["feed", "followed", followedIds.join(","), lat, lng],
      queryFn: async () => {
        if (!followedIds.length || !hasCoords) return [];
        const params = new URLSearchParams({
          lat: String(lat),
          lng: String(lng),
          time: "week",
          barIds: followedIds.join(","),
        });
        const res = await fetch(`/api/feed?${params.toString()}`);
        if (!res.ok) throw new Error("Failed to fetch followed feed");
        return res.json();
      },
      enabled: followedIds.length > 0 && hasCoords && !!userId,
      staleTime: 30000,
    },
  );

  const isLoading = loadingFollows || (loadingFeed && followedIds.length > 0);

  const displayItems: HomeCardItem[] = useMemo(() => {
    if (!feedItems.length) return [];
    const events = feedItems
      .filter((i) => i.type === "event")
      .sort(
        (a, b) =>
          new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
      )
      .slice(0, 3)
      .map((e) => ({
        id: e.id,
        type: "event" as const,
        title: e.title,
        venueName: e.venueName,
        image: e.image,
        distance: e.distance,
        startTime: e.startTime,
      }));
    const promos = feedItems
      .filter((i) => i.type === "promotion")
      .slice(0, 3)
      .map((p) => ({
        id: p.id,
        type: "promotion" as const,
        title: p.title,
        venueName: p.venueName,
        image: p.image,
        distance: p.distance,
        validFrom: p.validFrom,
      }));
    return [...events, ...promos].slice(0, 6);
  }, [feedItems]);

  if (!userId) return null;

  if (isLoading) {
    return (
      <div style={{ marginBottom: "18px", padding: "0 16px" }}>
        <SectionHeader title="From your bars" />
        <CardGrid>
          {[1, 2].map((i) => (
            <SkeletonCard key={i}>
              <SkeletonBlock $h={100} />
              <SkeletonBlock $w="60%" />
              <SkeletonBlock $w="40%" />
            </SkeletonCard>
          ))}
        </CardGrid>
      </div>
    );
  }

  if (followedBars.length === 0 || displayItems.length === 0) {
    return null;
  }

  return (
    <div style={{ marginBottom: "18px", padding: "0 16px" }}>
      <SectionHeader
        title="From your bars"
        onSeeAll={() => (window.location.href = "/discover")}
      />
      <CardGrid>
        {displayItems.map((item) => (
          <HomeCard key={`${item.type}-${item.id}`} item={item} />
        ))}
      </CardGrid>
    </div>
  );
}
