"use client";
import { useRouter } from "next/navigation";
import { useNotifications, useMarkRead, useDeleteNotification, useClearReadNotifications } from "@/hooks/useNotifications";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Bell, ChatCircle, Calendar, Ticket, X, Trash } from "@phosphor-icons/react";
import { formatEventTime } from "@/lib/utils";
import { Skeleton } from "@/components/ui/Skeleton";

const typeIcons: Record<string, any> = {
  SYSTEM: Bell, MESSAGE: ChatCircle, EVENT_STARTING: Bell, EVENT_REMINDER: Bell,
  EVENT_UPDATED: Bell, EVENT_CANCELLED: Bell, EVENT_INVITE: Calendar,
  PROMO_NEW: Bell, PROMO_EXPIRING: Bell, PASS_PURCHASED: Ticket, PASS_EXPIRING: Ticket,
  PASS_SCANNED: Ticket, BAR_VERIFIED: Bell,
};

const typeColors: Record<string, string> = {
  SYSTEM: "#6b7280", MESSAGE: "#10b981", EVENT_STARTING: "#7c3aed", EVENT_REMINDER: "#7c3aed",
  EVENT_UPDATED: "#3b82f6", EVENT_CANCELLED: "#ef4444", EVENT_INVITE: "#3b82f6",
  PROMO_NEW: "#10b981", PROMO_EXPIRING: "#f59e0b", PASS_PURCHASED: "#f59e0b", PASS_EXPIRING: "#f59e0b",
  PASS_SCANNED: "#10b981", BAR_VERIFIED: "#10b981",
};

export function NotificationList() {
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useNotifications();
  const { mutate: markRead } = useMarkRead();
  const { mutate: deleteOne } = useDeleteNotification();
  const { mutate: clearRead } = useClearReadNotifications();
  const router = useRouter();

  // Flattened notifications from infinite query
  const notifications: any[] = data?.notifications ?? [];

  const handleTap = (n: any) => {
    if (!n.read) markRead({ id: n.id });
    const d = n.data || {};

    // Primary: deepLink from push notification service
    if (d.deepLink) {
      router.push(d.deepLink);
      return;
    }
    // Chat messages: always go to the event chat, not the event page
    if (n.type === "MESSAGE" && d.eventId) {
      router.push(`/events/${d.eventId}/chat`);
      return;
    }
    // Backward-compat: explicit ID fields
    if (d.eventId) {
      router.push(`/events/${d.eventId}`);
      return;
    }
    if (d.promotionId) {
      router.push(`/promotions/${d.promotionId}`);
      return;
    }
    if (d.chatRoomId) {
      router.push(`/events/${d.chatRoomId}/chat`);
      return;
    }
    // Generic contentId + contentType fallback
    if (d.contentId && d.contentType) {
      router.push(`/${d.contentType}s/${d.contentId}`);
      return;
    }
    // Last resort: bar-level notification
    if (n.barId) {
      router.push(`/bars/${n.barId}`);
    }
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    deleteOne(id);
  };

  if (isLoading) return (
    <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <Skeleton width="36px" height="36px" radius="50%" />
          <div style={{ flex: 1 }}>
            <Skeleton width="70%" height="14px" />
            <Skeleton width="40%" height="10px" style={{ marginTop: 6 }} />
          </div>
        </div>
      ))}
    </div>
  );

  const unreadCount = notifications.filter((n: any) => !n.read).length;
  const readCount = notifications.filter((n: any) => n.read).length;

  return (
    <div style={{ padding: "16px", maxWidth: "600px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <h1 style={{ fontWeight: 800, fontSize: "18px", color: "#fff" }}>Notifications</h1>
        <div style={{ display: "flex", gap: "8px" }}>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={() => markRead({ all: true })}>
              Mark all read
            </Button>
          )}
          {readCount > 0 && (
            <Button variant="ghost" size="sm" onClick={() => clearRead()}>
              <Trash size={12} style={{ marginRight: 4 }} />
              Clear read
            </Button>
          )}
        </div>
      </div>

      {!notifications.length && (
        <div style={{ textAlign: "center", padding: "48px 16px", color: "#737373", fontSize: "14px" }}>
          <Bell size={48} color="#737373" style={{ marginBottom: "12px" }} />
          <p>No notifications yet.</p>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        {notifications.map((n: any) => {
          const Icon = typeIcons[n.type] || Bell;
          const color = typeColors[n.type] || "#737373";
          return (
            <Card
              key={n.id}
              onClick={() => handleTap(n)}
              style={{ opacity: n.read ? 0.5 : 1, borderColor: n.read ? "#262626" : `${color}44`, position: "relative" }}
            >
              <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                <div style={{ minWidth: "36px", height: "36px", background: `${color}22`, borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon size={18} color={color} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <div style={{ color: "#fff", fontWeight: 600, fontSize: "12px" }}>{n.title}</div>
                    {!n.read && <div style={{ width: "8px", height: "8px", background: "#7c3aed", borderRadius: "50%" }} />}
                  </div>
                  <div style={{ color: "#a3a3a3", fontSize: "11px", marginTop: "2px" }}>{n.body}</div>
                  <div style={{ color: "#737373", fontSize: "10px", marginTop: "4px" }}>{formatEventTime(new Date(n.createdAt))}</div>
                </div>
                <button
                  onClick={(e) => handleDelete(e, n.id)}
                  style={{
                    background: "rgba(255,255,255,0.08)", border: "none", cursor: "pointer",
                    padding: "6px", borderRadius: "8px", display: "flex",
                    alignItems: "center", justifyContent: "center",
                  }}
                  aria-label="Delete notification"
                >
                  <X size={16} color="#a3a3a3" />
                </button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Load more */}
      {hasNextPage && (
        <div style={{ textAlign: "center", marginTop: "16px" }}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? "Loading..." : "Load more"}
          </Button>
        </div>
      )}
    </div>
  );
}
