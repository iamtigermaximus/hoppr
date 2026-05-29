"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export function useEvents(params?: Record<string, string>) {
  const query = params ? new URLSearchParams(params).toString() : "";
  return useQuery({
    queryKey: ["events", query],
    queryFn: () => fetch(`/api/events?${query}`).then((r) => r.json()),
  });
}

export function useEvent(id: string) {
  return useQuery({
    queryKey: ["event", id],
    queryFn: () => fetch(`/api/events/${id}`).then((r) => r.json()),
    enabled: !!id,
  });
}

export function useCreateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) =>
      fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["events"] });
      qc.invalidateQueries({ queryKey: ["feed"] });
    },
  });
}

export function useJoinEvent(eventId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      fetch(`/api/events/${eventId}/join`, { method: "POST" }).then((r) => r.json()),
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
    mutationFn: () =>
      fetch(`/api/events/${eventId}/join`, { method: "DELETE" }).then((r) => r.json()),
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
    mutationFn: (id: string) =>
      fetch(`/api/events/${id}`, { method: "DELETE" }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["events"] });
      qc.invalidateQueries({ queryKey: ["feed"] });
    },
  });
}
