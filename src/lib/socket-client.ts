"use client";
import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getSocket(token: string): Socket {
  if (!socket || !socket.connected) {
    socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001", {
      auth: { token },
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      timeout: 10000,
    });

    socket.on("connect_error", (err) => {
      console.warn("Socket connection error:", err.message);
    });

    socket.on("reconnect_failed", () => {
      console.warn("Socket reconnection failed after max attempts");
    });
  }
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.removeAllListeners("connect_error");
    socket.removeAllListeners("reconnect_failed");
    socket.disconnect();
    socket = null;
  }
}
