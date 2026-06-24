"use client";
import { useState, useMemo } from "react";
import styled from "styled-components";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useFeed } from "@/hooks/useFeed";
import { TimeFilters } from "@/components/feed/TimeFilters";
import { FeedList } from "@/components/feed/FeedList";
import type { FeedItem, TimeFilter } from "@/types/feed";
import { Clock, NavigationArrow, Calendar, MapPin, Ticket } from "@phosphor-icons/react";

const Header = styled.div`padding: 16px 16px 0; margin-bottom: 14px;`;
const Title = styled.h1`font-weight: 800; font-size: 24px; color: var(--color-text-primary, #fff); letter-spacing: -0.5px; margin: 0 0 2px;`;
const Subtitle = styled.div`display: flex; align-items: center; gap: 12px; color: var(--color-text-secondary, #a3a3a3); font-size: 12px;`;

const SortToggle = styled.div`
  display: flex; gap: 4px; background: var(--color-card, #1a1a1a); border: 1px solid var(--color-card-border, #262626);
  border-radius: 10px; padding: 3px; margin-bottom: 14px;
`;
const SortOption = styled.button<{ $active: boolean }>`
  flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px;
  padding: 8px 12px; border-radius: 8px; border: none;
  font-size: 12px; font-weight: 600; cursor: pointer;
  background: ${({ $active }) => $active ? "#7c3aed" : "transparent"};
  color: ${({ $active }) => $active ? "#fff" : "#737373"};
  transition: all 0.15s;
`;

const TimeHeader = styled.div`
  display: flex; align-items: center; gap: 8px;
  padding: 0 16px; margin: 16px 0 10px;
  color: var(--color-text-primary, #fff); font-weight: 700; font-size: 14px;
`;

const TypeChip = styled.div<{ $color: string }>`
  display: inline-flex; align-items: center; gap: 4px;
  padding: 0 16px; margin-bottom: 6px;
  font-size: 11px; font-weight: 600; color: ${({ $color }) => $color};
`;

const typeGroups = [
  { key: "event" as const, label: "Events", icon: Calendar, color: "#3b82f6", action: "Join" },
  { key: "promotion" as const, label: "Promotions", icon: MapPin, color: "#10b981", action: "View" },
  { key: "pass" as const, label: "VIP Passes", icon: Ticket, color: "#f59e0b", action: "Buy" },
];

type SortMode = "upcoming" | "nearest";

function groupByType(items: FeedItem[]) {
  return {
    event: items.filter(i => i.type === "event"),
    promotion: items.filter(i => i.type === "promotion"),
    pass: items.filter(i => i.type === "pass"),
  };
}

const INITIAL_SHOW = 3;

export default function DiscoverPage() {
  const { lat, lng } = useGeolocation();
  const [time, setTime] = useState<TimeFilter>("week");
  const [sort, setSort] = useState<SortMode>("upcoming");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const { data: items = [], isLoading } = useFeed({ lat, lng, time });

  const sorted = useMemo(() => {
    const copy = [...items];
    if (sort === "nearest") copy.sort((a: any, b: any) => (a.distance || 99) - (b.distance || 99));
    return copy;
  }, [items, sort]);

  const now = new Date();
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  const tomorrowEnd = new Date(todayEnd.getTime() + 86400000);

  const timeFilter = (i: any) => {
    const t = i.type === "event" ? new Date(i.startTime) : new Date(i.validFrom || i.validUntil);
    return { t, isNow: t <= now, isToday: t > now && t <= todayEnd, isTomorrow: t > todayEnd && t <= tomorrowEnd, isLater: t > tomorrowEnd };
  };

  const happeningNow = sorted.filter(i => timeFilter(i).isNow);
  const today = sorted.filter(i => timeFilter(i).isToday);
  const tomorrow = sorted.filter(i => timeFilter(i).isTomorrow);
  const later = sorted.filter(i => timeFilter(i).isLater);

  const totalEvents = sorted.filter(i => i.type === "event").length;
  const totalPromos = sorted.filter(i => i.type === "promotion").length;
  const totalPasses = sorted.filter(i => i.type === "pass").length;

  // Show sectioned view (Now / Today / Tomorrow / Later) for all wider filters
  const hasSections = time !== "now" && time !== "afternoon" && time !== "evening" && time !== "night";

  const toggleExpand = (key: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const renderTypeGroups = (sectionItems: FeedItem[], sectionKey: string) => {
    const groups = groupByType(sectionItems);
    return typeGroups.map(tg => {
      const groupItems = groups[tg.key];
      if (!groupItems.length) return null;
      const GroupIcon = tg.icon;
      const expandKey = `${sectionKey}-${tg.key}`;
      const isExpanded = expanded.has(expandKey);
      const visible = isExpanded ? groupItems : groupItems.slice(0, INITIAL_SHOW);
      const hasMore = groupItems.length > INITIAL_SHOW;

      return (
        <div key={tg.key}>
          <TypeChip $color={tg.color}>
            <GroupIcon size={12} weight="fill" />
            {tg.label} · {groupItems.length}
          </TypeChip>
          <FeedList items={visible} isLoading={false} />
          {hasMore && (
            <button
              onClick={() => toggleExpand(expandKey)}
              style={{
                display: "block", width: "100%", padding: "8px 16px",
                color: "#7c3aed", fontSize: "12px", fontWeight: 600,
                background: "none", border: "none", cursor: "pointer",
                textAlign: "center", marginTop: "2px",
              }}
            >
              {isExpanded ? "Show less ▲" : `Show all ${groupItems.length} ▼`}
            </button>
          )}
        </div>
      );
    });
  };

  return (
    <>
      <Header>
        <Title>Discover</Title>
        <Subtitle>
          <span>📍 Nearby</span>
          <span>·</span>
          <span>
            {totalEvents > 0 && `${totalEvents} events`}
            {totalPromos > 0 && ` · ${totalPromos} promos`}
            {totalPasses > 0 && ` · ${totalPasses} passes`}
          </span>
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
              <TimeHeader>
                <span style={{ width: "8px", height: "8px", background: "#10b981", borderRadius: "50%" }} />
                Happening Now
              </TimeHeader>
              {renderTypeGroups(happeningNow, "now")}
            </>
          )}
          {today.length > 0 && (
            <>
              <TimeHeader>Today</TimeHeader>
              {renderTypeGroups(today, "today")}
            </>
          )}
          {tomorrow.length > 0 && (
            <>
              <TimeHeader>Tomorrow</TimeHeader>
              {renderTypeGroups(tomorrow, "tomorrow")}
            </>
          )}
          {later.length > 0 && (
            <>
              <TimeHeader>Later</TimeHeader>
              {renderTypeGroups(later, "later")}
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
