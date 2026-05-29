"use client";
import styled from "styled-components";
import { useFeed } from "@/hooks/useFeed";
import { useGeolocation } from "@/hooks/useGeolocation";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Badge } from "@/components/ui/Badge";
import { AvatarGroup } from "@/components/ui/AvatarGroup";
import { Button } from "@/components/ui/Button";
import { formatDistance, formatEventTime } from "@/lib/utils";
import { Calendar, MapPin, Users } from "@phosphor-icons/react";

const List = styled.div`
  display: flex; flex-direction: column; gap: 10px;
  padding: 0;

  @media (min-width: 768px) {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }
`;

const CardWrapper = styled.div`
  background: #1a1a1a; border: 1px solid #262626;
  border-radius: 16px; overflow: hidden; cursor: pointer;
  transition: border-color 0.15s;
  &:hover { border-color: #3b82f644; }
`;

const CardImage = styled.div`
  height: 140px; width: 100%; background: #262626;
  position: relative; overflow: hidden;
  img { width: 100%; height: 100%; object-fit: cover; }
`;

const CardPlaceholder = styled.div`
  height: 100px; width: 100%;
  background: linear-gradient(135deg, #3b82f622, #1d4ed808);
  display: flex; align-items: center; justify-content: center;
`;

const CardBody = styled.div`
  padding: 10px 14px 12px;
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
          <CardWrapper key={event.id} onClick={() => window.location.href = `/events/${event.id}`}>
            {event.image ? (
              <CardImage>
                <img src={event.image} alt="" />
                <div style={{ position: "absolute", top: "8px", left: "8px" }}><Badge $type="event">EVENT</Badge></div>
                <div style={{ position: "absolute", top: "8px", right: "8px", background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", color: "#fff", fontSize: "10px", padding: "3px 8px", borderRadius: "6px", display: "inline-flex", alignItems: "center", gap: "3px" }}>
                  <MapPin size={10} />{formatDistance(event.distance)}
                </div>
              </CardImage>
            ) : (
              <CardPlaceholder>
                <div style={{ position: "absolute", top: "8px", left: "8px" }}><Badge $type="event">EVENT</Badge></div>
                <div style={{ position: "absolute", top: "8px", right: "8px", background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", color: "#fff", fontSize: "10px", padding: "3px 8px", borderRadius: "6px", display: "inline-flex", alignItems: "center", gap: "3px" }}>
                  <MapPin size={10} />{formatDistance(event.distance)}
                </div>
                <Calendar size={32} color="#3b82f6" weight="fill" opacity={0.3} />
              </CardPlaceholder>
            )}

            <CardBody>
              <div style={{ color: "#fff", fontWeight: 600, fontSize: "14px", marginBottom: "3px" }}>{event.title}</div>
              <div style={{ color: "#a3a3a3", fontSize: "11px", marginBottom: "8px" }}>
                {event.venueName} · {formatEventTime(new Date(event.startTime))}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                {event.attendees?.length > 0 && <AvatarGroup users={event.attendees} max={4} size={24} />}
                {!event.attendees?.length && <div />}
                <Button size="sm" onClick={(e) => { e.stopPropagation(); window.location.href = `/events/${event.id}`; }}><Users size={12} /> Join</Button>
              </div>
            </CardBody>
          </CardWrapper>
        ))}
      </List>
    </div>
  );
}
