"use client";
import { useRouter } from "next/navigation";
import styled from "styled-components";
import { Calendar, MapPin, Ticket, Users, Clock, CurrencyCircleDollar, CheckCircle } from "@phosphor-icons/react";
import { useSession } from "next-auth/react";
import { Badge } from "@/components/ui/Badge";
import { AvatarGroup } from "@/components/ui/AvatarGroup";
import { Button } from "@/components/ui/Button";
import type { FeedItem } from "@/types/feed";
import { formatDistance, formatEventTime } from "@/lib/utils";

const CardWrapper = styled.div<{ $color: string }>`
  background: var(--color-card, #1a1a1a);
  border: 1px solid var(--color-card-border, #262626);
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  transition: border-color 0.15s;
  display: flex;
  &:hover { border-color: ${({ $color }) => $color}44; }
`;

const CardImage = styled.div`
  width: 120px; min-width: 120px;
  background: #262626;
  position: relative;
  overflow: hidden;
  img { width: 100%; height: 100%; object-fit: cover; position: absolute; inset: 0; }
`;

const CardIconPlaceholder = styled.div<{ $color: string }>`
  width: 100px; min-width: 100px;
  background: linear-gradient(135deg, ${({ $color }) => $color}22, ${({ $color }) => $color}08);
  display: flex; align-items: center; justify-content: center;
`;

const CardBody = styled.div`
  padding: 14px 16px;
  flex: 1; min-width: 0;
  display: flex; flex-direction: column; justify-content: center;
`;

const TopBadge = styled.div`
  position: absolute; top: 8px; left: 8px; z-index: 2;
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
  const { data: session } = useSession();
  const userId = (session?.user as any)?.id as string | undefined;
  const t = typeLabels[item.type];
  const color = t.color;
  const IconComponent = t.icon;
  const imageSrc = "image" in item ? (item as any).image : (item as any).imageUrl;

  const handleClick = () => {
    if (item.type === "event") router.push(`/events/${item.id}`);
    else if (item.type === "promotion") router.push(`/promotions/${item.id}`);
    else router.push(`/passes/${item.id}`);
  };

  // Check user status for this item
  const isEventJoined = item.type === "event" && userId && (item as any).attendees?.some((a: any) => a.id === userId);

  return (
    <CardWrapper $color={color} onClick={handleClick}>
      {imageSrc ? (
        <CardImage>
          <img src={imageSrc} alt="" />
          <div style={{ position: "absolute", top: "8px", left: "8px", display: "flex", gap: "6px", zIndex: 2 }}>
            <Badge $type={item.type === "promotion" ? "promo" : item.type}>{t.label}</Badge>
            {isEventJoined && (
              <span style={{ background: "rgba(16,185,129,0.8)", backdropFilter: "blur(4px)", color: "#fff", fontSize: "9px", fontWeight: 700, padding: "3px 8px", borderRadius: "4px", display: "inline-flex", alignItems: "center", gap: "3px" }}>
                <CheckCircle size={10} weight="fill" /> JOINED
              </span>
            )}
          </div>
        </CardImage>
      ) : (
        <CardIconPlaceholder $color={color}>
          <IconComponent size={36} color={color} weight="fill" opacity={0.3} />
        </CardIconPlaceholder>
      )}

      <CardBody>
        {!imageSrc && <TypeLabel $color={color}><IconComponent size={10} weight="fill" />{t.label}</TypeLabel>}

        <div style={{ color: "#fff", fontWeight: 600, fontSize: "14px", marginBottom: "4px", lineHeight: 1.3 }}>
          {item.title}
        </div>

        <div style={{ color: "#a3a3a3", fontSize: "11px", marginBottom: "6px" }}>
          {item.type === "event" && `${item.venueName} · ${formatEventTime(new Date(item.startTime))}`}
          {item.type === "promotion" && `${item.venueName} · ${formatEventTime(new Date(item.validFrom))}`}
          {item.type === "pass" && `${item.venueName} · ${formatEventTime(new Date(item.validUntil))}`}
        </div>

        <div style={{ color: "#737373", fontSize: "10px", marginBottom: "6px", display: "inline-flex", alignItems: "center", gap: "3px" }}>
          <MapPin size={10} />{formatDistance(item.distance)}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          {item.type === "event" && item.attendees && item.attendees.length > 0 ? (
            <AvatarGroup users={item.attendees} max={4} size={24} />
          ) : <div />}

          {item.type === "event" && (
            isEventJoined ? (
              <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", color: "#10b981", fontSize: "12px", fontWeight: 600 }}>
                <CheckCircle size={14} weight="fill" /> Joined
              </span>
            ) : (
              <Button size="sm" onClick={(e) => { e.stopPropagation(); handleClick(); }}><Users size={12} /> Join</Button>
            )
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
