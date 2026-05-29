"use client";
import styled from "styled-components";
import { useFeed } from "@/hooks/useFeed";
import { useGeolocation } from "@/hooks/useGeolocation";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Badge } from "@/components/ui/Badge";
import { AvatarGroup } from "@/components/ui/AvatarGroup";
import { Button } from "@/components/ui/Button";
import { formatDistance, formatEventTime } from "@/lib/utils";
import { Calendar, MapPin, Users, CheckCircle } from "@phosphor-icons/react";
import { useSession } from "next-auth/react";

const List = styled.div`
  display: flex; flex-direction: column; gap: 10px;

  @media (min-width: 768px) {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }

  @media (min-width: 1200px) {
    grid-template-columns: 1fr 1fr 1fr;
  }
`;

const CardWrapper = styled.div`
  background: var(--color-card, #1a1a1a); border: 1px solid var(--color-card-border, #262626);
  border-radius: 16px; overflow: hidden; cursor: pointer;
  transition: border-color 0.15s; display: flex;
  &:hover { border-color: #3b82f644; }
`;

const CardImage = styled.div`
  width: 120px; min-width: 120px; position: relative; overflow: hidden; background: #262626;
  img { width: 100%; height: 100%; object-fit: cover; position: absolute; inset: 0; }
`;

const CardPlaceholder = styled.div`
  width: 100px; min-width: 100px;
  background: linear-gradient(135deg, #3b82f622, #1d4ed808);
  display: flex; align-items: center; justify-content: center;
`;

const CardBody = styled.div`
  padding: 14px 16px; flex: 1; min-width: 0;
  display: flex; flex-direction: column; justify-content: center;
`;

export function EventList() {
  const { lat, lng } = useGeolocation();
  const { data: session } = useSession();
  const userId = (session?.user as any)?.id as string | undefined;
  const { data: items = [] } = useFeed({ lat, lng, time: "today" });
  const events = items.filter((i: any) => i.type === "event").slice(0, 6);

  if (!events.length) return null;

  return (
    <div style={{ marginBottom: "18px", padding: "0 16px" }}>
      <SectionHeader title="Events near you" onSeeAll={() => window.location.href = "/discover"} />
      <List>
        {events.map((event: any) => {
          const isJoined = userId && event.attendees?.some((a: any) => a.id === userId);
          return (
          <CardWrapper key={event.id} onClick={() => window.location.href = `/events/${event.id}`}>
            {event.image ? (
              <CardImage>
                <img src={event.image} alt="" />
                <div style={{ position: "absolute", top: "8px", left: "8px", display: "flex", gap: "6px" }}>
                  <Badge $type="event">EVENT</Badge>
                  {isJoined && (
                    <span style={{ background: "rgba(16,185,129,0.8)", backdropFilter: "blur(4px)", color: "#fff", fontSize: "9px", fontWeight: 700, padding: "3px 8px", borderRadius: "4px", display: "inline-flex", alignItems: "center", gap: "3px" }}>
                      <CheckCircle size={10} weight="fill" /> JOINED
                    </span>
                  )}
                </div>
              </CardImage>
            ) : (
              <CardPlaceholder>
                <Calendar size={32} color="#3b82f6" weight="fill" opacity={0.3} />
              </CardPlaceholder>
            )}

            <CardBody>
              <div style={{ color: "#fff", fontWeight: 600, fontSize: "14px", marginBottom: "4px" }}>{event.title}</div>
              <div style={{ color: "#a3a3a3", fontSize: "11px", marginBottom: "6px" }}>
                {event.venueName} · {formatEventTime(new Date(event.startTime))}
              </div>
              <div style={{ color: "#737373", fontSize: "10px", marginBottom: "6px", display: "inline-flex", alignItems: "center", gap: "3px" }}>
                <MapPin size={10} />{formatDistance(event.distance)}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                {event.attendees?.length > 0 && <AvatarGroup users={event.attendees} max={4} size={24} />}
                {!event.attendees?.length && <div />}
                {isJoined ? (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", color: "#10b981", fontSize: "12px", fontWeight: 600 }}>
                    <CheckCircle size={14} weight="fill" /> Joined
                  </span>
                ) : (
                  <Button size="sm" onClick={(e) => { e.stopPropagation(); window.location.href = `/events/${event.id}`; }}><Users size={12} /> Join</Button>
                )}
              </div>
            </CardBody>
          </CardWrapper>
        )})}
      </List>
    </div>
  );
}
