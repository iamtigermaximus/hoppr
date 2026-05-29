"use client";
import { useRouter } from "next/navigation";
import { Calendar, MapPin, Ticket } from "@phosphor-icons/react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { AvatarGroup } from "@/components/ui/AvatarGroup";
import { Button } from "@/components/ui/Button";
import type { FeedItem } from "@/types/feed";
import { formatDistance, formatEventTime } from "@/lib/utils";

export function FeedCard({ item }: { item: FeedItem }) {
  const router = useRouter();

  const handleClick = () => {
    if (item.type === "event") router.push(`/events/${item.id}`);
    else if (item.type === "promotion") router.push(`/venues/${item.venueId}`);
    else router.push(`/passes`);
  };

  const icon = item.type === "event" ? Calendar : item.type === "promotion" ? MapPin : Ticket;
  const color = item.type === "event" ? "#3b82f6" : item.type === "promotion" ? "#10b981" : "#f59e0b";
  const IconComponent = icon;
  const badgeType = item.type === "promotion" ? "promo" : item.type;

  return (
    <Card onClick={handleClick} $accent={`${color}33`}>
      <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
        <div
          style={{
            minWidth: "48px", height: "48px",
            background: `linear-gradient(135deg, ${color}, ${color}dd)`,
            borderRadius: "12px",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <IconComponent size={20} color="#fff" weight="regular" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
            <Badge $type={badgeType}>{item.type}</Badge>
            <span style={{ fontSize: "10px", color: "#737373", display: "inline-flex", alignItems: "center", gap: "2px" }}>
              <MapPin size={10} />{formatDistance(item.distance)}
            </span>
          </div>
          <div style={{ color: "#fff", fontWeight: 600, fontSize: "13px", marginBottom: "2px" }}>
            {item.title}
          </div>
          <div style={{ color: "#a3a3a3", fontSize: "11px", marginBottom: "6px" }}>
            {item.type === "event" && `${item.venueName} · ${formatEventTime(new Date(item.startTime))}`}
            {item.type === "promotion" && `${item.venueName} · ${formatEventTime(new Date(item.validFrom))}`}
            {item.type === "pass" && `${item.venueName} · Valid until ${formatEventTime(new Date(item.validUntil))}`}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            {item.type === "event" && item.attendees && item.attendees.length > 0 && (
              <AvatarGroup users={item.attendees} max={5} size={22} />
            )}
            {item.type === "event" && !item.attendees?.length && <div />}
            {item.type === "event" && (
              <Button size="sm" onClick={(e) => { e.stopPropagation(); handleClick(); }}>Join</Button>
            )}
            {item.type === "promotion" && <div />}
            {item.type === "pass" && (
              <>
                <span style={{ color: "#f59e0b", fontWeight: 700, fontSize: "13px" }}>€{item.price}</span>
                <Button size="sm" onClick={(e) => { e.stopPropagation(); router.push(`/passes`); }}>Buy</Button>
              </>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
