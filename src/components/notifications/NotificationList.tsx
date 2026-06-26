"use client";
import { useRouter } from "next/navigation";
import { useNotifications, useMarkRead } from "@/hooks/useNotifications";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Bell, ChatCircle, Calendar, Ticket } from "@phosphor-icons/react";
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
  const { data: notifications = [], isLoading } = useNotifications();
  const { mutate: markRead } = useMarkRead();
  const router = useRouter();

  const handleTap = (n: any) => {
    if (!n.read) markRead({ id: n.id });
    const data = n.data || {};
    if (data.eventId) router.push(`/events/${data.eventId}`);
    else if (data.chatRoomId) router.push(`/events/${data.eventId}/chat`);
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

  return (
    <div style={{ padding: "16px", maxWidth: "600px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <h1 style={{ fontWeight: 800, fontSize: "18px", color: "#fff" }}>Notifications</h1>
        {unreadCount > 0 && (
          <Button variant="ghost" size="sm" onClick={() => markRead({ all: true })}>
            Mark all read
          </Button>
        )}
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
              style={{ opacity: n.read ? 0.5 : 1, borderColor: n.read ? "#262626" : `${color}44` }}
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
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
