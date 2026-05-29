"use client";
import { useSession } from "next-auth/react";
import { Avatar } from "@/components/ui/Avatar";

interface Message { id: string; content: string; author: { id: string; username: string | null; image: string | null }; createdAt: string; }

export function MessageBubble({ message }: { message: Message }) {
  const { data: session } = useSession();
  const isMine = (session?.user as any)?.id === message.author.id;

  const time = new Date(message.createdAt).toLocaleTimeString("en-US", {
    hour: "numeric", minute: "2-digit", hour12: true,
  });

  return (
    <div style={{ display: "flex", gap: "8px", flexDirection: isMine ? "row-reverse" : "row", alignItems: "flex-end", marginBottom: "12px" }}>
      {!isMine && <Avatar src={message.author.image} name={message.author.username || undefined} size={28} />}
      <div style={{
        maxWidth: "75%",
        background: isMine ? "#7c3aed" : "var(--color-card, #1a1a1a)",
        border: isMine ? "none" : "1px solid var(--color-card-border, #262626)",
        borderRadius: "14px", padding: "10px 14px",
      }}>
        {!isMine && <div style={{ color: isMine ? "var(--color-text-primary, #fff)" : "#a78bfa", fontSize: "10px", fontWeight: 600, marginBottom: "2px" }}>{message.author.username}</div>}
        <div style={{ color: isMine ? "#fff" : "var(--color-text-primary, #fff)", fontSize: "13px", lineHeight: 1.4 }}>{message.content}</div>
        <div style={{ color: isMine ? "rgba(255,255,255,0.5)" : "var(--color-text-muted, #737373)", fontSize: "9px", marginTop: "4px", textAlign: "right" }}>{time}</div>
      </div>
    </div>
  );
}
