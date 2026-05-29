"use client";
import { useState, useMemo } from "react";
import styled from "styled-components";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useFeed } from "@/hooks/useFeed";
import { TimeFilters } from "@/components/feed/TimeFilters";
import { FeedList } from "@/components/feed/FeedList";
import type { TimeFilter } from "@/types/feed";
import { SlidersHorizontal, Clock, NavigationArrow } from "@phosphor-icons/react";

const Header = styled.div`
  padding: 16px 16px 0;
  margin-bottom: 14px;
`;

const Title = styled.h1`
  font-weight: 800; font-size: 24px; color: #fff;
  letter-spacing: -0.5px; margin: 0 0 2px;
`;

const Subtitle = styled.div`
  display: flex; align-items: center; gap: 12px;
  color: #a3a3a3; font-size: 12px;
`;

const SortToggle = styled.div`
  display: flex; gap: 4px;
  background: #1a1a1a; border: 1px solid #262626;
  border-radius: 10px; padding: 3px;
  margin-bottom: 14px;
`;

const SortOption = styled.button<{ $active: boolean }>`
  flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px;
  padding: 8px 12px; border-radius: 8px; border: none;
  font-size: 12px; font-weight: 600; cursor: pointer;
  background: ${({ $active }) => $active ? "#7c3aed" : "transparent"};
  color: ${({ $active }) => $active ? "#fff" : "#737373"};
  transition: all 0.15s;
  &:hover { color: ${({ $active }) => $active ? "#fff" : "#a3a3a3"}; }
`;

const SectionLabel = styled.div`
  display: flex; align-items: center; gap: 8px;
  padding: 0 16px; margin-bottom: 8px;
  color: #fff; font-weight: 700; font-size: 13px;
`;

const Divider = styled.div`
  height: 1px; background: #262626;
  margin: 16px 16px;
`;

type SortMode = "upcoming" | "nearest";

export default function DiscoverPage() {
  const { lat, lng } = useGeolocation();
  const [time, setTime] = useState<TimeFilter>("today");
  const [sort, setSort] = useState<SortMode>("upcoming");
  const { data: items = [], isLoading } = useFeed({ lat, lng, time });

  // Sort items
  const sorted = useMemo(() => {
    const copy = [...items];
    if (sort === "nearest") {
      copy.sort((a: any, b: any) => (a.distance || 99) - (b.distance || 99));
    }
    return copy;
  }, [items, sort]);

  // Group by time period for visual sections
  const now = new Date();
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  const tomorrowEnd = new Date(todayEnd.getTime() + 86400000);

  const happeningNow = sorted.filter((i: any) => {
    const t = i.type === "event" ? new Date(i.startTime) : new Date(i.validFrom || i.validUntil);
    return t <= now;
  });
  const today = sorted.filter((i: any) => {
    const t = i.type === "event" ? new Date(i.startTime) : new Date(i.validFrom || i.validUntil);
    return t > now && t <= todayEnd;
  });
  const tomorrow = sorted.filter((i: any) => {
    const t = i.type === "event" ? new Date(i.startTime) : new Date(i.validFrom || i.validUntil);
    return t > todayEnd && t <= tomorrowEnd;
  });
  const later = sorted.filter((i: any) => {
    const t = i.type === "event" ? new Date(i.startTime) : new Date(i.validFrom || i.validUntil);
    return t > tomorrowEnd;
  });

  const hasSections = time === "today";

  return (
    <>
      <Header>
        <Title>Discover</Title>
        <Subtitle>
          <span>📍 Nearby</span>
          <span>·</span>
          <span>{items.length} things happening</span>
        </Subtitle>
      </Header>

      <div style={{ padding: "0 16px" }}>
        <SortToggle>
          <SortOption $active={sort === "upcoming"} onClick={() => setSort("upcoming")}>
            <Clock size={14} /> Upcoming
          </SortOption>
          <SortOption $active={sort === "nearest"} onClick={() => setSort("nearest")}>
            <NavigationArrow size={14} /> Nearest
          </SortOption>
        </SortToggle>
      </div>

      <TimeFilters active={time} onChange={setTime} />

      {hasSections && !isLoading ? (
        <>
          {happeningNow.length > 0 && (
            <>
              <SectionLabel>
                <span style={{ width: "8px", height: "8px", background: "#10b981", borderRadius: "50%" }} />
                Happening Now
              </SectionLabel>
              <FeedList items={happeningNow} isLoading={false} />
              {(today.length > 0 || tomorrow.length > 0) && <Divider />}
            </>
          )}
          {today.length > 0 && (
            <>
              <SectionLabel>Today</SectionLabel>
              <FeedList items={today} isLoading={false} />
              {tomorrow.length > 0 && <Divider />}
            </>
          )}
          {tomorrow.length > 0 && (
            <>
              <SectionLabel>Tomorrow</SectionLabel>
              <FeedList items={tomorrow} isLoading={false} />
              {later.length > 0 && <Divider />}
            </>
          )}
          {later.length > 0 && (
            <>
              <SectionLabel>Later</SectionLabel>
              <FeedList items={later} isLoading={false} />
            </>
          )}
          {sorted.length === 0 && <FeedList items={[]} isLoading={false} />}
        </>
      ) : (
        <FeedList items={sorted} isLoading={isLoading} />
      )}
    </>
  );
}
