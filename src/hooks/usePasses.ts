"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export function usePasses() {
  return useQuery({
    queryKey: ["passes"],
    queryFn: () => fetch("/api/passes").then(r => r.json()),
  });
}

export function useMyPasses() {
  return useQuery({
    queryKey: ["myPasses"],
    queryFn: () => fetch("/api/passes/my").then(r => r.json()),
  });
}

export function usePurchasePass() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (passId: string) =>
      fetch(`/api/passes/${passId}/purchase`, { method: "POST" }).then(r => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["myPasses"] });
      qc.invalidateQueries({ queryKey: ["passes"] });
    },
  });
}

export function usePassQR(purchaseId: string) {
  return useQuery({
    queryKey: ["passQR", purchaseId],
    queryFn: () => fetch(`/api/passes/my/${purchaseId}/qr`).then(r => r.json()),
    enabled: !!purchaseId,
    refetchInterval: 60000, // Refresh every 60 seconds
  });
}
