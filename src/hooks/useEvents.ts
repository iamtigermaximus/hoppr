"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

async function fetchOrThrow(url: string, options?: RequestInit) {
  const res = await fetch(url, options);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

export function useEvents(params?: Record<string, string>) {
  const query = params ? new URLSearchParams(params).toString() : "";
  return useQuery({
    queryKey: ["events", query],
    queryFn: () => fetchOrThrow(`/api/events?${query}`),
  });
}

export function useEvent(id: string) {
  return useQuery({
    queryKey: ["event", id],
    queryFn: () => fetchOrThrow(`/api/events/${id}`),
    enabled: !!id,
  });
}

export function useCreateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) =>
      fetchOrThrow("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["events"] });
      qc.invalidateQueries({ queryKey: ["feed"] });
    },
  });
}

export function useJoinEvent(eventId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => fetchOrThrow(`/api/events/${eventId}/join`, { method: "POST" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["event", eventId] });
      qc.invalidateQueries({ queryKey: ["events"] });
      qc.invalidateQueries({ queryKey: ["feed"] });
    },
  });
}

export function useLeaveEvent(eventId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => fetchOrThrow(`/api/events/${eventId}/join`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["event", eventId] });
      qc.invalidateQueries({ queryKey: ["events"] });
      qc.invalidateQueries({ queryKey: ["feed"] });
    },
  });
}

export function useDeleteEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => fetchOrThrow(`/api/events/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["events"] });
      qc.invalidateQueries({ queryKey: ["feed"] });
    },
  });
}
