"use client";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";

type NotificationsPage = {
  notifications: any[];
  nextCursor: string | null;
};

type TransformedData = {
  notifications: any[];
  pages: NotificationsPage[];
};

export function useNotifications() {
  return useInfiniteQuery<NotificationsPage, Error, TransformedData>({
    queryKey: ["notifications"],
    queryFn: async ({ pageParam }) => {
      const url = new URL("/api/notifications", window.location.origin);
      if (pageParam) url.searchParams.set("cursor", pageParam as string);
      const res = await fetch(url.toString());
      return res.json();
    },
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    refetchInterval: 30000,
    select: (data) => ({
      pages: data.pages,
      notifications: data.pages.flatMap((p) => p.notifications),
    }),
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

export function useDeleteNotification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/notifications?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
}

export function useClearReadNotifications() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      fetch("/api/notifications?clearRead=true", { method: "DELETE" }).then((r) =>
        r.json()
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
}
