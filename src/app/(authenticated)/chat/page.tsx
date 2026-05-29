"use client";
import { ChatList } from "@/components/chat/ChatList";

export default function ChatListPage() {
  return (
    <>
      <div style={{ padding: "16px 16px 0" }}>
        <h1 style={{ fontWeight: 800, fontSize: "18px", color: "#fff", letterSpacing: "-0.5px" }}>Chats</h1>
      </div>
      <ChatList />
    </>
  );
}
