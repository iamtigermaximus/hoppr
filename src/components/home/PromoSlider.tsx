"use client";
import { useEffect } from "react";
import styled from "styled-components";
import { useFeed } from "@/hooks/useFeed";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useCountdown } from "@/hooks/useCountdown";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Badge } from "@/components/ui/Badge";
import ShareButton from "@/components/ui/ShareButton";
import { formatDistance, formatEventTime } from "@/lib/utils";
import { track } from "@/lib/analytics";
import { MapPin, Fire } from "@phosphor-icons/react";

const Slider = styled.div`
  display: flex; gap: 10px;
  overflow-x: auto;
  padding: 0 16px;
  scroll-snap-type: x mandatory;
  @media (min-width: 768px) {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    overflow-x: visible; scroll-snap-type: none; padding: 0;
  }
  @media (min-width: 1200px) {
    grid-template-columns: repeat(4, 1fr);
  }
`;

const PromoCard = styled.div<{ $imageUrl?: string }>`
  min-width: 280px; min-height: 160px;
  border-radius: 16px;
  padding: 18px;
  border: 1px solid #333;
  scroll-snap-align: start;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  background-size: cover;
  background-position: center;
  display: flex; align-items: flex-end;
  ${({ $imageUrl }) => $imageUrl && `
    background-image: url(${$imageUrl});
    min-height: 200px;
    &::before {
      content: "";
      position: absolute;
      inset: 0;
      background: rgba(0,0,0,0.55);
      border-radius: 16px;
      z-index: 0;
    }
  `}
  @media (min-width: 768px) { min-width: unset; }
`;

// Per-promo inner component so useCountdown runs per card
function PromoContent({ promo }: { promo: any }) {
  const countdown = useCountdown(promo.validTo);
  const hasRedemptions = promo.redemptions > 0;

  // Track promo view when card enters the feed
  useEffect(() => {
    track({
      type: "PROMO_VIEW",
      barId: promo.venueId,
      promoId: promo.id,
      promoName: promo.title,
    });
  }, [promo.id, promo.title, promo.venueId]);

  return (
    <div style={{ position: "relative", zIndex: 1 }}>
      {/* Top row: badge + redemptions + share */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Badge $type="promo">PROMO</Badge>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          {hasRedemptions && (
            <span style={{ color: "#f59e0b", fontSize: "10px", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "2px" }}>
              <Fire size={10} weight="fill" /> {promo.redemptions}
            </span>
          )}
          <div onClick={(e) => e.stopPropagation()}>
            <ShareButton
              title={promo.title}
              text={`${promo.description || ""}\n${promo.venueName}`}
              url={`${typeof window !== "undefined" ? window.location.origin : ""}/promotions/${promo.id}`}
              size={14}
              color="#a3a3a3"
            />
          </div>
        </div>
      </div>
      {/* Title + countdown */}
      <div style={{ display: "flex", alignItems: "baseline", gap: "6px", marginTop: "8px" }}>
        <div style={{ color: "#fff", fontWeight: 700, fontSize: "15px", flex: 1 }}>{promo.title}</div>
        {countdown && countdown !== "Ended" && (
          <span style={{ color: "#f59e0b", fontSize: "10px", fontWeight: 600, whiteSpace: "nowrap" }}>
            ⏰ {countdown}
          </span>
        )}
      </div>
      <div style={{ color: "#a3a3a3", fontSize: "11px", marginTop: "4px" }}>
        {promo.venueName} · {formatEventTime(new Date(promo.validFrom))}
      </div>
      <div style={{ display: "flex", gap: "6px", marginTop: "8px" }}>
        <span style={{ background: "rgba(255,255,255,0.08)", color: "#a3a3a3", fontSize: "9px", padding: "2px 8px", borderRadius: "4px", display: "inline-flex", alignItems: "center", gap: "3px" }}>
          <MapPin size={10} /> {formatDistance(promo.distance)}
        </span>
      </div>
    </div>
  );
}

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
            $imageUrl={promo.image}
            onClick={() => window.location.href = `/promotions/${promo.id}`}
            style={{ background: promo.image ? undefined : `linear-gradient(135deg, ${promo.accentColor || "#1a0533"}, ${promo.accentColor ? promo.accentColor + "cc" : "#2d1060"})` }}
          >
            <PromoContent promo={promo} />
          </PromoCard>
        ))}
      </Slider>
    </div>
  );
}
