"use client";
import { useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useChatMessages } from "@/hooks/useChat";
import { useEvent } from "@/hooks/useEvents";
import { useSocket } from "@/components/contexts/SocketContext";
import { MessageBubble } from "./MessageBubble";
import { ChatInput } from "./ChatInput";
import { CaretLeft } from "@phosphor-icons/react";

export function ChatRoom() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;
  const { data: event } = useEvent(eventId);
  const roomId = event?.chatRoom?.id || null;
  const { joinEventChat, leaveEventChat, isConnected } = useSocket();
  const { messages, sendMessage } = useChatMessages(roomId);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (eventId) joinEventChat(eventId);
    return () => { if (roomId) leaveEventChat(roomId); };
  }, [eventId, roomId]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: "calc(100dvh - 120px)", background: "#0a0a0a" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", borderBottom: "1px solid #262626" }}>
        <button onClick={() => router.back()} style={{ padding: "4px" }}>
          <CaretLeft size={24} color="#fff" />
        </button>
        <div>
          <div style={{ color: "#fff", fontWeight: 700, fontSize: "14px" }}>{event?.title || "Chat"}</div>
          <div style={{ color: "#737373", fontSize: "11px" }}>
            {event?.participants?.length || 0} participants
            {isConnected && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", color: "#10b981", fontSize: "10px", fontWeight: 600, marginLeft: "8px" }}>
                <span style={{ width: "6px", height: "6px", background: "#10b981", borderRadius: "50%" }} />
                LIVE
              </span>
            )}
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
        {messages.map(msg => <MessageBubble key={msg.id} message={msg} />)}
        <div ref={bottomRef} />
      </div>

      <ChatInput onSend={sendMessage} />
    </div>
  );
}
