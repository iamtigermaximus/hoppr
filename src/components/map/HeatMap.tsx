"use client";
import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import styled from "styled-components";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import type { LatLngBoundsExpression } from "leaflet";
import { useCrowdScores, type VenueCrowdScore } from "@/hooks/useCrowdScores";
import { useLocationSharing } from "@/hooks/useLocationSharing";
import VenueMarker from "./VenueMarker";
import HeatMapLegend from "./HeatMapLegend";
import LocationToggle from "./LocationToggle";
import type { MyBarEntry } from "@/app/api/crowd/my-bars/route";

const DEFAULT_CENTER: [number, number] = [60.1699, 24.9384];
const DEFAULT_ZOOM = 14;

const MapWrapper = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 12px;
  overflow: hidden;

  .leaflet-container {
    width: 100%;
    height: 100%;
    background: #1a1a1a;
    z-index: 1;
  }

  .leaflet-tile {
    filter: brightness(0.6) invert(1) contrast(3)
      hue-rotate(200deg) saturate(0.3) brightness(0.7);
  }
  .leaflet-container {
    background: #0a0a0a;
  }
  .leaflet-control-zoom a {
    background: rgba(10, 10, 10, 0.85) !important;
    color: #a3a3a3 !important;
    border-color: rgba(255, 255, 255, 0.1) !important;
  }
  .leaflet-popup-content-wrapper {
    background: #1a1a1a;
    color: #fff;
    border-radius: 10px;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
  .leaflet-popup-tip {
    background: #1a1a1a;
  }
  .leaflet-tooltip {
    background: rgba(10, 10, 10, 0.9);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    color: #fff;
    font-size: 11px;
    padding: 6px 10px;
  }
`;

const LoadingOverlay = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(10, 10, 10, 0.7);
  z-index: 1001;
  color: #a3a3a3;
  font-size: 14px;
`;

// ── For You chips ──────────────────────────────────────────────

const ForYouBar = styled.div`
  position: absolute;
  bottom: 56px;
  left: 10px;
  right: 10px;
  z-index: 1000;
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding: 4px 0;
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }

  @media (min-width: 768px) {
    bottom: 16px;
    left: 16px;
    right: auto;
    max-width: 50%;
  }
`;

const relevanceChipColors: Record<string, { bg: string; border: string; text: string }> = {
  event: { bg: "rgba(245,158,11,0.2)", border: "#f59e0b", text: "#fbbf24" },
  pass: { bg: "rgba(16,185,129,0.2)", border: "#10b981", text: "#34d399" },
  followed: { bg: "rgba(167,139,250,0.2)", border: "#a78bfa", text: "#c4b5fd" },
};

const ForYouChip = styled.button<{ $relevance: string }>`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 20px;
  border: 1px solid ${(p) => relevanceChipColors[p.$relevance]?.border || "#6b7280"};
  background: ${(p) => relevanceChipColors[p.$relevance]?.bg || "rgba(107,114,128,0.2)"};
  color: ${(p) => relevanceChipColors[p.$relevance]?.text || "#d1d5db"};
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
  transition: all 0.15s;

  &:hover {
    filter: brightness(1.2);
  }
`;

// ── Props ──────────────────────────────────────────────────────

interface HeatMapProps {
  userLat: number | null;
  userLng: number | null;
}

// ── MapController: re-center on user location ──────────────────

function MapController({ userLat, userLng }: { userLat: number; userLng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([userLat, userLng], map.getZoom());
  }, [map, userLat, userLng]);
  return null;
}

// ── FitBoundsController: auto-zoom to fit relevant bars ────────

function FitBoundsController({ scores }: { scores: VenueCrowdScore[] }) {
  const map = useMap();
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    const relevant = scores.filter((v) => v.relevance && v.lat != null && v.lng != null);
    if (relevant.length === 0) return;

    const bounds: LatLngBoundsExpression = relevant.map((v) => [v.lat!, v.lng!] as [number, number]);
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    hasRun.current = true;
  }, [scores, map]);

  return null;
}

// ── FlyToController: listen for chip-click fly-to events ──────

function FlyToController() {
  const map = useMap();

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ lat: number; lng: number }>).detail;
      map.flyTo([detail.lat, detail.lng], 16, { duration: 0.8 });
    };
    window.addEventListener("map:flyTo", handler);
    return () => window.removeEventListener("map:flyTo", handler);
  }, [map]);

  return null;
}

// ── Main component ─────────────────────────────────────────────

export default function HeatMap({ userLat, userLng }: HeatMapProps) {
  const { data: session } = useSession();
  const isLoggedIn = !!session?.user;
  const { data: scores = [], isLoading } = useCrowdScores(userLat, userLng);
  const { isSharing, startSharing, stopSharing } = useLocationSharing();
  const [presenceCount, setPresenceCount] = useState(0);
  const presenceIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Personalized "my bars" data
  const [myBars, setMyBars] = useState<MyBarEntry[]>([]);
  const [myBarsLoading, setMyBarsLoading] = useState(false);

  const center: [number, number] = useMemo(() => {
    if (userLat != null && userLng != null) return [userLat, userLng];
    return DEFAULT_CENTER;
  }, [userLat, userLng]);

  // ── Fetch my-bars ──────────────────────────────────────────

  useEffect(() => {
    if (!isLoggedIn) return;
    setMyBarsLoading(true);
    fetch("/api/crowd/my-bars")
      .then((r) => r.json())
      .then((data) => setMyBars(data.bars || []))
      .catch(() => {})
      .finally(() => setMyBarsLoading(false));
  }, [isLoggedIn]);

  // Merge relevance into scores
  const enrichedScores = useMemo(() => {
    if (myBars.length === 0) return scores;
    const barMap = new Map(myBars.map((b) => [b.barId, b]));
    return scores.map((v) => {
      const myBar = barMap.get(v.id);
      if (!myBar) return v;
      return { ...v, relevance: myBar.relevance, relevanceLabel: myBar.label };
    });
  }, [scores, myBars]);

  // ── Presence polling ────────────────────────────────────────

  useEffect(() => {
    if (isSharing) {
      presenceIntervalRef.current = setInterval(async () => {
        try {
          const res = await fetch("/api/crowd/presence");
          const data = await res.json();
          setPresenceCount(data.totalPresent);
        } catch {
          // Best-effort
        }
      }, 60_000);
      fetch("/api/crowd/presence")
        .then((r) => r.json())
        .then((d) => setPresenceCount(d.totalPresent))
        .catch(() => {});
    } else {
      if (presenceIntervalRef.current) {
        clearInterval(presenceIntervalRef.current);
        presenceIntervalRef.current = null;
      }
      setPresenceCount(0);
    }
    return () => {
      if (presenceIntervalRef.current) {
        clearInterval(presenceIntervalRef.current);
      }
    };
  }, [isSharing]);

  // ── Handlers ────────────────────────────────────────────────

  const handleLocationToggle = () => {
    if (isSharing) stopSharing();
    else startSharing();
  };

  // Open popup on the clicked venue's CircleMarker without navigating away
  const handleOpenPopup = useCallback((venue: VenueCrowdScore) => {
    // Popup is handled by Leaflet's built-in click on CircleMarker.
    // We don't navigate away — the popup has a link to the venue page.
  }, []);

  // Scroll map to a venue when a For You chip is clicked
  const handleChipClick = useCallback(
    (entry: MyBarEntry, e: React.MouseEvent) => {
      e.stopPropagation();
      // Find the venue in scores to get its lat/lng
      const venue = scores.find((v) => v.id === entry.barId);
      if (venue?.lat && venue?.lng) {
        // We need to access the map instance — dispatch a custom event
        const event = new CustomEvent("map:flyTo", {
          detail: { lat: venue.lat, lng: venue.lng },
        });
        window.dispatchEvent(event);
      }
    },
    [scores],
  );

  // ── Render ──────────────────────────────────────────────────

  return (
    <MapWrapper>
      {(isLoading || myBarsLoading) && (
        <LoadingOverlay>Loading crowd data...</LoadingOverlay>
      )}

      <MapContainer
        center={center}
        zoom={DEFAULT_ZOOM}
        style={{ width: "100%", height: "100%" }}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {userLat != null && userLng != null && (
          <MapController userLat={userLat} userLng={userLng} />
        )}

        <FitBoundsController scores={enrichedScores} />
        <FlyToController />

        {enrichedScores
          .filter((v) => v.lat != null && v.lng != null)
          .map((venue) => (
            <VenueMarker
              key={venue.id}
              venue={venue}
              onOpenPopup={handleOpenPopup}
            />
          ))}
      </MapContainer>

      {/* For You chips */}
      {isLoggedIn && myBars.length > 0 && (
        <ForYouBar>
          {myBars.map((entry) => (
            <ForYouChip
              key={`${entry.barId}-${entry.relevance}`}
              $relevance={entry.relevance}
              onClick={(e) => handleChipClick(entry, e)}
            >
              {entry.relevance === "event" && "📅"}
              {entry.relevance === "pass" && "🎟️"}
              {entry.relevance === "followed" && "⭐"}
              {" "}
              {entry.barName}
            </ForYouChip>
          ))}
        </ForYouBar>
      )}

      <LocationToggle
        isSharing={isSharing}
        presenceCount={presenceCount}
        onToggle={handleLocationToggle}
      />
      <HeatMapLegend />
    </MapWrapper>
  );
}
