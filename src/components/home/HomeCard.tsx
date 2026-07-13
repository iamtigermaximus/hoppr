"use client";
import { useRouter } from "next/navigation";
import styled from "styled-components";
import { Calendar, MapPin, Ticket, Storefront } from "@phosphor-icons/react";
import { Badge } from "@/components/ui/Badge";
import { formatDistance, formatEventTime } from "@/lib/utils";

// ---- Styled ----

export const Card = styled.div`
  min-width: 260px;
  border-radius: 14px;
  background: #1a1a1a;
  border: 1px solid #262626;
  padding: 16px;
  scroll-snap-align: start;
  cursor: pointer;
  transition: border-color 0.15s;
  &:hover {
    border-color: #7c3aed44;
  }

  @media (min-width: 768px) {
    min-width: unset;
  }
`;

const CardImage = styled.div<{ $url?: string; $color: string }>`
  width: 100%;
  height: 100px;
  border-radius: 10px;
  margin-bottom: 12px;
  background: ${({ $url, $color }) =>
    $url
      ? `url(${$url}) center/cover`
      : `linear-gradient(135deg, ${$color}22, ${$color}08)`};
  position: relative;
  overflow: hidden;
`;

const ImageFallback = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const VenueRow = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
`;

const VenueName = styled.span`
  color: #a3a3a3;
  font-size: 11px;
  font-weight: 500;
`;

const Title = styled.div`
  color: #fff;
  font-weight: 700;
  font-size: 14px;
  margin-bottom: 6px;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const MetaRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: #737373;
  font-size: 11px;
`;

// ---- Grid (shared by all sections) ----

export const CardGrid = styled.div`
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding: 0 16px;
  scroll-snap-type: x mandatory;

  @media (min-width: 768px) {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    overflow-x: visible;
    scroll-snap-type: none;
    padding: 0;
  }
  @media (min-width: 1200px) {
    grid-template-columns: repeat(3, 1fr);
  }
`;

// ---- Config ----

type CardType = "event" | "promotion" | "venue";

const typeConfig: Record<CardType, { label: string; icon: typeof Calendar; color: string; badgeType: "event" | "promo" | "featured"; getHref: (item: HomeCardItem) => string }> = {
  event: {
    label: "EVENT",
    icon: Calendar,
    color: "#3b82f6",
    badgeType: "event",
    getHref: (item) => `/events/${item.id}`,
  },
  promotion: {
    label: "PROMO",
    icon: Ticket,
    color: "#10b981",
    badgeType: "promo",
    getHref: (item) => `/promotions/${item.id}`,
  },
  venue: {
    label: "VENUE",
    icon: Storefront,
    color: "#a78bfa",
    badgeType: "featured",
    getHref: (item) => `/venues/${item.id}`,
  },
};

// ---- Types ----

export interface HomeCardItem {
  id: string;
  type: CardType;
  title: string;
  venueName: string;
  image?: string;
  distance?: number;
  startTime?: string;
  validFrom?: string;
  accentColor?: string;
}

// ---- Component ----

export function HomeCard({ item }: { item: HomeCardItem }) {
  const router = useRouter();
  const cfg = typeConfig[item.type];
  const Icon = cfg.icon;

  const timeLabel =
    item.type === "event" && item.startTime
      ? formatEventTime(new Date(item.startTime))
      : item.validFrom
        ? formatEventTime(new Date(item.validFrom))
        : null;

  return (
    <Card onClick={() => router.push(cfg.getHref(item))}>
      <CardImage $url={item.image} $color={cfg.color}>
        {!item.image && (
          <ImageFallback>
            <Icon size={36} color={cfg.color} weight="fill" opacity={0.25} />
          </ImageFallback>
        )}
        <div
          style={{
            position: "absolute",
            top: "8px",
            left: "8px",
            display: "flex",
            gap: "6px",
          }}
        >
          <Badge $type={cfg.badgeType}>{cfg.label}</Badge>
        </div>
      </CardImage>

      <VenueRow>
        <MapPin size={12} color="#7c3aed" weight="fill" />
        <VenueName>{item.venueName}</VenueName>
      </VenueRow>

      <Title>{item.title}</Title>

      <MetaRow>
        {timeLabel && (
          <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
            <Icon size={12} />
            {timeLabel}
          </span>
        )}
        {item.distance != null && (
          <span>{formatDistance(item.distance)}</span>
        )}
      </MetaRow>
    </Card>
  );
}
