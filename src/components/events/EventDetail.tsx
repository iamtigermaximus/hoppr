"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Calendar } from "@phosphor-icons/react";
import { useEvent, useJoinEvent, useLeaveEvent } from "@/hooks/useEvents";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { useToast } from "@/components/ui/Toast";
import { formatEventTime } from "@/lib/utils";

export function EventDetail({ id }: { id: string }) {
  const { data: event, isLoading } = useEvent(id);
  const { data: session } = useSession();
  const router = useRouter();
  const { toast, confirm: confirmModal } = useToast();
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
          {event.participants?.length || 0} Participant{(event.participants?.length || 0) !== 1 ? "s" : ""}
          {event.maxAttendees ? ` / ${event.maxAttendees} max` : ""}
        </h3>
        {event.participants?.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {event.participants.map((p: any) => (
              <div
                key={p.user.id}
                onClick={(e) => { e.stopPropagation(); router.push(`/profile/${p.user.id}`); }}
                style={{
                  display: "flex", alignItems: "center", gap: "12px",
                  padding: "10px 14px", background: "#1a1a1a", border: "1px solid #262626",
                  borderRadius: "12px", cursor: "pointer",
                  transition: "border-color 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#7c3aed44")}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#262626")}
              >
                <Avatar src={p.user.avatarUrl || p.user.image} name={p.user.username || p.user.name} size={40} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ color: "#fff", fontWeight: 600, fontSize: "13px" }}>
                      {p.user.username || p.user.name || "Anonymous"}
                    </span>
                    {p.user.id === event.creator?.id && (
                      <span style={{ background: "rgba(124,58,237,0.15)", color: "#a78bfa", fontSize: "9px", fontWeight: 700, padding: "2px 6px", borderRadius: "4px" }}>ORGANIZER</span>
                    )}
                  </div>
                  <div style={{ color: "#737373", fontSize: "11px", marginTop: "1px" }}>
                    Joined {new Date(p.joinedAt || Date.now()).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </div>
                </div>
                <span style={{ color: "#737373", fontSize: "10px" }}>View profile →</span>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: "#737373", fontSize: "13px" }}>No attendees yet. Be the first to join!</p>
        )}
      </div>

      <div style={sectionStyle}>
        {!isJoined && !isFull && (
          <Button size="lg" fullWidth onClick={() => joinMutation.mutate(undefined, { onSuccess: () => toast("Joined event!", "success") })} disabled={joinMutation.isPending}>
            {joinMutation.isPending ? "Joining..." : "Join Event"}
          </Button>
        )}
        {isFull && !isJoined && (
          <Button size="lg" fullWidth disabled>Event is Full</Button>
        )}
        {isJoined && !isCreator && (
          <Button variant="secondary" size="lg" fullWidth onClick={() => leaveMutation.mutate(undefined, { onSuccess: () => toast("Left event", "info") })} disabled={leaveMutation.isPending}>
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
            <Button size="lg" variant="ghost" fullWidth style={{ marginTop: "8px", color: "#ef4444" }} onClick={async () => {
              const confirmed = await confirmModal("Delete this event? This cannot be undone.");
              if (confirmed) {
                fetch(`/api/events/${id}`, { method: "DELETE" })
                  .then(() => { toast("Event deleted", "info"); router.push("/home"); });
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
