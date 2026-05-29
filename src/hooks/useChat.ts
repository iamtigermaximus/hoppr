"use client";
import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSocket } from "@/components/contexts/SocketContext";

interface Message {
  id: string; content: string;
  author: { id: string; username: string | null; image: string | null };
  createdAt: string;
}

export function useChatMessages(roomId: string | null) {
  const { socket } = useSocket();
  const [messages, setMessages] = useState<Message[]>([]);

  const { data: history = [] } = useQuery<Message[]>({
    queryKey: ["chat", roomId],
    queryFn: () => fetch(`/api/chat/${roomId}/messages`).then(r => r.json()),
    enabled: !!roomId,
  });

  useEffect(() => {
    setMessages(history);
  }, [history]);

  useEffect(() => {
    if (!socket) return;
    const handler = (msg: Message) => {
      setMessages(prev => [...prev, msg]);
    };
    socket.on("new-message", handler);
    return () => { socket.off("new-message", handler); };
  }, [socket]);

  const sendMessage = useCallback((content: string) => {
    if (!roomId || !socket) return;
    socket.emit("send-message", { roomId, content });
  }, [roomId, socket]);

  return { messages, sendMessage };
}
