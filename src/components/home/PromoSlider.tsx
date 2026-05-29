"use client";
import { useFeed } from "@/hooks/useFeed";
import { useGeolocation } from "@/hooks/useGeolocation";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Badge } from "@/components/ui/Badge";
import { formatDistance, formatEventTime } from "@/lib/utils";
import { MapPin } from "@phosphor-icons/react";

export function PromoSlider() {
  const { lat, lng } = useGeolocation();
  const { data: items = [] } = useFeed({ lat, lng, time: "today" });
  const promos = items.filter((i: any) => i.type === "promotion").slice(0, 5);

  if (!promos.length) return null;

  return (
    <div style={{ marginBottom: "18px" }}>
      <SectionHeader title="Promotions near you" onSeeAll={() => window.location.href = "/discover"} />
      <div style={{ display: "flex", gap: "10px", overflowX: "auto", padding: "0 16px", scrollSnapType: "x mandatory" }}>
        {promos.map((promo: any) => (
          <div
            key={promo.id}
            onClick={() => window.location.href = `/venues/${promo.venueId}`}
            style={{
              minWidth: "270px", borderRadius: "16px", padding: "16px",
              background: `linear-gradient(135deg, ${promo.accentColor || "#1a0533"}, ${promo.accentColor ? promo.accentColor + "cc" : "#2d1060"})`,
              border: "1px solid #333", scrollSnapAlign: "start", cursor: "pointer", position: "relative",
            }}
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
          </div>
        ))}
      </div>
    </div>
  );
}
