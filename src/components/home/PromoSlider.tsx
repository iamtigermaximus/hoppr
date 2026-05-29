"use client";
import { useState, useEffect, useCallback } from "react";
import styled from "styled-components";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Badge } from "@/components/ui/Badge";
import { formatEventTime } from "@/lib/utils";
import { MapPin, Fire, CaretLeft, CaretRight } from "@phosphor-icons/react";
import { mockPromotions } from "@/lib/marketing-api";

const Carousel = styled.div`
  position: relative; overflow: hidden;
  border-radius: 18px;
  margin-bottom: 4px;
  height: 180px;
  @media (min-width: 768px) { height: 220px; }
`;

const Slide = styled.div<{ $active: boolean }>`
  position: absolute; inset: 0;
  transition: opacity 0.6s ease, transform 0.6s ease;
  opacity: ${({ $active }) => $active ? 1 : 0};
  transform: ${({ $active }) => $active ? "translateX(0)" : "translateX(20px)"};
  pointer-events: ${({ $active }) => $active ? "auto" : "none"};
  cursor: pointer;
  padding: 24px;
  display: flex; flex-direction: column; justify-content: flex-end;
`;

const Dots = styled.div`
  display: flex; gap: 6px; justify-content: center;
  padding: 8px 0 16px;
`;

const Dot = styled.button<{ $active: boolean }>`
  width: ${({ $active }) => $active ? "20px" : "6px"};
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

const trending = mockPromotions.filter((p: any) => (p as any).priority && (p as any).priority >= 1).slice(0, 3);

export function PromoSlider() {
  const [current, setCurrent] = useState(0);

  const next = useCallback(() => setCurrent((prev) => (prev + 1) % trending.length), []);
  const prev = useCallback(() => setCurrent((p) => (p - 1 + trending.length) % trending.length), []);

  useEffect(() => {
    const timer = setInterval(next, 4000);
    return () => clearInterval(timer);
  }, [next]);

  if (!trending.length) return null;

  return (
    <div style={{ marginBottom: "18px", padding: "0 16px" }}>
      <SectionHeader title="🔥 Trending Now" />
      <Carousel>
        {trending.map((promo: any, i: number) => (
          <Slide
            key={promo.id}
            $active={i === current}
            onClick={() => window.location.href = `/venues/${promo.venueId}`}
            style={{ background: `linear-gradient(135deg, ${promo.accentColor || "#1a0533"}dd, ${promo.accentColor ? promo.accentColor + "88" : "#0a0a0a"})` }}
          >
            <div style={{ position: "absolute", top: "16px", left: "24px", display: "flex", gap: "6px" }}>
              <Badge $type="featured">TRENDING</Badge>
              <Badge $type="promo">PROMO</Badge>
            </div>
            <div style={{ marginTop: "auto" }}>
              <div style={{ color: "#fff", fontWeight: 800, fontSize: "20px", lineHeight: 1.2 }}>{promo.title}</div>
              <div style={{ color: "rgba(255,255,255,0.7)", fontSize: "13px", marginTop: "4px" }}>
                {promo.venueName} · {formatEventTime(new Date(promo.validFrom))}
              </div>
              <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                <span style={{ background: "rgba(255,255,255,0.15)", color: "#fff", fontSize: "10px", padding: "3px 10px", borderRadius: "20px", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                  <MapPin size={10} /> {promo.venueName} · {promo.description?.slice(0, 30)}...
                </span>
              </div>
            </div>
          </Slide>
        ))}
        <NavButton style={{ left: "8px" }} onClick={(e) => { e.stopPropagation(); prev(); }}><CaretLeft size={16} /></NavButton>
        <NavButton style={{ right: "8px" }} onClick={(e) => { e.stopPropagation(); next(); }}><CaretRight size={16} /></NavButton>
      </Carousel>
      <Dots>
        {trending.map((_: any, i: number) => (
          <Dot key={i} $active={i === current} onClick={() => setCurrent(i)} />
        ))}
      </Dots>
    </div>
  );
}
