"use client";
import { useState, useEffect, useCallback } from "react";
import styled from "styled-components";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Badge } from "@/components/ui/Badge";
import { formatDistance, formatEventTime } from "@/lib/utils";
import { Star } from "@phosphor-icons/react";
import { useVenues } from "@/hooks/useVenues";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useQuery } from "@tanstack/react-query";

const Carousel = styled.div`
  position: relative; overflow: hidden;
  border-radius: 18px;
  margin-bottom: 4px;
  height: 280px;
  @media (min-width: 768px) { height: 340px; }
`;

const Slide = styled.div<{ $active: boolean; $imageUrl?: string }>`
  position: absolute; inset: 0;
  transition: opacity 0.6s ease, transform 0.6s ease;
  opacity: ${({ $active }) => $active ? 1 : 0};
  transform: ${({ $active }) => $active ? "translateX(0)" : "translateX(20px)"};
  pointer-events: ${({ $active }) => $active ? "auto" : "none"};
  cursor: pointer;
  padding: 28px;
  display: flex; flex-direction: column; justify-content: flex-end;
  ${({ $imageUrl }) => $imageUrl && `
    background-image: url(${$imageUrl});
    background-size: cover;
    background-position: center;
    &::before {
      content: "";
      position: absolute;
      inset: 0;
      border-radius: 18px;
      background: linear-gradient(transparent 30%, rgba(0,0,0,0.85));
      z-index: 0;
    }
  `}
`;

const Dots = styled.div`
  display: flex; gap: 6px; justify-content: center;
  padding: 8px 0 16px;
`;

const Dot = styled.button<{ $active: boolean }>`
  width: ${({ $active }) => $active ? "24px" : "6px"};
  height: 6px;
  border-radius: 3px;
  border: none;
  background: ${({ $active }) => $active ? "#7c3aed" : "#333"};
  transition: all 0.3s;
  cursor: pointer;
`;

const NavButton = styled.button`
  position: absolute; top: 50%; transform: translateY(-50%);
  z-index: 5;
  width: 36px; height: 36px;
  border-radius: 50%;
  background: rgba(0,0,0,0.5);
  border: 1px solid rgba(255,255,255,0.1);
  color: #fff;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  backdrop-filter: blur(4px);
  transition: background 0.2s;
  &:hover { background: rgba(0,0,0,0.7); }
`;

export function TrendingCarousel() {
  const [current, setCurrent] = useState(0);
  const { lat, lng } = useGeolocation();
  const { data: venues = [] } = useVenues();

  const { data: promotions = [] } = useQuery<any[]>({
    queryKey: ["promotions", "trending"],
    queryFn: () => fetch("/api/promotions").then((r) => r.json()),
  });

  // Build trending items: high-priority promos + top-rated venues
  const topPromos = promotions
    .filter((p: any) => p.priority && p.priority >= 1)
    .slice(0, 2)
    .map((p: any) => ({ ...p, itemType: "promo" as const }));

  const topVenues = (venues as any[])
    .filter((v: any) => v.qualityScore != null && v.qualityScore > 0)
    .sort((a: any, b: any) => (b.qualityScore || 0) - (a.qualityScore || 0))
    .slice(0, 2)
    .map((v: any) => {
      const distance = lat && lng && v.lat && v.lng
        ? Math.sqrt((v.lat - lat) ** 2 + (v.lng - lng) ** 2) * 111.32
        : 99;
      return { ...v, itemType: "venue" as const, distance };
    });

  const trending = [...topPromos, ...topVenues].slice(0, 4);

  const next = useCallback(() => setCurrent((prev) => (prev + 1) % trending.length), [trending.length]);
  const prev = useCallback(() => setCurrent((p) => (p - 1 + trending.length) % trending.length), [trending.length]);

  useEffect(() => {
    if (!trending.length) return;
    const timer = setInterval(next, 4000);
    return () => clearInterval(timer);
  }, [next, trending.length]);

  if (!trending.length) return null;

  const item = trending[current];
  const isPromo = item.itemType === "promo";

  const gradients = [
    "linear-gradient(135deg, #4c1d95 0%, #7c3aed 50%, #1a0533 100%)",
    "linear-gradient(135deg, #065f46 0%, #10b981 50%, #022c22 100%)",
    "linear-gradient(135deg, #991b1b 0%, #ef4444 50%, #1a0505 100%)",
    "linear-gradient(135deg, #1e3a5f 0%, #3b82f6 50%, #0a0a2e 100%)",
  ];
  const currentGradient = gradients[current] || gradients[0];

  return (
    <div style={{ marginBottom: "18px", padding: "0 16px" }}>
      <SectionHeader title="Trending Now" />
      <Carousel>
        {trending.map((t: any, i: number) => (
          <Slide
            key={`${t.itemType}-${t.id}`}
            $active={i === current}
            $imageUrl={t.imageUrl || t.coverImage}
            onClick={() => {
              if (t.itemType === "promo") window.location.href = `/promotions/${t.id}`;
              else window.location.href = `/venues/${t.id}`;
            }}
            style={{
              background: (t.imageUrl || t.coverImage) ? undefined : currentGradient,
            }}
          >
            <div style={{ position: "absolute", top: "20px", left: "28px", display: "flex", gap: "6px", zIndex: 1 }}>
              <Badge $type={isPromo ? "promo" : "pass"}>{isPromo ? "PROMO" : "TRENDING"}</Badge>
            </div>

            <div style={{ marginTop: "auto", position: "relative", zIndex: 1 }}>
              <div style={{ color: "#fff", fontWeight: 800, fontSize: "22px", lineHeight: 1.2 }}>
                {isPromo ? t.title : t.name}
              </div>
              <div style={{ color: "rgba(255,255,255,0.7)", fontSize: "14px", marginTop: "6px" }}>
                {isPromo
                  ? `${t.venueName} · ${formatEventTime(new Date(t.validFrom))}`
                  : `${t.type?.replace(/_/g, " ")} · ${t.district} · ${t.distance ? formatDistance(t.distance) : "Nearby"}`
                }
              </div>
              {isPromo && t.description && (
                <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px", marginTop: "6px", marginBottom: 0 }}>
                  {t.description.slice(0, 80)}{t.description.length > 80 ? "..." : ""}
                </p>
              )}
              {!isPromo && (
                <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", color: "rgba(255,255,255,0.7)", fontSize: "12px" }}>
                    <Star size={14} weight="fill" color="#f59e0b" /> {t.qualityScore || 0} quality
                  </span>
                </div>
              )}
            </div>
          </Slide>
        ))}
        <NavButton style={{ left: "8px" }} onClick={(e) => { e.stopPropagation(); prev(); }}>◀</NavButton>
        <NavButton style={{ right: "8px" }} onClick={(e) => { e.stopPropagation(); next(); }}>▶</NavButton>
      </Carousel>
      <Dots>
        {trending.map((_: any, i: number) => (
          <Dot key={i} $active={i === current} onClick={() => setCurrent(i)} />
        ))}
      </Dots>
    </div>
  );
}
