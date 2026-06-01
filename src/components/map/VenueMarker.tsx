"use client";
import { CircleMarker, Popup, Tooltip } from "react-leaflet";
import type { VenueCrowdScore } from "@/hooks/useCrowdScores";
import CrowdScorePopover from "./CrowdScorePopover";

interface VenueMarkerProps {
  venue: VenueCrowdScore;
  onClick: (venue: VenueCrowdScore) => void;
}

const LEVEL_COLORS: Record<
  string,
  { fill: string; stroke: string }
> = {
  QUIET: { fill: "#10b981", stroke: "#059669" },
  GETTING_BUSY: { fill: "#f59e0b", stroke: "#d97706" },
  BUSY: { fill: "#f97316", stroke: "#ea580c" },
  PACKED: { fill: "#ef4444", stroke: "#dc2626" },
  AT_CAPACITY: { fill: "#dc2626", stroke: "#991b1b" },
};

const FALLBACK_COLOR = { fill: "#6b7280", stroke: "#4b5563" };

function getRadius(compositeScore: number): number {
  return 8 + (compositeScore / 100) * 20;
}

function getOpacity(compositeScore: number): number {
  return 0.3 + (compositeScore / 100) * 0.5;
}

export default function VenueMarker({ venue, onClick }: VenueMarkerProps) {
  const level = venue.computedLevel || venue.crowdLevel;
  const colors = level
    ? LEVEL_COLORS[level] ?? FALLBACK_COLOR
    : FALLBACK_COLOR;
  const radius = getRadius(venue.compositeScore);
  const opacity = getOpacity(venue.compositeScore);
  const isAtCapacity = level === "AT_CAPACITY";

  if (venue.lat == null || venue.lng == null) return null;

  return (
    <CircleMarker
      center={[venue.lat, venue.lng]}
      radius={radius}
      pathOptions={{
        fillColor: colors.fill,
        color: colors.stroke,
        weight: isAtCapacity ? 3 : 1.5,
        fillOpacity: opacity,
        opacity: 0.8,
      }}
      eventHandlers={{
        click: () => onClick(venue),
      }}
    >
      <Tooltip direction="top" offset={[0, -radius]} opacity={0.9}>
        <div style={{ fontWeight: 700, fontSize: "12px" }}>{venue.name}</div>
        <div
          style={{
            fontSize: "10px",
            color: colors.fill,
            fontWeight: 600,
          }}
        >
          {level ? level.replace(/_/g, " ") : "No data"} ·{" "}
          {venue.distance} km
        </div>
      </Tooltip>
      <Popup>
        <CrowdScorePopover venue={venue} />
      </Popup>
    </CircleMarker>
  );
}
