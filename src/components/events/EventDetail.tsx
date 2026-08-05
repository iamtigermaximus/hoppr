"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Calendar } from "@phosphor-icons/react";
import { useEvent, useJoinEvent, useLeaveEvent } from "@/hooks/useEvents";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { useToast } from "@/components/ui/Toast";
import ShareButton from "@/components/ui/ShareButton";
import SharePrompt from "@/components/ui/SharePrompt";
import { SkeletonDetail } from "@/components/ui/Skeleton";
import { formatEventTime } from "@/lib/utils";

export function EventDetail({ id }: { id: string }) {
  const { data: event, isLoading } = useEvent(id);
  const { data: session } = useSession();
  const router = useRouter();
  const { toast, confirm: confirmModal } = useToast();
  const joinMutation = useJoinEvent(id);
  const leaveMutation = useLeaveEvent(id);

  if (isLoading) return <SkeletonDetail />;
  if (!event || event.error) {
    return <div style={{ padding: 16, color: "#ef4444" }}>Event not found</div>;
  }

  const userId = (session?.user as any)?.id;
  const isJoined = event.participants?.some((p: any) => p.user.id === userId);
  const isCreator = event.creator?.id === userId;
  const isFull = event.maxAttendees && event.participants?.length >= event.maxAttendees;

  const sectionStyle: React.CSSProperties = { marginBottom: "20px" };
  const titleStyle: React.CSSProperties = { color: "var(--color-text-primary, #fff)", fontWeight: 700, fontSize: "14px", marginBottom: "10px" };

  return (
    <div style={{ padding: "16px", maxWidth: "600px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
        <button onClick={() => router.back()} style={{
          display: "inline-flex", alignItems: "center", gap: "6px",
          color: "var(--color-text-secondary, #a3a3a3)", fontSize: "13px", fontWeight: 500,
          background: "none", border: "none", cursor: "pointer", padding: 0,
        }}>
          ← Back
        </button>
        <ShareButton title={event.title} text={event.description} />
      </div>

      <div style={{ borderRadius: "16px", overflow: "hidden", height: "200px", marginBottom: "16px", background: event.imageUrl ? "var(--color-card, #1a1a1a)" : "linear-gradient(135deg, #1a0533, #2d1060, #0a0a0a)", display: "flex", alignItems: "center", justifyContent: "center" }}>
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

      {event.headlinerName && (
        <div style={{
          background: "linear-gradient(145deg, rgba(124,58,237,0.18), rgba(88,28,200,0.06))",
          border: "1px solid rgba(124,58,237,0.25)", borderRadius: "16px",
          padding: "20px", marginBottom: "16px",
          display: "flex", alignItems: "center", gap: "16px",
          position: "relative", overflow: "hidden",
        }}>
          {/* Subtle glow behind the photo */}
          <div style={{
            position: "absolute", top: "-20px", left: "-20px",
            width: "120px", height: "120px",
            background: "radial-gradient(circle, rgba(124,58,237,0.12), transparent 70%)",
            pointerEvents: "none",
          }} />
          {event.headlinerImage ? (
            <img src={event.headlinerImage} alt={event.headlinerName}
              style={{
                width: "72px", height: "72px", borderRadius: "16px", objectFit: "cover",
                border: "2px solid rgba(124,58,237,0.4)", boxShadow: "0 4px 20px rgba(124,58,237,0.2)",
                position: "relative", zIndex: 1,
              }} />
          ) : (
            <div style={{
              width: "72px", height: "72px", borderRadius: "16px",
              background: "linear-gradient(135deg, rgba(124,58,237,0.3), rgba(167,139,250,0.1))",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "32px", fontWeight: 800, color: "#c4b5fd",
              position: "relative", zIndex: 1, flexShrink: 0,
            }}>
              {event.headlinerName.charAt(0)}
            </div>
          )}
          <div style={{ flex: 1, position: "relative", zIndex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <span style={{
                color: "#a78bfa", fontSize: "10px", fontWeight: 700,
                letterSpacing: "1px", textTransform: "uppercase",
                background: "rgba(124,58,237,0.15)", padding: "3px 8px", borderRadius: "4px",
              }}>Featured Talent</span>
            </div>
            <div style={{ color: "#fff", fontWeight: 800, fontSize: "18px", lineHeight: 1.2 }}>{event.headlinerName}</div>
            {event.headlinerInstagram && (
              <a href={`https://instagram.com/${event.headlinerInstagram.replace("@", "")}`}
                target="_blank" rel="noopener noreferrer"
                style={{
                  color: "#a78bfa", fontSize: "13px", textDecoration: "none",
                  display: "inline-flex", alignItems: "center", gap: "5px", marginTop: "4px",
                  fontWeight: 500,
                }}>
                <span style={{ fontSize: "14px" }}>📸</span>
                @{event.headlinerInstagram.replace("@", "")}
              </a>
            )}
          </div>
        </div>
      )}

      <h1 style={{ fontWeight: 800, fontSize: "22px", color: "var(--color-text-primary, #fff)", marginBottom: "8px" }}>{event.title}</h1>

      <div style={{ color: "var(--color-text-secondary, #a3a3a3)", fontSize: "13px", marginBottom: "16px", lineHeight: 1.6 }}>
        <Badge $type="event">EVENT</Badge>
        {event.headlinerName && <Badge $type="featured">TALENT</Badge>}
        <br />
        <strong style={{ color: "var(--color-text-primary, #fff)" }}>{event.venueName}</strong>
        <br />
        {formatEventTime(new Date(event.startTime))}
        {event.endTime && ` — ${formatEventTime(new Date(event.endTime))}`}
        <br />
        Organized by {event.creator?.username || "Anonymous"}
      </div>

      {/* Share prompt — events are better with friends */}
      <SharePrompt
        storageKey={`event_${event.id}`}
        headline="Going to this event? Bring your friends!"
        subtitle={`Share ${event.title} at ${event.venueName} — more people, more fun.`}
        shareTitle={event.title}
        shareText={`Join me at ${event.title} at ${event.venueName} on Hoppr! ${formatEventTime(new Date(event.startTime))}`}
      />

      {event.description && (
        <div style={sectionStyle}>
          <h3 style={titleStyle}>About</h3>
          <p style={{ color: "var(--color-text-secondary, #a3a3a3)", fontSize: "13px", lineHeight: 1.5 }}>{event.description}</p>
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
                  padding: "10px 14px", background: "var(--color-card, #1a1a1a)", border: "1px solid var(--color-card-border, #262626)",
                  borderRadius: "12px", cursor: "pointer",
                  transition: "border-color 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#7c3aed44")}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--color-card-border, #262626)")}
              >
                <Avatar src={p.user.image} name={p.user.username || p.user.name} size={40} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ color: "var(--color-text-primary, #fff)", fontWeight: 600, fontSize: "13px" }}>
                      {p.user.username || p.user.name || "Anonymous"}
                    </span>
                    {p.user.id === event.creator?.id && (
                      <span style={{ background: "rgba(124,58,237,0.15)", color: "#a78bfa", fontSize: "9px", fontWeight: 700, padding: "2px 6px", borderRadius: "4px" }}>ORGANIZER</span>
                    )}
                  </div>
                  <div style={{ color: "var(--color-text-muted, #737373)", fontSize: "11px", marginTop: "1px" }}>
                    Joined {new Date(p.joinedAt || Date.now()).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </div>
                </div>
                <span style={{ color: "var(--color-text-muted, #737373)", fontSize: "10px" }}>View profile →</span>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: "var(--color-text-muted, #737373)", fontSize: "13px" }}>No attendees yet. Be the first to join!</p>
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
