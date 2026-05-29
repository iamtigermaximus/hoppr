"use client";
import { useRouter } from "next/navigation";
import { Calendar, MapPin, Ticket } from "@phosphor-icons/react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { AvatarGroup } from "@/components/ui/AvatarGroup";
import { Button } from "@/components/ui/Button";
import type { FeedItem } from "@/types/feed";
import { formatDistance, formatEventTime } from "@/lib/utils";

const iconMap = { event: Calendar, promotion: MapPin, pass: Ticket };
const colorMap = { event: "#3b82f6", promotion: "#10b981", pass: "#f59e0b" };

export function FeedCard({ item }: { item: FeedItem }) {
  const router = useRouter();
  const color = colorMap[item.type];
  const IconComponent = iconMap[item.type];
  const badgeType = item.type === "promotion" ? "promo" : item.type;

  const handleClick = () => {
    if (item.type === "event") router.push(`/events/${item.id}`);
    else if (item.type === "promotion") router.push(`/venues/${item.venueId}`);
    else router.push(`/passes`);
  };

  return (
    <Card onClick={handleClick} $accent={`${color}22`}>
      <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
        {/* Icon */}
        <div style={{
          minWidth: "52px", width: "52px", height: "52px",
          background: `linear-gradient(135deg, ${color}22, ${color}11)`,
          border: `1px solid ${color}33`,
          borderRadius: "14px",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <IconComponent size={22} color={color} weight="fill" />
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Top row: badge + distance */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
            <Badge $type={badgeType}>{item.type}</Badge>
            <span style={{ fontSize: "10px", color: "#737373", display: "inline-flex", alignItems: "center", gap: "3px" }}>
              <MapPin size={10} />{formatDistance(item.distance)}
            </span>
          </div>

          {/* Title */}
          <div style={{ color: "#fff", fontWeight: 600, fontSize: "14px", marginBottom: "3px", lineHeight: 1.3 }}>
            {item.title}
          </div>

          {/* Subtitle */}
          <div style={{ color: "#a3a3a3", fontSize: "11px", marginBottom: "8px" }}>
            {item.type === "event" && `${item.venueName} · ${formatEventTime(new Date(item.startTime))}`}
            {item.type === "promotion" && `${item.venueName} · ${formatEventTime(new Date(item.validFrom))}`}
            {item.type === "pass" && `${item.venueName} · Valid until ${formatEventTime(new Date(item.validUntil))}`}
          </div>

          {/* Bottom row: avatars + action */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            {item.type === "event" && item.attendees && item.attendees.length > 0 ? (
              <AvatarGroup users={item.attendees} max={4} size={24} />
            ) : (
              <div />
            )}
            {item.type === "event" && (
              <Button size="sm" onClick={(e) => { e.stopPropagation(); handleClick(); }}>Join</Button>
            )}
            {item.type === "pass" && (
              <>
                <span style={{ color: "#f59e0b", fontWeight: 700, fontSize: "14px" }}>
                  €{item.price}
                  {"originalPrice" in item && item.originalPrice && item.originalPrice > item.price && (
                    <span style={{ color: "#737373", fontSize: "11px", textDecoration: "line-through", marginLeft: "5px", fontWeight: 400 }}>
                      €{item.originalPrice}
                    </span>
                  )}
                </span>
                <Button size="sm" onClick={(e) => { e.stopPropagation(); router.push("/passes"); }}>Buy</Button>
              </>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
