"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import styled from "styled-components";
import { Calendar, MapPin, Users, Clock, Storefront } from "@phosphor-icons/react";
import { Badge } from "@/components/ui/Badge";
import type { FeedItem } from "@/types/feed";
import { formatDistance, formatEventTime, formatPromoCountdown } from "@/lib/utils";

// ---- Styled Components ----

const Card = styled.div`
  background: var(--color-card, #1a1a1a);
  border: 1px solid var(--color-card-border, #262626);
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  transition: border-color 0.15s;
  display: flex;
  height: 120px;
  &:hover { border-color: #7c3aed44; }
`;

const CardImage = styled.div<{ $color: string }>`
  width: 120px;
  min-width: 120px;
  background: linear-gradient(135deg, ${({ $color }) => $color}18, ${({ $color }) => $color}06);
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    position: absolute;
    inset: 0;
  }
`;

const ImageFallbackIcon = styled.div`
  position: relative;
  z-index: 1;
`;

const CardBody = styled.div`
  padding: 12px 14px;
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
`;

const Title = styled.div`
  color: #fff;
  font-weight: 600;
  font-size: 14px;
  line-height: 1.25;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const Subtitle = styled.div`
  color: #a3a3a3;
  font-size: 11px;
  display: flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const BottomRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const Distance = styled.span`
  color: #737373;
  font-size: 10px;
  display: inline-flex;
  align-items: center;
  gap: 3px;
`;

const ActionBadge = styled.span<{ $color: string }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 600;
  color: ${({ $color }) => $color};
`;

// ---- Config ----

const typeConfig = {
  featured: { label: "FEATURED", icon: Storefront, color: "#a78bfa", badgeType: "featured" as const },
  event: { label: "EVENT", icon: Calendar, color: "#3b82f6", badgeType: "event" as const },
  promotion: { label: "PROMO", icon: MapPin, color: "#10b981", badgeType: "promo" as const },
};

// ---- Component ----

export function FeedCard({ item }: { item: FeedItem }) {
  const router = useRouter();
  const cardRef = useRef<HTMLDivElement>(null);
  const trackedRef = useRef(false);
  const [imgError, setImgError] = useState(false);

  const cfg = (typeConfig as Record<string, typeof typeConfig[keyof typeof typeConfig]>)[item.type] ?? {
    label: item.type.toUpperCase(),
    icon: MapPin,
    color: "#737373",
    badgeType: "event" as const,
  };
  const color = cfg.color;
  const Icon = cfg.icon;

  const imageSrc = "image" in item ? (item as any).image : (item as any).imageUrl;
  const isSponsored = item.isSponsored === true;
  const campaignId = (item as any).campaignId as string | undefined;

  const handleClick = () => {
    if (isSponsored && campaignId) {
      fetch(`/api/campaigns/${campaignId}/track`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "click" }),
      }).catch(() => {});
    }
    if (item.type === "featured") router.push(`/venues/${item.venueId}`);
    else if (item.type === "event") router.push(`/events/${item.id}`);
    else if (item.type === "promotion") router.push(`/promotions/${item.id}`);
  };

  // Impression tracking
  useEffect(() => {
    if (!isSponsored || !campaignId || trackedRef.current) return;
    const el = cardRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          trackedRef.current = true;
          observer.disconnect();
          fetch(`/api/campaigns/${campaignId}/track`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "impression" }),
          }).catch(() => {});
        }
      },
      { threshold: 0.5 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [isSponsored, campaignId]);

  const subtitleText = (() => {
    if (item.type === "featured") return item.venueType?.replace(/_/g, " ") || "Venue";
    if (item.type === "event") return `${item.venueName} · ${formatEventTime(new Date(item.startTime))}`;
    if (item.type === "promotion") return item.venueName;
    return "";
  })();

  return (
    <Card onClick={handleClick} ref={cardRef}>
      <CardImage $color={color}>
        {imageSrc && !imgError ? (
          <img src={imageSrc} alt="" onError={() => setImgError(true)} />
        ) : (
          <ImageFallbackIcon>
            <Icon size={36} color={color} weight="fill" opacity={0.25} />
          </ImageFallbackIcon>
        )}
        <div style={{ position: "absolute", top: "8px", left: "8px", zIndex: 2 }}>
          <Badge $type={cfg.badgeType}>{cfg.label}</Badge>
        </div>
      </CardImage>

      <CardBody>
        <Title>{item.title}</Title>

        <Subtitle>{subtitleText}</Subtitle>

        {item.type === "event" && item.headlinerName && (
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "5px", marginTop: "5px",
            background: "rgba(124,58,237,0.08)", borderRadius: "6px",
            padding: "3px 8px 3px 3px", alignSelf: "flex-start",
          }}>
            {item.headlinerImage ? (
              <img src={item.headlinerImage} alt={item.headlinerName}
                style={{ width: "20px", height: "20px", borderRadius: "5px", objectFit: "cover", flexShrink: 0 }} />
            ) : (
              <div style={{
                width: "20px", height: "20px", borderRadius: "5px",
                background: "linear-gradient(135deg, rgba(124,58,237,0.3), rgba(124,58,237,0.1))",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "10px", color: "#c4b5fd", fontWeight: 700, flexShrink: 0,
              }}>
                {item.headlinerName.charAt(0)}
              </div>
            )}
            <span style={{ color: "#c4b5fd", fontSize: "11px", fontWeight: 600, lineHeight: 1 }}>
              {item.headlinerName}
            </span>
          </div>
        )}

        <BottomRow>
          <Distance>
            <MapPin size={10} />
            {formatDistance(item.distance)}
          </Distance>

          {item.type === "event" && (
            <ActionBadge $color={color}>
              <Users size={12} /> Join
            </ActionBadge>
          )}
          {item.type === "promotion" && (
            <ActionBadge $color={color}>
              <Clock size={12} /> View
            </ActionBadge>
          )}
          {item.type === "featured" && (
            <ActionBadge $color={color}>
              <Storefront size={12} /> Visit
            </ActionBadge>
          )}
        </BottomRow>
      </CardBody>
    </Card>
  );
}
