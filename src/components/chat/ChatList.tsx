"use client";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { ChatCircle } from "@phosphor-icons/react";

async function fetchMyChats() {
  const res = await fetch("/api/chat/my-chats");
  if (!res.ok) throw new Error("Failed to fetch chats");
  return res.json();
}

export function ChatList() {
  const { data: rooms = [], isLoading } = useQuery({
    queryKey: ["my-chats"],
    queryFn: fetchMyChats,
    refetchInterval: 15000,
  });
  const router = useRouter();

  if (isLoading) return null;

  if (!rooms.length) {
    return (
      <div style={{ textAlign: "center", padding: "48px 16px", color: "#737373", fontSize: "14px" }}>
        <ChatCircle size={48} color="#737373" style={{ marginBottom: "12px" }} />
        <p>No active chats. Join an event to start chatting!</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "8px" }}>
      {rooms.map((room: any) => (
        <Card key={room.id} onClick={() => router.push(`/events/${room.event.id}/chat`)}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ color: "#fff", fontWeight: 600, fontSize: "13px" }}>
                {room.event?.title ?? "Chat"}
              </div>
              <div style={{ color: "#a3a3a3", fontSize: "11px", marginTop: "2px" }}>
                {room.event?.venueName && `${room.event.venueName} · `}
                {room.messages?.[0]?.content
                  ? room.messages[0].content.slice(0, 60)
                  : "No messages yet"}
              </div>
            </div>
            {room.unreadCount > 0 && (
              <div
                style={{
                  minWidth: "20px", height: "20px", padding: "0 6px",
                  background: "#7c3aed", borderRadius: "10px",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "11px", fontWeight: 700, color: "#fff",
                }}
              >
                {room.unreadCount > 99 ? "99+" : room.unreadCount}
              </div>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}
