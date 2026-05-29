"use client";
import { createContext, useContext } from "react";
import { useGeolocation } from "@/hooks/useGeolocation";

interface LocationContextType {
  lat: number | null;
  lng: number | null;
  error: string | null;
  loading: boolean;
}

const LocationContext = createContext<LocationContextType>({
  lat: null, lng: null, error: null, loading: true,
});

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const location = useGeolocation();
  return <LocationContext.Provider value={location}>{children}</LocationContext.Provider>;
}

export function useLocation() {
  return useContext(LocationContext);
}
