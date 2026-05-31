"use client";
import { useEvents } from "@/hooks/useEvents";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { AvatarGroup } from "@/components/ui/AvatarGroup";
import { ChatCircle } from "@phosphor-icons/react";
import { formatEventTime } from "@/lib/utils";

export function ChatList() {
  const { data: session } = useSession();
  const userId = (session?.user as any)?.id;
  const { data: events = [] } = useEvents({ userId });
  const router = useRouter();

  const myEvents = events
    .filter((e: any) =>
      e.participants?.some((p: any) => p.user.id === userId) || e.creatorId === userId
    )
    // Sort by most recently started first (closest to now)
    .sort((a: any, b: any) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

  if (!myEvents.length) {
    return (
      <div style={{ textAlign: "center", padding: "48px 16px", color: "#737373", fontSize: "14px" }}>
        <ChatCircle size={48} color="#737373" style={{ marginBottom: "12px" }} />
        <p>No active chats. Join an event to start chatting!</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "8px" }}>
      {myEvents.map((event: any) => (
        <Card key={event.id} onClick={() => router.push(`/events/${event.id}/chat`)}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ color: "#fff", fontWeight: 600, fontSize: "13px" }}>{event.title}</div>
              <div style={{ color: "#a3a3a3", fontSize: "11px", marginTop: "2px" }}>
                {event.venueName} · {event.participants?.length || 0} participants · {formatEventTime(new Date(event.startTime))}
              </div>
            </div>
            {event.participants?.length > 0 && (
              <AvatarGroup
                users={event.participants.map((p: any) => ({
                  id: p.user.id, name: p.user.username, image: p.user.image,
                }))}
                max={4} size={26}
              />
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}
