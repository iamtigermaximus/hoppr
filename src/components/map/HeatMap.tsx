"use client";
import { useState, useMemo, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import styled from "styled-components";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import { useCrowdScores, type VenueCrowdScore } from "@/hooks/useCrowdScores";
import { useLocationSharing } from "@/hooks/useLocationSharing";
import VenueMarker from "./VenueMarker";
import HeatMapLegend from "./HeatMapLegend";
import LocationToggle from "./LocationToggle";

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

interface HeatMapProps {
  userLat: number | null;
  userLng: number | null;
}

function MapController({
  userLat,
  userLng,
}: {
  userLat: number;
  userLng: number;
}) {
  const map = useMap();
  useEffect(() => {
    map.setView([userLat, userLng], map.getZoom());
  }, [map, userLat, userLng]);
  return null;
}

export default function HeatMap({ userLat, userLng }: HeatMapProps) {
  const router = useRouter();
  const { data: scores = [], isLoading } = useCrowdScores(
    userLat,
    userLng,
  );
  const { isSharing, startSharing, stopSharing } =
    useLocationSharing();
  const [presenceCount, setPresenceCount] = useState(0);
  const presenceIntervalRef = useRef<ReturnType<
    typeof setInterval
  > | null>(null);

  const center: [number, number] = useMemo(() => {
    if (userLat != null && userLng != null)
      return [userLat, userLng];
    return DEFAULT_CENTER;
  }, [userLat, userLng]);

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
      // Fetch immediately
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

  const handleVenueClick = (venue: VenueCrowdScore) => {
    router.push(`/venues/${venue.id}`);
  };

  const handleLocationToggle = () => {
    if (isSharing) {
      stopSharing();
    } else {
      startSharing();
    }
  };

  return (
    <MapWrapper>
      {isLoading && (
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

        {scores
          .filter((v) => v.lat != null && v.lng != null)
          .map((venue) => (
            <VenueMarker
              key={venue.id}
              venue={venue}
              onClick={handleVenueClick}
            />
          ))}
      </MapContainer>

      <LocationToggle
        isSharing={isSharing}
        presenceCount={presenceCount}
        onToggle={handleLocationToggle}
      />
      <HeatMapLegend />
    </MapWrapper>
  );
}
