"use client";
import styled from "styled-components";
import { useVenues } from "@/hooks/useVenues";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { formatDistance } from "@/lib/utils";
import { House, Star } from "@phosphor-icons/react";

const Slider = styled.div`
  display: flex; gap: 10px;
  overflow-x: auto;
  padding: 0 16px;

  @media (min-width: 768px) {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    overflow-x: visible;
    padding: 0;
  }
`;

const BarCard = styled.div`
  min-width: 130px;
  background: #1a1a1a;
  border: 1px solid #262626;
  border-radius: 14px;
  padding: 14px 12px;
  text-align: center;
  cursor: pointer;
  position: relative;
  transition: border-color 0.15s;
  &:hover { border-color: #7c3aed44; }

  @media (min-width: 768px) {
    min-width: unset;
  }
`;

const ratings: Record<string, number> = {
  v1: 4.8, v2: 4.6, v3: 4.9, v4: 4.2, v5: 4.3, v6: 4.5, v7: 4.7, v8: 4.4,
  v9: 4.1, v10: 4.6, v11: 4.3, v12: 4.8, v13: 4.4, v14: 4.7, v15: 4.5,
};

const liveBars = new Set(["v1", "v3", "v7"]);

export function BarSlider() {
  const { data: venues = [] } = useVenues();
  if (!venues.length) return null;

  return (
    <div style={{ marginBottom: "18px", padding: "0 16px" }}>
      <SectionHeader title="Bars near you" onSeeAll={() => window.location.href = "/bars"} />
      <Slider>
        {venues.slice(0, 8).map((venue: any) => (
          <BarCard key={venue.id} onClick={() => window.location.href = `/venues/${venue.id}`}>
            {liveBars.has(venue.id) && (
              <div style={{ position: "absolute", top: "8px", right: "8px", width: "6px", height: "6px", background: "#10b981", borderRadius: "50%" }} />
            )}
            <div style={{ width: "44px", height: "44px", background: "#262626", borderRadius: "12px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <House size={22} color="#a3a3a3" weight="regular" />
            </div>
            <div style={{ color: "#fff", fontWeight: 600, fontSize: "12px", marginTop: "8px" }}>{venue.name}</div>
            <div style={{ color: "#737373", fontSize: "10px", marginTop: "2px" }}>{venue.type.replace(/_/g, " ")} · {venue.distance ? formatDistance(venue.distance) : "Nearby"}</div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "2px", marginTop: "4px" }}>
              <Star size={10} weight="fill" color="#f59e0b" />
              <span style={{ color: "#737373", fontSize: "10px" }}>{ratings[venue.id] || 4.0}</span>
            </div>
          </BarCard>
        ))}
      </Slider>
    </div>
  );
}
