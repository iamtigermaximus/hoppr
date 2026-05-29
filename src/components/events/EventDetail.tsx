"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Calendar } from "@phosphor-icons/react";
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
      <button onClick={() => router.back()} style={{
        display: "inline-flex", alignItems: "center", gap: "6px",
        color: "#a3a3a3", fontSize: "13px", fontWeight: 500,
        background: "none", border: "none", cursor: "pointer", padding: 0,
        marginBottom: "12px",
      }}>
        ← Back
      </button>

      <div style={{ borderRadius: "16px", overflow: "hidden", height: "200px", marginBottom: "16px", background: event.imageUrl ? "#1a1a1a" : "linear-gradient(135deg, #1a0533, #2d1060, #0a0a0a)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {event.imageUrl ? (
          <img src={event.imageUrl} alt={event.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <div style={{ textAlign: "center" }}>
            <div style={{ width: "64px", height: "64px", background: "rgba(124,58,237,0.2)", borderRadius: "16px", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px" }}>
              <Calendar size={32} color="#a78bfa" weight="fill" />
            </div>
            <div style={{ color: "#a78bfa", fontSize: "13px", fontWeight: 600 }}>{event.venueName}</div>
          </div>
        )}
      </div>

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

        {isCreator && (
          <>
            <Button size="lg" variant="secondary" fullWidth style={{ marginTop: "8px" }} onClick={() => router.push(`/events/${id}/edit`)}>
              Edit Event
            </Button>
            <Button size="lg" variant="ghost" fullWidth style={{ marginTop: "8px", color: "#ef4444" }} onClick={() => {
              if (confirm("Delete this event? This cannot be undone.")) {
                fetch(`/api/events/${id}`, { method: "DELETE" }).then(() => router.push("/home"));
              }
            }}>
              Delete Event
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
