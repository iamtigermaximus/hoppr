"use client";
import styled from "styled-components";
import { useFeed } from "@/hooks/useFeed";
import { useGeolocation } from "@/hooks/useGeolocation";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Badge } from "@/components/ui/Badge";
import { formatDistance, formatEventTime } from "@/lib/utils";
import { MapPin } from "@phosphor-icons/react";

const Slider = styled.div`
  display: flex; gap: 10px;
  overflow-x: auto;
  padding: 0 16px;
  scroll-snap-type: x mandatory;
  @media (min-width: 768px) {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    overflow-x: visible;
    scroll-snap-type: none;
    padding: 0;
  }
`;

const PromoCard = styled.div`
  min-width: 270px;
  border-radius: 16px;
  padding: 18px;
  border: 1px solid #333;
  scroll-snap-align: start;
  cursor: pointer;
  position: relative;
  @media (min-width: 768px) { min-width: unset; }
`;

export function PromoSlider() {
  const { lat, lng } = useGeolocation();
  const { data: items = [] } = useFeed({ lat, lng, time: "today" });
  const promos = items.filter((i: any) => i.type === "promotion").slice(0, 5);

  if (!promos.length) return null;

  return (
    <div style={{ marginBottom: "18px", padding: "0 16px" }}>
      <SectionHeader title="Promotions near you" onSeeAll={() => window.location.href = "/discover"} />
      <Slider>
        {promos.map((promo: any) => (
          <PromoCard
            key={promo.id}
            onClick={() => window.location.href = `/venues/${promo.venueId}`}
            style={{ background: `linear-gradient(135deg, ${promo.accentColor || "#1a0533"}, ${promo.accentColor ? promo.accentColor + "cc" : "#2d1060"})` }}
          >
            <Badge $type="promo">PROMO</Badge>
            <div style={{ color: "#fff", fontWeight: 700, fontSize: "15px", marginTop: "8px" }}>{promo.title}</div>
            <div style={{ color: "#a3a3a3", fontSize: "11px", marginTop: "4px" }}>
              {promo.venueName} · {formatEventTime(new Date(promo.validFrom))}
            </div>
            <div style={{ display: "flex", gap: "6px", marginTop: "8px" }}>
              <span style={{ background: "rgba(255,255,255,0.08)", color: "#a3a3a3", fontSize: "9px", padding: "2px 8px", borderRadius: "4px", display: "inline-flex", alignItems: "center", gap: "3px" }}>
                <MapPin size={10} /> {formatDistance(promo.distance)}
              </span>
            </div>
          </PromoCard>
        ))}
      </Slider>
    </div>
  );
}
