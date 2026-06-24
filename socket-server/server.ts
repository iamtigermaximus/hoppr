import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

// Load .env.local from parent directory in development (Next.js auto-loads it, but this is a standalone process)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
try {
  const envPath = resolve(__dirname, "../.env.local");
  const envFile = readFileSync(envPath, "utf-8");
  for (const line of envFile.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let value = trimmed.slice(eqIdx + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
} catch {}

import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const app = express();
const http = createServer(app);
const io = new Server(http, {
  cors: {
    origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error(
    "JWT_SECRET environment variable is not set. The socket server cannot authenticate connections without it.",
  );
}

// Auth middleware
io.use(async (socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error("Unauthorized"));
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { sub: string };
    socket.data.userId = decoded.sub;
    next();
  } catch {
    next(new Error("Invalid token"));
  }
});

// ── Ephemeral location sharing for crowd heat map ──────────

const locationStore = new Map<
  string,
  {
    userId: string;
    lat: number;
    lng: number;
    venueId: string | null;
    timestamp: number;
  }
>();

const LOCATION_TTL = 15 * 60 * 1000;

setInterval(() => {
  const now = Date.now();
  for (const [userId, entry] of locationStore) {
    if (now - entry.timestamp > LOCATION_TTL) {
      locationStore.delete(userId);
    }
  }
}, 2 * 60 * 1000);

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.data.userId}`);

  socket.on("join-event-chat", async ({ eventId }: { eventId: string }) => {
    try {
      // Verify user is a participant
      const isMember = await prisma.eventParticipant.findUnique({
        where: { userId_eventId: { userId: socket.data.userId, eventId } },
      });
      if (!isMember) {
        socket.emit("error", "Not a participant of this event");
        return;
      }

      const room = await prisma.chatRoom.findUnique({ where: { eventId } });
      if (!room) {
        socket.emit("error", "Chat room not found");
        return;
      }

      socket.join(`chat:${room.id}`);
      socket.emit("joined-room", { roomId: room.id });
    } catch (err) {
      socket.emit("error", "Failed to join chat room");
    }
  });

  socket.on("send-message", async ({ roomId, content }: { roomId: string; content: string }) => {
    if (!content?.trim()) return;
    try {
      const message = await prisma.chatMessage.create({
        data: { content, roomId, authorId: socket.data.userId },
        include: {
          author: { select: { id: true, username: true, avatarUrl: true } },
        },
      });

      io.to(`chat:${roomId}`).emit("new-message", {
        id: message.id,
        content: message.content,
        author: {
          id: message.author.id,
          username: message.author.username,
          image: message.author.avatarUrl,
        },
        createdAt: message.createdAt,
      });

      // Create notification for other room members
      const roomRecord = await prisma.chatRoom.findUnique({
        where: { id: roomId },
        include: { event: { include: { participants: true } } },
      });
      if (roomRecord?.event) {
        for (const p of roomRecord.event.participants) {
          if (p.userId !== socket.data.userId) {
            await prisma.notification.create({
              data: {
                type: "MESSAGE",
                title: "New message",
                body: `${message.author.username}: ${content.slice(0, 50)}${content.length > 50 ? "..." : ""}`,
                data: { chatRoomId: roomId, eventId: roomRecord.event.id },
                userId: p.userId,
              },
            });
          }
        }
      }
    } catch (err) {
      socket.emit("error", "Failed to send message");
    }
  });

  socket.on("leave-event-chat", ({ roomId }: { roomId: string }) => {
    socket.leave(`chat:${roomId}`);
  });

  // ── Location sharing events ──────────────────────────────

  socket.on(
    "crowd:location-update",
    ({
      lat,
      lng,
      venueId,
    }: {
      lat: number;
      lng: number;
      venueId: string | null;
    }) => {
      locationStore.set(socket.data.userId, {
        userId: socket.data.userId,
        lat: Math.round(lat * 1000) / 1000,
        lng: Math.round(lng * 1000) / 1000,
        venueId,
        timestamp: Date.now(),
      });

      io.emit("crowd:presence-update", {
        totalPresent: locationStore.size,
        timestamp: Date.now(),
      });
    },
  );

  socket.on("crowd:location-stop", () => {
    locationStore.delete(socket.data.userId);
    io.emit("crowd:presence-update", {
      totalPresent: locationStore.size,
      timestamp: Date.now(),
    });
  });

  socket.on("disconnect", () => {
    locationStore.delete(socket.data.userId);
    io.emit("crowd:presence-update", {
      totalPresent: locationStore.size,
      timestamp: Date.now(),
    });
    console.log(`User disconnected: ${socket.data.userId}`);
  });
});

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

const PORT = parseInt(process.env.PORT || "3001");
http.listen(PORT, () => {
  console.log(`Socket.io server running on port ${PORT}`);
});
