"use client";
import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useChatMessages } from "@/hooks/useChat";
import { useEvent } from "@/hooks/useEvents";
import { useSocket } from "@/components/contexts/SocketContext";
import { Avatar } from "@/components/ui/Avatar";
import { MessageBubble } from "./MessageBubble";
import { ChatInput } from "./ChatInput";
import { CaretLeft, Info, X, Calendar } from "@phosphor-icons/react";
import { formatEventTime } from "@/lib/utils";

export function ChatRoom() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;
  const { data: event } = useEvent(eventId);
  const roomId = event?.chatRoom?.id || null;
  const { joinEventChat, leaveEventChat, isConnected } = useSocket();
  const { messages, sendMessage } = useChatMessages(roomId);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [showInfo, setShowInfo] = useState(false);

  useEffect(() => {
    if (eventId) joinEventChat(eventId);
    return () => { if (roomId) leaveEventChat(roomId); };
  }, [eventId, roomId]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: "calc(100dvh - 120px)", background: "#0a0a0a" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", borderBottom: "1px solid #262626" }}>
          <button onClick={() => router.back()} style={{ padding: "4px" }}>
            <CaretLeft size={24} color="#fff" />
          </button>
          <div style={{ flex: 1, cursor: "pointer" }} onClick={() => router.push(`/events/${eventId}`)}>
            <div style={{ color: "#fff", fontWeight: 700, fontSize: "14px" }}>{event?.title || "Chat"}</div>
            <div style={{ color: "#737373", fontSize: "11px" }}>
              {event?.participants?.length || 0} participants · Tap for details
              {isConnected && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", color: "#10b981", fontSize: "10px", fontWeight: 600, marginLeft: "8px" }}>
                  <span style={{ width: "6px", height: "6px", background: "#10b981", borderRadius: "50%" }} />
                  LIVE
                </span>
              )}
            </div>
          </div>
          <button onClick={() => setShowInfo(true)} style={{ padding: "4px", background: "none", border: "none", cursor: "pointer" }}>
            <Info size={22} color="#737373" />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
          {messages.map(msg => <MessageBubble key={msg.id} message={msg} />)}
          <div ref={bottomRef} />
        </div>

        <ChatInput onSend={sendMessage} />
      </div>

      {/* Info Modal */}
      {showInfo && event && (
        <div style={{ position: "fixed", inset: 0, zIndex: 150, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}
          onClick={() => setShowInfo(false)}>
          <div style={{
            background: "#1a1a1a", border: "1px solid #262626",
            borderRadius: "20px 20px 0 0", width: "100%", maxWidth: "500px",
            maxHeight: "80vh", overflowY: "auto", padding: "24px 20px 32px",
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ color: "#fff", fontWeight: 700, fontSize: "16px", margin: 0 }}>Event Info</h3>
              <button onClick={() => setShowInfo(false)} style={{ background: "none", border: "none", cursor: "pointer" }}>
                <X size={20} color="#737373" />
              </button>
            </div>

            <h2 style={{ color: "#fff", fontWeight: 800, fontSize: "18px", marginBottom: "8px" }}>{event.title}</h2>
            <div style={{ color: "#a3a3a3", fontSize: "13px", lineHeight: 1.6, marginBottom: "16px" }}>
              <div>{event.venueName}</div>
              <div>{formatEventTime(new Date(event.startTime))}{event.endTime ? ` — ${formatEventTime(new Date(event.endTime))}` : ""}</div>
              {event.description && <p style={{ marginTop: "8px" }}>{event.description}</p>}
            </div>

            <h4 style={{ color: "#fff", fontWeight: 700, fontSize: "14px", marginBottom: "10px" }}>
              Members ({event.participants?.length || 0})
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {event.participants?.map((p: any) => (
                <div
                  key={p.user.id}
                  onClick={() => { setShowInfo(false); router.push(`/profile/${p.user.id}`); }}
                  style={{
                    display: "flex", alignItems: "center", gap: "10px",
                    padding: "10px 12px", background: "#0a0a0a", border: "1px solid #262626",
                    borderRadius: "10px", cursor: "pointer",
                  }}
                >
                  <Avatar src={p.user.avatarUrl || p.user.image} name={p.user.username || p.user.name} size={32} />
                  <div style={{ flex: 1 }}>
                    <div style={{ color: "#fff", fontWeight: 600, fontSize: "13px" }}>{p.user.username || p.user.name}</div>
                  </div>
                  {p.user.id === event.creator?.id && (
                    <span style={{ background: "rgba(124,58,237,0.15)", color: "#a78bfa", fontSize: "9px", fontWeight: 700, padding: "2px 6px", borderRadius: "4px" }}>HOST</span>
                  )}
                  <span style={{ color: "#737373", fontSize: "10px" }}>Profile →</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
