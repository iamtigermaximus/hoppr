"use client";
import { useRouter } from "next/navigation";
import styled from "styled-components";
import { Calendar, MapPin, Ticket, Users, Clock, CurrencyCircleDollar } from "@phosphor-icons/react";
import { Badge } from "@/components/ui/Badge";
import { AvatarGroup } from "@/components/ui/AvatarGroup";
import { Button } from "@/components/ui/Button";
import type { FeedItem } from "@/types/feed";
import { formatDistance, formatEventTime } from "@/lib/utils";

const CardWrapper = styled.div<{ $color: string }>`
  background: #1a1a1a;
  border: 1px solid #262626;
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.15s ease;
  &:hover { border-color: ${({ $color }) => $color}44; }
`;

const CardImage = styled.div`
  height: 160px; width: 100%;
  background: #262626;
  position: relative;
  overflow: hidden;
  img { width: 100%; height: 100%; object-fit: cover; }
`;

const CardBody = styled.div`
  padding: 12px 14px 14px;
`;

const CardIconPlaceholder = styled.div<{ $color: string }>`
  height: 120px; width: 100%;
  background: linear-gradient(135deg, ${({ $color }) => $color}22, ${({ $color }) => $color}08);
  display: flex; align-items: center; justify-content: center;
`;

const TopBadge = styled.div`
  position: absolute; top: 10px; left: 10px; z-index: 2;
`;

const TopDistance = styled.div`
  position: absolute; top: 10px; right: 10px; z-index: 2;
  background: rgba(0,0,0,0.6); backdrop-filter: blur(4px);
  color: #fff; font-size: 10px; font-weight: 500;
  padding: 3px 8px; border-radius: 6px;
  display: inline-flex; align-items: center; gap: 3px;
`;

const TypeLabel = styled.div<{ $color: string }>`
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 9px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.5px;
  color: ${({ $color }) => $color};
  padding: 3px 8px; border-radius: 4px;
  background: ${({ $color }) => $color}15;
  margin-bottom: 6px;
`;

const typeLabels = {
  event: { label: "EVENT", icon: Calendar, color: "#3b82f6" },
  promotion: { label: "PROMO", icon: MapPin, color: "#10b981" },
  pass: { label: "VIP PASS", icon: Ticket, color: "#f59e0b" },
};

export function FeedCard({ item }: { item: FeedItem }) {
  const router = useRouter();
  const t = typeLabels[item.type];
  const color = t.color;
  const IconComponent = t.icon;
  const imageSrc = "image" in item ? (item as any).image : (item as any).imageUrl;

  const handleClick = () => {
    if (item.type === "event") router.push(`/events/${item.id}`);
    else if (item.type === "promotion") router.push(`/promotions/${item.id}`);
    else router.push(`/passes/${item.id}`);
  };

  return (
    <CardWrapper $color={color} onClick={handleClick}>
      {imageSrc ? (
        <CardImage>
          <img src={imageSrc} alt="" />
          <TopBadge><Badge $type={item.type === "promotion" ? "promo" : item.type}>{t.label}</Badge></TopBadge>
          <TopDistance><MapPin size={10} />{formatDistance(item.distance)}</TopDistance>
        </CardImage>
      ) : (
        <CardIconPlaceholder $color={color}>
          <div style={{ position: "absolute", top: "10px", left: "10px" }}><Badge $type={item.type === "promotion" ? "promo" : item.type}>{t.label}</Badge></div>
          <TopDistance style={{ position: "absolute" }}><MapPin size={10} />{formatDistance(item.distance)}</TopDistance>
          <IconComponent size={40} color={color} weight="fill" opacity={0.4} />
        </CardIconPlaceholder>
      )}

      <CardBody>
        {!imageSrc && <TypeLabel $color={color}><IconComponent size={10} weight="fill" />{t.label}</TypeLabel>}

        <div style={{ color: "#fff", fontWeight: 600, fontSize: "14px", marginBottom: "3px", lineHeight: 1.3 }}>
          {item.title}
        </div>

        <div style={{ color: "#a3a3a3", fontSize: "11px", marginBottom: "8px" }}>
          {item.type === "event" && `${item.venueName} · ${formatEventTime(new Date(item.startTime))}`}
          {item.type === "promotion" && `${item.venueName} · ${formatEventTime(new Date(item.validFrom))}`}
          {item.type === "pass" && `${item.venueName} · ${formatEventTime(new Date(item.validUntil))}`}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          {item.type === "event" && item.attendees && item.attendees.length > 0 ? (
            <AvatarGroup users={item.attendees} max={4} size={24} />
          ) : <div />}

          {item.type === "event" && (
            <Button size="sm" onClick={(e) => { e.stopPropagation(); handleClick(); }}><Users size={12} /> Join</Button>
          )}
          {item.type === "promotion" && (
            <Button size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); handleClick(); }}><Clock size={12} /> View</Button>
          )}
          {item.type === "pass" && (
            <>
              <span style={{ color: "#f59e0b", fontWeight: 700, fontSize: "15px" }}>
                €{item.price}
                {"originalPrice" in item && item.originalPrice && item.originalPrice > item.price && (
                  <span style={{ color: "#737373", fontSize: "11px", textDecoration: "line-through", marginLeft: "6px", fontWeight: 400 }}>€{item.originalPrice}</span>
                )}
              </span>
              <Button size="sm" onClick={(e) => { e.stopPropagation(); router.push(`/passes/${item.id}`); }}><CurrencyCircleDollar size={12} /> Buy</Button>
            </>
          )}
        </div>
      </CardBody>
    </CardWrapper>
  );
}
