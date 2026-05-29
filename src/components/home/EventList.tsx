"use client";
import styled from "styled-components";
import { useFeed } from "@/hooks/useFeed";
import { useGeolocation } from "@/hooks/useGeolocation";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Badge } from "@/components/ui/Badge";
import { AvatarGroup } from "@/components/ui/AvatarGroup";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { formatDistance, formatEventTime } from "@/lib/utils";
import { Calendar, MapPin } from "@phosphor-icons/react";

const List = styled.div`
  display: flex; flex-direction: column; gap: 8px;
  padding: 0 16px;

  @media (min-width: 768px) {
    display: grid;
    grid-template-columns: 1fr 1fr;
    padding: 0;
  }
`;

export function EventList() {
  const { lat, lng } = useGeolocation();
  const { data: items = [] } = useFeed({ lat, lng, time: "today" });
  const events = items.filter((i: any) => i.type === "event").slice(0, 6);

  if (!events.length) return null;

  return (
    <div style={{ marginBottom: "18px", padding: "0 16px" }}>
      <SectionHeader title="Events near you" onSeeAll={() => window.location.href = "/discover"} />
      <List>
        {events.map((event: any) => (
          <Card key={event.id} onClick={() => window.location.href = `/events/${event.id}`} $accent="#3b82f644">
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <div style={{ minWidth: "72px", width: "72px", height: "72px", borderRadius: "14px", overflow: "hidden", background: event.image ? "#262626" : "linear-gradient(135deg, #7c3aed, #5b21b6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {event.image ? (
                  <img src={event.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <Calendar size={26} color="#fff" />
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                  <Badge $type="event">EVENT</Badge>
                  <span style={{ fontSize: "10px", color: "#737373", display: "inline-flex", alignItems: "center", gap: "2px" }}>
                    <MapPin size={10} /> {formatDistance(event.distance)}
                  </span>
                </div>
                <div style={{ color: "#fff", fontWeight: 600, fontSize: "13px" }}>{event.title}</div>
                <div style={{ color: "#a3a3a3", fontSize: "11px", marginTop: "2px" }}>
                  {event.venueName} · {formatEventTime(new Date(event.startTime))}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "8px" }}>
                  {event.attendees?.length > 0 && <AvatarGroup users={event.attendees} max={5} size={24} />}
                  {!event.attendees?.length && <div />}
                  <Button size="sm" onClick={(e) => { e.stopPropagation(); window.location.href = `/events/${event.id}`; }}>Join</Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </List>
    </div>
  );
}
