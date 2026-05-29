"use client";
import styled from "styled-components";
import { useVenues } from "@/hooks/useVenues";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { formatDistance } from "@/lib/utils";
import { House, Star, Fire } from "@phosphor-icons/react";

const Grid = styled.div`
  display: flex; gap: 10px; overflow-x: auto; padding: 0 16px;
  @media (min-width: 768px) { display: grid; grid-template-columns: repeat(3, 1fr); overflow-x: visible; padding: 0; }
`;

const BarCard = styled.div`
  min-width: 200px; background: linear-gradient(135deg, #1a1a1a, #0a0a0a);
  border: 1px solid #262626; border-radius: 16px;
  padding: 16px; cursor: pointer; position: relative;
  transition: border-color 0.15s, transform 0.15s;
  &:hover { border-color: #7c3aed44; transform: translateY(-2px); }
  @media (min-width: 768px) { min-width: unset; }
`;

const ratings: Record<string, number> = {
  v1: 4.8, v2: 4.6, v3: 4.9, v4: 4.2, v5: 4.3, v6: 4.5, v7: 4.7, v8: 4.4,
  v9: 4.1, v10: 4.6, v11: 4.3, v12: 4.8, v13: 4.4, v14: 4.7, v15: 4.5,
};

const viewCounts: Record<string, number> = {
  v1: 1240, v3: 980, v7: 850, v12: 720, v8: 680, v2: 550, v9: 420, v10: 380, v15: 340, v11: 290, v13: 240, v4: 200, v5: 180, v6: 150, v14: 120,
};

export function TrendingBars() {
  const { data: venues = [] } = useVenues();
  const topBars = [...venues]
    .sort((a: any, b: any) => (viewCounts[b.id] || 0) - (viewCounts[a.id] || 0))
    .slice(0, 3);

  if (!topBars.length) return null;

  return (
    <div style={{ marginBottom: "18px", padding: "0 16px" }}>
      <SectionHeader title="Trending Bars" />
      <Grid>
        {topBars.map((venue: any) => (
          <BarCard key={venue.id} onClick={() => window.location.href = `/venues/${venue.id}`}>
            <div style={{ position: "absolute", top: "12px", right: "12px", display: "flex", alignItems: "center", gap: "4px", background: "rgba(245,158,11,0.15)", padding: "3px 8px", borderRadius: "6px" }}>
              <Fire size={12} color="#f59e0b" weight="fill" />
              <span style={{ color: "#f59e0b", fontSize: "10px", fontWeight: 600 }}>{(viewCounts[venue.id] || 0)}+ views</span>
            </div>
            <div style={{ width: "52px", height: "52px", background: "#262626", borderRadius: "14px", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "12px" }}>
              <House size={26} color="#a3a3a3" weight="regular" />
            </div>
            <div style={{ color: "#fff", fontWeight: 700, fontSize: "15px" }}>{venue.name}</div>
            <div style={{ color: "#a3a3a3", fontSize: "11px", marginTop: "4px" }}>
              {venue.type?.replace(/_/g, " ")} · {venue.district}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "16px", marginTop: "10px" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "3px", color: "#737373", fontSize: "11px" }}>
                <Star size={12} weight="fill" color="#f59e0b" /> {ratings[venue.id] || 4.0}
              </span>
              <span style={{ color: "#737373", fontSize: "11px" }}>{venue.distance ? formatDistance(venue.distance) : "Nearby"}</span>
            </div>
          </BarCard>
        ))}
      </Grid>
    </div>
  );
}
