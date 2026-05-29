"use client";
import styled from "styled-components";
import { useVenues } from "@/hooks/useVenues";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { formatDistance } from "@/lib/utils";
import { House, Star } from "@phosphor-icons/react";

const Slider = styled.div`
  display: flex; gap: 10px;
  overflow-x: auto; padding: 0;

  @media (min-width: 768px) {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    overflow-x: visible;
  }
  @media (min-width: 1200px) {
    grid-template-columns: repeat(6, 1fr);
  }
`;

const BarCard = styled.div`
  min-width: 160px; width: 160px;
  background: var(--color-card, #1a1a1a); border: 1px solid var(--color-card-border, #262626);
  border-radius: 16px; overflow: hidden;
  cursor: pointer; position: relative;
  transition: border-color 0.15s;
  &:hover { border-color: #7c3aed44; }

  @media (min-width: 768px) {
    min-width: unset; width: auto;
  }
`;

const CardImage = styled.div`
  height: 120px; width: 100%; position: relative; overflow: hidden; background: #262626;
  img { width: 100%; height: 100%; object-fit: cover; }
`;

const CardPlaceholder = styled.div`
  height: 100px; width: 100%;
  background: linear-gradient(135deg, #1a0533, #2d1060);
  display: flex; align-items: center; justify-content: center;
`;

const CardBody = styled.div`
  padding: 10px 12px 12px;
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
            {venue.imageUrl ? (
              <CardImage>
                <img src={venue.imageUrl} alt={venue.name} />
                <div style={{ position: "absolute", top: "6px", left: "6px", background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", padding: "2px 6px", borderRadius: "4px", display: "inline-flex", alignItems: "center", gap: "3px" }}>
                  <Star size={9} weight="fill" color="#f59e0b" />
                  <span style={{ color: "#fff", fontSize: "10px", fontWeight: 600 }}>{ratings[venue.id] || 4.0}</span>
                </div>
                {liveBars.has(venue.id) && (
                  <div style={{ position: "absolute", top: "6px", right: "6px", width: "8px", height: "8px", background: "#10b981", borderRadius: "50%", border: "2px solid rgba(0,0,0,0.5)" }} />
                )}
              </CardImage>
            ) : (
              <CardPlaceholder>
                <House size={36} color="#a78bfa" weight="fill" opacity={0.3} />
                <div style={{ position: "absolute", top: "6px", left: "6px", background: "rgba(0,0,0,0.5)", padding: "2px 6px", borderRadius: "4px", display: "inline-flex", alignItems: "center", gap: "3px" }}>
                  <Star size={9} weight="fill" color="#f59e0b" />
                  <span style={{ color: "#fff", fontSize: "10px", fontWeight: 600 }}>{ratings[venue.id] || 4.0}</span>
                </div>
                {liveBars.has(venue.id) && (
                  <div style={{ position: "absolute", top: "6px", right: "6px", width: "8px", height: "8px", background: "#10b981", borderRadius: "50%", border: "2px solid rgba(0,0,0,0.5)" }} />
                )}
              </CardPlaceholder>
            )}

            <CardBody>
              <div style={{ color: "#fff", fontWeight: 600, fontSize: "13px" }}>{venue.name}</div>
              <div style={{ color: "#737373", fontSize: "10px", marginTop: "2px" }}>
                {venue.type?.replace(/_/g, " ")} · {venue.distance ? formatDistance(venue.distance) : "Nearby"}
              </div>
            </CardBody>
          </BarCard>
        ))}
      </Slider>
    </div>
  );
}
