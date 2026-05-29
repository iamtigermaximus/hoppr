"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export function useNotifications() {
  return useQuery({
    queryKey: ["notifications"],
    queryFn: () => fetch("/api/notifications").then(r => r.json()),
    refetchInterval: 30000,
  });
}

export function useMarkRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { id?: string; all?: boolean }) =>
      fetch("/api/notifications/mark-read", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then(r => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
}
