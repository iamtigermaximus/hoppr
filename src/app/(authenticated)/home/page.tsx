"use client";
import Link from "next/link";
import styled from "styled-components";
import { MapPin } from "@phosphor-icons/react";
import { TrendingCarousel } from "@/components/home/TrendingCarousel";
import { PromoSlider } from "@/components/home/PromoSlider";
import { EventList } from "@/components/home/EventList";
import { BarSlider } from "@/components/home/BarSlider";
import { CategoryGrid } from "@/components/home/CategoryGrid";
import { useCrowdScores } from "@/hooks/useCrowdScores";
import { useGeolocation } from "@/hooks/useGeolocation";

const HeatStrip = styled(Link)`
  display: block;
  margin: 0 16px 16px;
  padding: 12px 14px;
  background: linear-gradient(
    135deg,
    rgba(124, 58, 237, 0.08),
    rgba(239, 68, 68, 0.06)
  );
  border: 1px solid rgba(124, 58, 237, 0.2);
  border-radius: 14px;
  cursor: pointer;
  text-decoration: none;
`;

const HeatStripHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
`;

const HeatStripTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 700;
  color: var(--color-text-primary, #fff);
`;

const HeatDots = styled.div`
  display: flex;
  gap: 6px;
  align-items: center;
`;

const HeatDot = styled.span<{ $color: string }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ $color }) => $color};
`;

const HeatVibe = styled.span`
  font-size: 11px;
  color: #a3a3a3;
`;

function levelColor(level: string | null): string {
  switch (level) {
    case "QUIET":
      return "#10b981";
    case "GETTING_BUSY":
      return "#f59e0b";
    case "BUSY":
      return "#f97316";
    case "PACKED":
      return "#ef4444";
    case "AT_CAPACITY":
      return "#dc2626";
    default:
      return "#6b7280";
  }
}

export default function HomePage() {
  const today = new Date();
  const dateStr = today.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  const { lat, lng } = useGeolocation();
  const { data: scores = [] } = useCrowdScores(lat, lng);

  const hotCount = scores.filter(
    (s) =>
      s.computedLevel &&
      ["PACKED", "AT_CAPACITY"].includes(s.computedLevel),
  ).length;

  const busyCount = scores.filter(
    (s) =>
      s.computedLevel &&
      ["BUSY", "GETTING_BUSY"].includes(s.computedLevel),
  ).length;

  const topHot = scores
    .filter((s) => s.computedLevel && s.compositeScore > 0)
    .sort((a, b) => b.compositeScore - a.compositeScore)
    .slice(0, 3);

  return (
    <>
      <div style={{ padding: "4px 16px 12px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: "8px",
          }}
        >
          <span
            style={{
              fontWeight: 800,
              fontSize: "18px",
              color: "var(--color-text-primary, #fff)",
              letterSpacing: "-0.5px",
            }}
          >
            Helsinki
          </span>
          <span
            style={{
              color: "var(--color-text-muted, #737373)",
              fontSize: "12px",
            }}
          >
            {dateStr}
          </span>
        </div>
      </div>

      <HeatStrip href="/map">
        <HeatStripHeader>
          <HeatStripTitle>
            <MapPin size={16} color="#ef4444" weight="fill" />
            Nearby Heat
          </HeatStripTitle>
          <span
            style={{
              fontSize: "10px",
              color: "#7c3aed",
              fontWeight: 600,
            }}
          >
            Open Map &rarr;
          </span>
        </HeatStripHeader>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <HeatDots>
            {topHot.map((v) => (
              <HeatDot
                key={v.id}
                $color={levelColor(v.computedLevel)}
              />
            ))}
          </HeatDots>
          <HeatVibe>
            {hotCount > 0
              ? `${hotCount} venues packed · ${busyCount} busy`
              : busyCount > 0
                ? `${busyCount} venues buzzing`
                : "All quiet right now"}
          </HeatVibe>
        </div>
      </HeatStrip>

      <TrendingCarousel />
      <PromoSlider />
      <EventList />
      <BarSlider />
      <CategoryGrid />
    </>
  );
}
