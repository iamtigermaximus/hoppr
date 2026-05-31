"use client";
import { useState, useEffect, useRef, useCallback } from "react";

interface LocationSharingState {
  isSharing: boolean;
  currentLat: number | null;
  currentLng: number | null;
  error: string | null;
  startSharing: (venueId?: string) => void;
  stopSharing: () => void;
}

const POSITION_INTERVAL_MS = 30_000;
const SHARING_DURATION_MS = 30 * 60 * 1000;

export function useLocationSharing(): LocationSharingState {
  const [isSharing, setIsSharing] = useState(false);
  const [currentLat, setCurrentLat] = useState<number | null>(null);
  const [currentLng, setCurrentLng] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const watchIdRef = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const venueIdRef = useRef<string | undefined>(undefined);
  const latRef = useRef<number | null>(null);
  const lngRef = useRef<number | null>(null);

  const sendPosition = useCallback(async (lat: number, lng: number) => {
    try {
      await fetch("/api/crowd/presence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lat,
          lng,
          venueId: venueIdRef.current ?? null,
        }),
      });
    } catch {
      // Best-effort presence
    }
  }, []);

  const stopSharing = useCallback(() => {
    setIsSharing(false);
    setCurrentLat(null);
    setCurrentLng(null);

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    fetch("/api/crowd/presence", { method: "DELETE" }).catch(() => {});
  }, []);

  const startSharing = useCallback(
    (venueId?: string) => {
      setError(null);
      venueIdRef.current = venueId;

      if (!navigator.geolocation) {
        setError("Geolocation not supported");
        return;
      }

      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setCurrentLat(latitude);
          setCurrentLng(longitude);
          latRef.current = latitude;
          lngRef.current = longitude;
          sendPosition(latitude, longitude);
        },
        (err) => {
          setError(
            "Location access denied. Enable location to contribute.",
          );
        },
        {
          enableHighAccuracy: false,
          maximumAge: 30_000,
          timeout: 10_000,
        },
      );

      intervalRef.current = setInterval(() => {
        if (latRef.current && lngRef.current) {
          sendPosition(latRef.current, lngRef.current);
        }
      }, POSITION_INTERVAL_MS);

      timerRef.current = setTimeout(() => {
        stopSharing();
      }, SHARING_DURATION_MS);

      setIsSharing(true);
    },
    [sendPosition, stopSharing],
  );

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return {
    isSharing,
    currentLat,
    currentLng,
    error,
    startSharing,
    stopSharing,
  };
}
