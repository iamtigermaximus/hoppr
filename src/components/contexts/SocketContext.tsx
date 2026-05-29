"use client";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { getSocket, disconnectSocket } from "@/lib/socket-client";
import type { Socket } from "socket.io-client";

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  joinEventChat: (eventId: string) => void;
  leaveEventChat: (roomId: string) => void;
  sendMessage: (roomId: string, content: string) => void;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  joinEventChat: () => {},
  leaveEventChat: () => {},
  sendMessage: () => {},
});

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!session?.user) return;

    let socket: Socket | null = null;

    async function connect() {
      try {
        const res = await fetch("/api/auth/token");
        if (!res.ok) return;
        const { token } = await res.json();
        socket = getSocket(token);
        socketRef.current = socket;
        socket.on("connect", () => setIsConnected(true));
        socket.on("disconnect", () => setIsConnected(false));
      } catch (e) {
        console.error("Socket connection failed:", e);
      }
    }

    connect();

    return () => {
      if (socket) socket.disconnect();
      setIsConnected(false);
    };
  }, [session]);

  const joinEventChat = (eventId: string) => {
    socketRef.current?.emit("join-event-chat", { eventId });
  };

  const leaveEventChat = (roomId: string) => {
    socketRef.current?.emit("leave-event-chat", { roomId });
  };

  const sendMessage = (roomId: string, content: string) => {
    socketRef.current?.emit("send-message", { roomId, content });
  };

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, isConnected, joinEventChat, leaveEventChat, sendMessage }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
