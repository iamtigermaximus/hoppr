"use client";
import { useState, useEffect } from "react";

interface LocationState {
  lat: number | null;
  lng: number | null;
  error: string | null;
  loading: boolean;
}

// Default to Helsinki city center
const DEFAULT_LOCATION = { lat: 60.1699, lng: 24.9384 };

export function useGeolocation() {
  const [state, setState] = useState<LocationState>({
    lat: null, lng: null, error: null, loading: true,
  });

  useEffect(() => {
    if (!navigator.geolocation) {
      setState({ ...DEFAULT_LOCATION, error: "Geolocation not supported", loading: false });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setState({ lat: pos.coords.latitude, lng: pos.coords.longitude, error: null, loading: false }),
      () => setState({ ...DEFAULT_LOCATION, error: "Permission denied", loading: false }),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    );
  }, []);

  return state;
}
