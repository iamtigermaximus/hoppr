"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEvent, useJoinEvent, useLeaveEvent } from "@/hooks/useEvents";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { AvatarGroup } from "@/components/ui/AvatarGroup";
import { formatEventTime } from "@/lib/utils";

export function EventDetail({ id }: { id: string }) {
  const { data: event, isLoading } = useEvent(id);
  const { data: session } = useSession();
  const router = useRouter();
  const joinMutation = useJoinEvent(id);
  const leaveMutation = useLeaveEvent(id);

  if (isLoading) {
    return <div style={{ padding: 16, color: "#737373" }}>Loading...</div>;
  }
  if (!event || event.error) {
    return <div style={{ padding: 16, color: "#ef4444" }}>Event not found</div>;
  }

  const userId = (session?.user as any)?.id;
  const isJoined = event.participants?.some((p: any) => p.user.id === userId);
  const isCreator = event.creator?.id === userId;
  const isFull = event.maxAttendees && event.participants?.length >= event.maxAttendees;

  const sectionStyle: React.CSSProperties = { marginBottom: "20px" };
  const titleStyle: React.CSSProperties = { color: "#fff", fontWeight: 700, fontSize: "14px", marginBottom: "10px" };

  return (
    <div style={{ padding: "16px", maxWidth: "600px", margin: "0 auto" }}>
      <h1 style={{ fontWeight: 800, fontSize: "22px", color: "#fff", marginBottom: "8px" }}>{event.title}</h1>

      <div style={{ color: "#a3a3a3", fontSize: "13px", marginBottom: "16px", lineHeight: 1.6 }}>
        <Badge $type="event">EVENT</Badge>
        <br />
        <strong style={{ color: "#fff" }}>{event.venueName}</strong>
        <br />
        {formatEventTime(new Date(event.startTime))}
        {event.endTime && ` — ${formatEventTime(new Date(event.endTime))}`}
        <br />
        Organized by {event.creator?.username || "Anonymous"}
      </div>

      {event.description && (
        <div style={sectionStyle}>
          <h3 style={titleStyle}>About</h3>
          <p style={{ color: "#a3a3a3", fontSize: "13px", lineHeight: 1.5 }}>{event.description}</p>
        </div>
      )}

      <div style={sectionStyle}>
        <h3 style={titleStyle}>
          Attendees ({event.participants?.length || 0}
          {event.maxAttendees ? ` / ${event.maxAttendees}` : ""})
        </h3>
        {event.participants?.length > 0 ? (
          <AvatarGroup
            users={event.participants.map((p: any) => p.user)}
            max={10}
            size={40}
          />
        ) : (
          <p style={{ color: "#737373", fontSize: "13px" }}>No attendees yet. Be the first to join!</p>
        )}
      </div>

      <div style={sectionStyle}>
        {!isJoined && !isFull && (
          <Button size="lg" fullWidth onClick={() => joinMutation.mutate()} disabled={joinMutation.isPending}>
            {joinMutation.isPending ? "Joining..." : "Join Event"}
          </Button>
        )}
        {isFull && !isJoined && (
          <Button size="lg" fullWidth disabled>Event is Full</Button>
        )}
        {isJoined && !isCreator && (
          <Button variant="secondary" size="lg" fullWidth onClick={() => leaveMutation.mutate()} disabled={leaveMutation.isPending}>
            Leave Event
          </Button>
        )}
        {isJoined && (
          <Button size="lg" fullWidth style={{ marginTop: "8px" }} onClick={() => router.push(`/events/${id}/chat`)}>
            Open Chat
          </Button>
        )}
      </div>
    </div>
  );
}
