"use client";

import { useMemo } from "react";
import { useSession } from "next-auth/react";
import styled from "styled-components";
import { useQuery } from "@tanstack/react-query";
import { useGeolocation } from "@/hooks/useGeolocation";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Badge } from "@/components/ui/Badge";
import { formatDistance, formatEventTime } from "@/lib/utils";
import { MapPin, Calendar, Ticket, Buildings } from "@phosphor-icons/react";
import type { FeedItem } from "@/types/feed";

const Slider = styled.div`
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding: 0 16px;
  scroll-snap-type: x mandatory;

  @media (min-width: 768px) {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    overflow-x: visible;
    scroll-snap-type: none;
    padding: 0;
  }
  @media (min-width: 1200px) {
    grid-template-columns: repeat(3, 1fr);
  }
`;

const Card = styled.div`
  min-width: 260px;
  border-radius: 14px;
  background: #1a1a1a;
  border: 1px solid #262626;
  padding: 16px;
  scroll-snap-align: start;
  cursor: pointer;
  transition: border-color 0.15s;
  &:hover {
    border-color: #7c3aed44;
  }

  @media (min-width: 768px) {
    min-width: unset;
  }
`;

const CardImage = styled.div<{ $url?: string }>`
  width: 100%;
  height: 100px;
  border-radius: 10px;
  margin-bottom: 12px;
  background: ${({ $url }) =>
    $url
      ? `url(${$url}) center/cover`
      : "linear-gradient(135deg, #1a0533, #2d1060)"};
  position: relative;
  overflow: hidden;
`;

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

  // Fetch followed bars
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

  // Fetch feed filtered to followed bars
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

  // Build display items: events first, then promotions (max 4)
  const displayItems = useMemo(() => {
    if (!feedItems.length) return [];
    const events = feedItems
      .filter((i) => i.type === "event")
      .sort(
        (a, b) =>
          new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
      );
    const promos = feedItems.filter((i) => i.type === "promotion");
    return [...events, ...promos].slice(0, 4);
  }, [feedItems]);

  // Don't render anything if not logged in
  if (!userId) return null;

  // Loading state
  if (isLoading) {
    return (
      <div style={{ marginBottom: "18px", padding: "0 16px" }}>
        <SectionHeader title="From your bars" />
        <Slider>
          {[1, 2].map((i) => (
            <SkeletonCard key={i}>
              <SkeletonBlock $h={100} />
              <SkeletonBlock $w="60%" />
              <SkeletonBlock $w="40%" />
            </SkeletonCard>
          ))}
        </Slider>
      </div>
    );
  }

  // Hide section entirely when there's nothing to show
  if (followedBars.length === 0 || displayItems.length === 0) {
    return null;
  }

  return (
    <div style={{ marginBottom: "18px", padding: "0 16px" }}>
      <SectionHeader
        title="From your bars"
        onSeeAll={() => (window.location.href = "/discover")}
      />
      <Slider>
        {displayItems.map((item) => {
          const href =
            item.type === "event"
              ? `/events/${item.id}`
              : `/promotions/${item.id}`;
          const timeLabel =
            item.type === "event"
              ? formatEventTime(new Date(item.startTime))
              : item.validFrom
                ? formatEventTime(new Date(item.validFrom))
                : null;

          return (
            <Card
              key={`${item.type}-${item.id}`}
              onClick={() => (window.location.href = href)}
            >
              <CardImage $url={item.image}>
                <div
                  style={{
                    position: "absolute",
                    top: "8px",
                    left: "8px",
                    display: "flex",
                    gap: "6px",
                  }}
                >
                  <Badge $type={item.type === "event" ? "event" : "promo"}>
                    {item.type === "event" ? "EVENT" : "PROMO"}
                  </Badge>
                </div>
              </CardImage>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  marginBottom: "4px",
                }}
              >
                <MapPin size={12} color="#7c3aed" weight="fill" />
                <span
                  style={{
                    color: "#a3a3a3",
                    fontSize: "11px",
                    fontWeight: 500,
                  }}
                >
                  {item.venueName}
                </span>
              </div>

              <div
                style={{
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: "14px",
                  marginBottom: "6px",
                  lineHeight: 1.3,
                }}
              >
                {item.title}
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  color: "#737373",
                  fontSize: "11px",
                }}
              >
                {timeLabel && (
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    {item.type === "event" ? (
                      <Calendar size={12} />
                    ) : (
                      <Ticket size={12} />
                    )}
                    {timeLabel}
                  </span>
                )}
                {item.distance != null && (
                  <span>{formatDistance(item.distance)}</span>
                )}
              </div>
            </Card>
          );
        })}
      </Slider>
    </div>
  );
}
