"use client";
import { useUserProfile, useUserEvents } from "@/hooks/useProfile";
import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatEventTime } from "@/lib/utils";

export function ProfileView({ id }: { id: string }) {
  const { data: profile, isLoading } = useUserProfile(id);
  const { data: events = [] } = useUserEvents(id);

  if (isLoading) return <div style={{ padding: 16, color: "#737373" }}>Loading...</div>;
  if (!profile || profile.error) return <div style={{ padding: 16, color: "#ef4444" }}>User not found</div>;

  const created = events.filter((e: any) => e.creatorId === id);
  const joined = events.filter((e: any) => e.creatorId !== id);

  return (
    <div style={{ padding: "24px 16px", maxWidth: "600px", margin: "0 auto" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "24px" }}>
        <Avatar src={profile.avatarUrl} name={profile.username} size={80} />
        <h1 style={{ color: "#fff", fontWeight: 700, fontSize: "20px", marginTop: "12px" }}>{profile.username}</h1>
        {profile.bio && <p style={{ color: "#a3a3a3", fontSize: "13px", marginTop: "4px", textAlign: "center" }}>{profile.bio}</p>}
        <p style={{ color: "#737373", fontSize: "11px", marginTop: "8px" }}>
          Joined {new Date(profile.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
        </p>
      </div>

      {created.length > 0 && (
        <div style={{ marginBottom: "20px" }}>
          <h3 style={{ color: "#fff", fontWeight: 700, fontSize: "14px", marginBottom: "8px" }}>Events Created</h3>
          {created.map((event: any) => (
            <Card key={event.id} $accent="#3b82f644" onClick={() => window.location.href = `/events/${event.id}`} style={{ marginBottom: "8px" }}>
              <Badge $type="event">EVENT</Badge>
              <div style={{ color: "#fff", fontWeight: 600, fontSize: "13px", marginTop: "4px" }}>{event.title}</div>
              <div style={{ color: "#a3a3a3", fontSize: "11px" }}>{event.venueName} · {formatEventTime(new Date(event.startTime))}</div>
            </Card>
          ))}
        </div>
      )}

      {joined.length > 0 && (
        <div style={{ marginBottom: "20px" }}>
          <h3 style={{ color: "#fff", fontWeight: 700, fontSize: "14px", marginBottom: "8px" }}>Events Joined</h3>
          {joined.map((event: any) => (
            <Card key={event.id} onClick={() => window.location.href = `/events/${event.id}`} style={{ marginBottom: "8px" }}>
              <Badge $type="event">EVENT</Badge>
              <div style={{ color: "#fff", fontWeight: 600, fontSize: "13px", marginTop: "4px" }}>{event.title}</div>
              <div style={{ color: "#a3a3a3", fontSize: "11px" }}>{event.venueName} · {formatEventTime(new Date(event.startTime))}</div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
