"use client";
import { useRouter } from "next/navigation";
import { useNotifications, useMarkRead } from "@/hooks/useNotifications";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Bell, ChatCircle, Calendar, Ticket } from "@phosphor-icons/react";
import { formatEventTime } from "@/lib/utils";

const typeIcons: Record<string, any> = {
  JOIN: Calendar, MESSAGE: ChatCircle, EVENT_STARTING: Bell,
  PROMO_ENDING: Bell, PASS_EXPIRING: Ticket,
};

const typeColors: Record<string, string> = {
  JOIN: "#3b82f6", MESSAGE: "#10b981", EVENT_STARTING: "#7c3aed",
  PROMO_ENDING: "#10b981", PASS_EXPIRING: "#f59e0b",
};

export function NotificationList() {
  const { data: notifications = [], isLoading } = useNotifications();
  const { mutate: markRead } = useMarkRead();
  const router = useRouter();

  const handleTap = (n: any) => {
    if (!n.isRead) markRead({ id: n.id });
    const data = n.data || {};
    if (data.eventId) router.push(`/events/${data.eventId}`);
    else if (data.chatRoomId) router.push(`/events/${data.eventId}/chat`);
  };

  if (isLoading) return <div style={{ padding: 16, color: "#737373" }}>Loading...</div>;

  const unreadCount = notifications.filter((n: any) => !n.isRead).length;

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
              style={{ opacity: n.isRead ? 0.5 : 1, borderColor: n.isRead ? "#262626" : `${color}44` }}
            >
              <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                <div style={{ minWidth: "36px", height: "36px", background: `${color}22`, borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon size={18} color={color} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <div style={{ color: "#fff", fontWeight: 600, fontSize: "12px" }}>{n.title}</div>
                    {!n.isRead && <div style={{ width: "8px", height: "8px", background: "#7c3aed", borderRadius: "50%" }} />}
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
