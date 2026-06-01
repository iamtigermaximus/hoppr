"use client";
import { useMemo } from "react";
import { CircleMarker, Popup, Tooltip } from "react-leaflet";
import type { VenueCrowdScore } from "@/hooks/useCrowdScores";
import CrowdScorePopover from "./CrowdScorePopover";

interface VenueMarkerProps {
  venue: VenueCrowdScore;
  onOpenPopup: (venue: VenueCrowdScore) => void;
}

const LEVEL_COLORS: Record<string, { fill: string; stroke: string }> = {
  QUIET: { fill: "#10b981", stroke: "#059669" },
  GETTING_BUSY: { fill: "#f59e0b", stroke: "#d97706" },
  BUSY: { fill: "#f97316", stroke: "#ea580c" },
  PACKED: { fill: "#ef4444", stroke: "#dc2626" },
  AT_CAPACITY: { fill: "#dc2626", stroke: "#991b1b" },
};

const FALLBACK_COLOR = { fill: "#6b7280", stroke: "#4b5563" };

// Relevance accent colors
const RELEVANCE_ACCENT: Record<string, string> = {
  event: "#f59e0b",    // gold — user has an event here
  pass: "#10b981",     // green ring — user has a pass here
  followed: "#a78bfa", // purple ring — user follows
};

function getRadius(compositeScore: number): number {
  return 8 + (compositeScore / 100) * 20;
}

function getOpacity(compositeScore: number): number {
  return 0.3 + (compositeScore / 100) * 0.5;
}

export default function VenueMarker({ venue, onOpenPopup }: VenueMarkerProps) {
  const level = venue.computedLevel || venue.crowdLevel;
  const colors = level ? LEVEL_COLORS[level] ?? FALLBACK_COLOR : FALLBACK_COLOR;
  const radius = getRadius(venue.compositeScore);
  const opacity = getOpacity(venue.compositeScore);
  const isAtCapacity = level === "AT_CAPACITY";
  const hasRelevance = venue.relevance != null;
  const relevanceColor = venue.relevance ? RELEVANCE_ACCENT[venue.relevance] : undefined;

  // Double-ring visual: inner shows crowd level, outer shows relevance
  const markerStyle = useMemo(() => {
    const base = {
      fillColor: colors.fill,
      color: colors.stroke,
      weight: isAtCapacity ? 3 : 1.5,
      fillOpacity: opacity,
      opacity: 0.8,
    };

    if (hasRelevance && relevanceColor) {
      return {
        ...base,
        color: relevanceColor,
        weight: 4,
        opacity: 1,
        dashArray: venue.relevance === "event" ? undefined : "4 2",
      };
    }
    return base;
  }, [colors, isAtCapacity, opacity, hasRelevance, relevanceColor, venue.relevance]);

  if (venue.lat == null || venue.lng == null) return null;

  return (
    <CircleMarker
      center={[venue.lat, venue.lng]}
      radius={hasRelevance ? Math.max(radius, 14) : radius}
      pathOptions={markerStyle}
      bubblingMouseEvents={false}
    >
      <Tooltip direction="top" offset={[0, -(hasRelevance ? Math.max(radius, 14) : radius)]} opacity={0.9}>
        <div style={{ fontWeight: 700, fontSize: "12px" }}>{venue.name}</div>
        <div style={{ fontSize: "10px", color: colors.fill, fontWeight: 600 }}>
          {level ? level.replace(/_/g, " ") : "No data"} · {venue.distance} km
        </div>
        {venue.relevanceLabel && (
          <div style={{ fontSize: "10px", color: relevanceColor || "#a3a3a3", marginTop: "2px" }}>
            {venue.relevanceLabel}
          </div>
        )}
      </Tooltip>
      <Popup>
        <CrowdScorePopover venue={venue} />
      </Popup>
    </CircleMarker>
  );
}
