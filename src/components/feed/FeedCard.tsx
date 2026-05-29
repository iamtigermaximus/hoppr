"use client";
import { useRouter } from "next/navigation";
import styled from "styled-components";
import { Calendar, MapPin, Ticket, Users, Clock, CurrencyCircleDollar } from "@phosphor-icons/react";
import { Badge } from "@/components/ui/Badge";
import { AvatarGroup } from "@/components/ui/AvatarGroup";
import { Button } from "@/components/ui/Button";
import type { FeedItem } from "@/types/feed";
import { formatDistance, formatEventTime } from "@/lib/utils";

const CardWrapper = styled.div<{ $color: string; $type: string }>`
  background: #1a1a1a;
  border: 1px solid #262626;
  border-left: 3px solid ${({ $color }) => $color};
  border-radius: 0 14px 14px 0;
  padding: 16px;
  cursor: pointer;
  transition: all 0.15s ease;
  position: relative;
  overflow: hidden;

  ${({ $type, $color }) => $type === "promotion" && `
    background: linear-gradient(135deg, ${$color}08, #1a1a1a);
  `}

  &:hover {
    border-color: ${({ $color }) => $color}44;
    border-left-color: ${({ $color }) => $color};
    background: ${({ $type, $color }) =>
      $type === "promotion" ? `linear-gradient(135deg, ${$color}12, #1e1e1e)` : "#1e1e1e"};
  }
`;

const IconBox = styled.div<{ $color: string; $type: string }>`
  min-width: 52px; width: 52px; height: 52px;
  border-radius: 14px;
  display: flex; align-items: center; justify-content: center;

  ${({ $type, $color }) => $type === "event" && `
    background: linear-gradient(135deg, ${$color}22, ${$color}0d);
    border: 1px solid ${$color}33;
  `}
  ${({ $type, $color }) => $type === "promotion" && `
    background: linear-gradient(135deg, ${$color}, ${$color}cc);
  `}
  ${({ $type, $color }) => $type === "pass" && `
    background: linear-gradient(135deg, ${$color}22, ${$color}0d);
    border: 1px solid ${$color}44;
  `}
`;

const TypeLabel = styled.div<{ $color: string }>`
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 9px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.5px;
  color: ${({ $color }) => $color};
  padding: 3px 8px; border-radius: 4px;
  background: ${({ $color }) => $color}15;
`;

const typeLabels = {
  event: { label: "EVENT", icon: Calendar, action: "Join", color: "#3b82f6" },
  promotion: { label: "PROMO", icon: MapPin, action: "View", color: "#10b981" },
  pass: { label: "VIP PASS", icon: Ticket, action: "Buy", color: "#f59e0b" },
};

const typeMeta = (item: FeedItem) => {
  switch (item.type) {
    case "event":
      return { subtitle: `${item.venueName} · ${formatEventTime(new Date(item.startTime))}`,
        extra: item.attendeeCount > 0 ? `${item.attendeeCount} going` : null };
    case "promotion":
      return { subtitle: `${item.venueName} · ${formatEventTime(new Date(item.validFrom))}`,
        extra: item.description?.slice(0, 50) };
    case "pass":
      return { subtitle: `${item.venueName} · Until ${formatEventTime(new Date(item.validUntil))}`,
        extra: null };
  }
};

export function FeedCard({ item }: { item: FeedItem }) {
  const router = useRouter();
  const t = typeLabels[item.type];
  const color = t.color;
  const IconComponent = t.icon;
  const meta = typeMeta(item);

  const handleClick = () => {
    if (item.type === "event") router.push(`/events/${item.id}`);
    else if (item.type === "promotion") router.push(`/promotions/${item.id}`);
    else router.push(`/passes/${item.id}`);
  };

  return (
    <CardWrapper $color={color} $type={item.type} onClick={handleClick}>
      <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
        {"image" in item && item.image ? (
          <div style={{
            minWidth: "52px", width: "52px", height: "52px",
            borderRadius: "14px", overflow: "hidden",
            background: "#262626",
          }}>
            <img src={item.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        ) : (
          <IconBox $color={color} $type={item.type}>
            <IconComponent size={22} color={item.type === "promotion" ? "#fff" : color} weight="fill" />
          </IconBox>
        )}

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Type label + distance */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
            <TypeLabel $color={color}>
              <IconComponent size={10} weight="fill" />{t.label}
            </TypeLabel>
            <span style={{ fontSize: "10px", color: "#737373", display: "inline-flex", alignItems: "center", gap: "3px" }}>
              <MapPin size={10} />{formatDistance(item.distance)}
            </span>
          </div>

          {/* Title */}
          <div style={{ color: "#fff", fontWeight: 600, fontSize: "14px", marginBottom: "3px", lineHeight: 1.3 }}>
            {item.title}
          </div>

          {/* Subtitle */}
          <div style={{ color: "#a3a3a3", fontSize: "11px", marginBottom: meta.extra ? "4px" : "0" }}>
            {meta.subtitle}
          </div>

          {/* Extra info */}
          {meta.extra && (
            <div style={{ color: "#737373", fontSize: "10px", marginBottom: "8px" }}>
              {meta.extra}
            </div>
          )}

          {/* Bottom row */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: item.type === "event" ? "2px" : "4px" }}>
            {item.type === "event" && item.attendees && item.attendees.length > 0 ? (
              <AvatarGroup users={item.attendees} max={4} size={24} />
            ) : (
              <div />
            )}

            {item.type === "event" && (
              <Button size="sm" onClick={(e) => { e.stopPropagation(); handleClick(); }}>
                <Users size={12} /> Join
              </Button>
            )}
            {item.type === "promotion" && (
              <Button size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); handleClick(); }}>
                <Clock size={12} /> View
              </Button>
            )}
            {item.type === "pass" && (
              <>
                <span style={{ color: "#f59e0b", fontWeight: 700, fontSize: "15px" }}>
                  €{item.price}
                  {"originalPrice" in item && item.originalPrice && item.originalPrice > item.price && (
                    <span style={{ color: "#737373", fontSize: "11px", textDecoration: "line-through", marginLeft: "6px", fontWeight: 400 }}>
                      €{item.originalPrice}
                    </span>
                  )}
                </span>
                <Button size="sm" onClick={(e) => { e.stopPropagation(); router.push(`/passes/${item.id}`); }}>
                  <CurrencyCircleDollar size={12} /> Buy
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </CardWrapper>
  );
}
