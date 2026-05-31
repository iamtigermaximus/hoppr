"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import styled from "styled-components";
import { getSocket } from "@/lib/socket-client";
import { Broadcast, User, X } from "@phosphor-icons/react";

// ── Styled ─────────────────────────────────────────────────────

const Container = styled.div`
  background: var(--color-card, #1a1a1a);
  border: 1px solid var(--color-card-border, #262626);
  border-radius: 14px;
  padding: 16px;
  margin-bottom: 16px;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
`;

const Title = styled.h3`
  font-size: 14px;
  font-weight: 700;
  color: var(--color-text-primary, #fff);
  display: flex;
  align-items: center;
  gap: 6px;
`;

const Timer = styled.span<{ $low: boolean }>`
  font-size: 10px;
  font-weight: 600;
  color: ${({ $low }) => ($low ? "#f59e0b" : "#737373")};
`;

const ToggleButton = styled.button<{ $active: boolean }>`
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid ${({ $active }) => ($active ? "#ef4444" : "#10b981")};
  background: ${({ $active }) => ($active ? "#ef444415" : "#10b98115")};
  color: ${({ $active }) => ($active ? "#ef4444" : "#10b981")};
  transition: all 0.15s;

  &:hover {
    background: ${({ $active }) => ($active ? "#ef444420" : "#10b98120")};
  }
`;

// ── Polar Radar ────────────────────────────────────────────────

const RadarArea = styled.div`
  width: 100%;
  aspect-ratio: 1;
  max-height: 320px;
  position: relative;
  background: radial-gradient(circle, #7c3aed08 0%, transparent 100%);
  border-radius: 50%;
  margin: 12px auto;
  overflow: hidden;

  @media (max-width: 480px) {
    max-height: 260px;
  }
`;

const RadarRing = styled.div<{ $size: number }>`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: ${({ $size }) => $size}%;
  height: ${({ $size }) => $size}%;
  border-radius: 50%;
  border: 1px solid #7c3aed15;
`;

const CenterDot = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #7c3aed;
  box-shadow: 0 0 12px rgba(124, 58, 237, 0.5);
  z-index: 3;
`;

const VenueLabel = styled.div`
  position: absolute;
  top: 54%;
  left: 50%;
  transform: translate(-50%, 0);
  font-size: 9px;
  color: #a78bfa;
  font-weight: 700;
  white-space: nowrap;
  z-index: 3;
`;

const ParticipantDot = styled.div<{ $x: number; $y: number; $isYou: boolean; $image?: string | null }>`
  position: absolute;
  top: ${({ $y }) => $y}%;
  left: ${({ $x }) => $x}%;
  transform: translate(-50%, -50%);
  width: ${({ $isYou }) => ($isYou ? "22px" : "18px")};
  height: ${({ $isYou }) => ($isYou ? "22px" : "18px")};
  border-radius: 50%;
  background: ${({ $isYou, $image }) =>
    $isYou ? "#10b981" : $image ? `url(${$image}) center/cover` : "#7c3aed44"};
  border: 2px solid ${({ $isYou }) => ($isYou ? "#10b981" : "#7c3aed")};
  box-shadow: 0 0 8px ${({ $isYou }) => ($isYou ? "rgba(16, 185, 129, 0.4)" : "rgba(124, 58, 237, 0.3)")};
  z-index: 2;
  transition: top 2s linear, left 2s linear;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
`;

const DotLabel = styled.span`
  position: absolute;
  top: calc(100% + 3px);
  left: 50%;
  transform: translateX(-50%);
  font-size: 8px;
  color: #a3a3a3;
  white-space: nowrap;
  font-weight: 500;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 24px 16px;
  color: #737373;
  font-size: 12px;

  p {
    margin-top: 8px;
  }
`;

const Legend = styled.div`
  display: flex;
  gap: 16px;
  font-size: 10px;
  color: #737373;
  justify-content: center;
  margin-top: 8px;
`;

const LegendItem = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;

  &::before {
    content: "";
    width: 8px;
    height: 8px;
    border-radius: 50%;
    display: inline-block;
  }
`;

// ── Types ───────────────────────────────────────────────────────

interface ParticipantPosition {
  userId: string;
  userName: string;
  userImage: string | null;
  lat: number;
  lng: number;
  timestamp: number;
}

// ── Constants ───────────────────────────────────────────────────

const MAX_RADIUS_M = 1000; // radar shows up to 1km
const MEETUP_DURATION_MS = 30 * 60 * 1000; // 30 minutes
const POSITION_INTERVAL_MS = 15000; // send position every 15s

// ── Helpers ─────────────────────────────────────────────────────

function computeBearing(
  lat1: number, lng1: number,
  lat2: number, lng2: number,
): number {
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const y = Math.sin(dLng) * Math.cos((lat2 * Math.PI) / 180);
  const x =
    Math.cos((lat1 * Math.PI) / 180) * Math.sin((lat2 * Math.PI) / 180) -
    Math.sin((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.cos(dLng);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

function haversineDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number,
): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function polarToXY(bearing: number, distanceM: number, maxRadius: number): { x: number; y: number } {
  const normalized = Math.min(distanceM / maxRadius, 1);
  const rad = ((bearing - 90) * Math.PI) / 180;
  return {
    x: 50 + normalized * 45 * Math.cos(rad), // 50% center ± 45%
    y: 50 + normalized * 45 * Math.sin(rad),
  };
}

function formatDistanceLabel(meters: number): string {
  if (meters < 25) return "Here";
  if (meters < 100) return `~${Math.round(meters / 10) * 10}m`;
  if (meters < 1000) return `~${Math.round(meters / 100) * 100}m`;
  return `${(meters / 1000).toFixed(1)}km`;
}

// ── Component ───────────────────────────────────────────────────

interface MeetupRadarProps {
  eventId: string;
  venueLat: number;
  venueLng: number;
  venueName: string;
  isJoined: boolean;
}

export function MeetupRadar({
  eventId,
  venueLat,
  venueLng,
  venueName,
  isJoined,
}: MeetupRadarProps) {
  const { data: session } = useSession();
  const [active, setActive] = useState(false);
  const [remaining, setRemaining] = useState(MEETUP_DURATION_MS);
  const [positions, setPositions] = useState<Map<string, ParticipantPosition>>(new Map());
  const [myPos, setMyPos] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const positionsRef = useRef(positions);
  positionsRef.current = positions;

  const watchIdRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const posIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const socketRef = useRef<ReturnType<typeof getSocket> | null>(null);

  const userId = (session?.user as any)?.id as string | undefined;
  const userName = (session?.user as any)?.username || (session?.user as any)?.name || "You";

  // ── Start sharing ────────────────────────────────────────────

  const startSharing = useCallback(() => {
    if (!userId) return;
    setError(null);

    const token = (session as any)?.token;
    if (!token) {
      // For NextAuth JWT, the token is session-internal
      // We need to use the session user id as auth
    }

    const socket = getSocket(token || "session");
    socketRef.current = socket;

    socket.emit("meetup:start", { eventId });

    socket.on("meetup:started", (data: { eventId: string; others: any[]; activeCount: number }) => {
      const map = new Map<string, ParticipantPosition>();
      for (const o of data.others) {
        map.set(o.userId, {
          userId: o.userId,
          userName: o.userName,
          userImage: o.userImage,
          lat: o.lat,
          lng: o.lng,
          timestamp: o.timestamp,
        });
      }
      setPositions(map);
    });

    socket.on("meetup:joined", (data: { userId: string; userName: string; userImage: string | null }) => {
      setPositions((prev) => {
        const next = new Map(prev);
        if (!next.has(data.userId)) {
          next.set(data.userId, {
            userId: data.userId,
            userName: data.userName,
            userImage: data.userImage,
            lat: 0, lng: 0, timestamp: 0, // will be updated when position arrives
          });
        }
        return next;
      });
    });

    socket.on("meetup:position", (data: { userId: string; lat: number; lng: number; timestamp: number }) => {
      setPositions((prev) => {
        const next = new Map(prev);
        const existing = next.get(data.userId);
        if (existing) {
          next.set(data.userId, { ...existing, lat: data.lat, lng: data.lng, timestamp: data.timestamp });
        }
        return next;
      });
    });

    socket.on("meetup:left", (data: { userId: string }) => {
      setPositions((prev) => {
        const next = new Map(prev);
        next.delete(data.userId);
        return next;
      });
    });

    // Start geolocation
    if (navigator.geolocation) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setMyPos({ lat: latitude, lng: longitude });

          // Send position to server
          socket.emit("meetup:position", {
            eventId,
            lat: latitude,
            lng: longitude,
          });
        },
        (err) => {
          setError("Location access denied. Enable location to use the radar.");
        },
        { enableHighAccuracy: true, maximumAge: 15000, timeout: 10000 },
      );
    } else {
      setError("Geolocation not supported by your browser.");
    }

    // Periodic position send
    posIntervalRef.current = setInterval(() => {
      if (myPos) {
        socket.emit("meetup:position", {
          eventId,
          lat: myPos.lat,
          lng: myPos.lng,
        });
      }
    }, POSITION_INTERVAL_MS);

    // Countdown timer
    setRemaining(MEETUP_DURATION_MS);
    timerRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1000) {
          stopSharing();
          return 0;
        }
        return prev - 1000;
      });
    }, 1000);

    setActive(true);
  }, [userId, eventId, session, myPos]);

  // ── Stop sharing ─────────────────────────────────────────────

  const stopSharing = useCallback(() => {
    setActive(false);
    setPositions(new Map());
    setMyPos(null);

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (posIntervalRef.current) {
      clearInterval(posIntervalRef.current);
      posIntervalRef.current = null;
    }

    const socket = socketRef.current;
    if (socket) {
      socket.emit("meetup:stop", { eventId });
      socket.off("meetup:started");
      socket.off("meetup:joined");
      socket.off("meetup:position");
      socket.off("meetup:left");
    }
  }, [eventId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (active) stopSharing();
    };
  }, [active, stopSharing]);

  // ── Build participants for radar ─────────────────────────────

  const participants = Array.from(positions.values()).filter((p) => p.lat !== 0);

  const formatTime = (ms: number) => {
    const m = Math.floor(ms / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  // ── Render ────────────────────────────────────────────────────

  if (!isJoined) return null;

  return (
    <Container>
      <Header>
        <Title>
          <Broadcast size={16} color={active ? "#10b981" : "#737373"} />
          Meetup Radar
          {active && (
            <Timer $low={remaining < 300000}>
              ⏱ {formatTime(remaining)}
            </Timer>
          )}
        </Title>
        <ToggleButton
          $active={active}
          onClick={active ? stopSharing : startSharing}
        >
          {active ? "Stop Sharing" : "Share Location"}
        </ToggleButton>
      </Header>

      {error && (
        <div style={{ color: "#f59e0b", fontSize: "11px", marginBottom: "8px" }}>
          ⚠ {error}
        </div>
      )}

      {active && (
        <>
          <RadarArea>
            <RadarRing $size={80} />
            <RadarRing $size={55} />
            <RadarRing $size={30} />
            <CenterDot />
            <VenueLabel>🏠 {venueName}</VenueLabel>

            {/* Other participants */}
            {participants.map((p) => {
              const dist = myPos
                ? haversineDistance(myPos.lat, myPos.lng, p.lat, p.lng)
                : 0;
              const bearing = myPos
                ? computeBearing(myPos.lat, myPos.lng, p.lat, p.lng)
                : 0;
              const { x, y } = polarToXY(bearing, dist, MAX_RADIUS_M);
              const isYou = p.userId === userId;

              return (
                <ParticipantDot
                  key={p.userId}
                  $x={x}
                  $y={y}
                  $isYou={isYou}
                  $image={p.userImage}
                >
                  {!p.userImage && (
                    <User size={10} color={isYou ? "#fff" : "#7c3aed"} weight="fill" />
                  )}
                  <DotLabel>
                    {isYou ? "You" : p.userName}{" "}
                    {!isYou && <span style={{ opacity: 0.6 }}>{formatDistanceLabel(dist)}</span>}
                  </DotLabel>
                </ParticipantDot>
              );
            })}
          </RadarArea>

          <Legend>
            <LegendItem style={{ color: "#10b981" }}>You</LegendItem>
            <LegendItem style={{ color: "#7c3aed" }}>Participants ({participants.length})</LegendItem>
            <LegendItem style={{ color: "#a78bfa" }}>{venueName}</LegendItem>
          </Legend>

          <div style={{ textAlign: "center", fontSize: "10px", color: "#737373", marginTop: "4px" }}>
            Positions approximate · Sharing stops after 30 min · No location stored
          </div>
        </>
      )}

      {!active && (
        <EmptyState>
          <Broadcast size={32} color="#737373" />
          <p>Share your approximate location so crawl participants can find each other.</p>
          <p style={{ fontSize: "10px", marginTop: "4px", opacity: 0.6 }}>
            Only visible to event participants · Active for 30 minutes · Never saved
          </p>
        </EmptyState>
      )}
    </Container>
  );
}
