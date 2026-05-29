"use client";
import { useQuery } from "@tanstack/react-query";

export function useVenues(params?: Record<string, string>) {
  const query = params ? new URLSearchParams(params).toString() : "";
  return useQuery({
    queryKey: ["venues", query],
    queryFn: () => fetch(`/api/venues?${query}`).then(r => r.json()),
  });
}

export function useVenue(id: string) {
  return useQuery({
    queryKey: ["venue", id],
    queryFn: () => fetch(`/api/venues/${id}`).then(r => r.json()),
    enabled: !!id,
  });
}
