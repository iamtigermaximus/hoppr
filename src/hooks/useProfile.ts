"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export function useMyProfile() {
  return useQuery({
    queryKey: ["profile", "me"],
    queryFn: () => fetch("/api/users/me").then(r => r.json()),
  });
}

export function useUserProfile(id: string) {
  return useQuery({
    queryKey: ["profile", id],
    queryFn: () => fetch(`/api/users/${id}`).then(r => r.json()),
    enabled: !!id,
  });
}

export function useUserEvents(id: string) {
  return useQuery({
    queryKey: ["userEvents", id],
    queryFn: () => fetch(`/api/users/${id}/events`).then(r => r.json()),
    enabled: !!id,
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) =>
      fetch("/api/users/me", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then(r => r.json()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["profile"] }); },
  });
}
