"use client";
import { useState, useEffect } from "react";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useThemeToggle } from "@/components/contexts/ThemeContext";
import { SignOut, User, Bell, Shield, Question, Sun, Moon, QrCode } from "@phosphor-icons/react";

export default function SettingsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { isDark, toggle } = useThemeToggle();
  const [claimNotifications, setClaimNotifications] = useState(true);

  useEffect(() => {
    fetch("/api/users/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.claimNotificationsEnabled != null) {
          setClaimNotifications(data.claimNotificationsEnabled);
        }
      })
      .catch(() => {});
  }, []);

  const handleToggleClaimNotifications = async () => {
    const next = !claimNotifications;
    setClaimNotifications(next);
    try {
      await fetch("/api/users/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ claimNotificationsEnabled: next }),
      });
    } catch {
      setClaimNotifications(!next);
    }
  };

  return (
    <div style={{ padding: "16px", maxWidth: "600px", margin: "0 auto" }}>
      <h1 style={{ fontWeight: 800, fontSize: "18px", color: "var(--color-text-primary)", marginBottom: "20px" }}>Settings</h1>

      <Card style={{ marginBottom: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "14px 0", cursor: "pointer" }} onClick={() => router.push("/profile/me")}>
          <User size={20} color="var(--color-text-muted)" />
          <div style={{ flex: 1 }}>
            <div style={{ color: "var(--color-text-primary)", fontWeight: 600, fontSize: "13px" }}>Account</div>
            <div style={{ color: "var(--color-text-muted)", fontSize: "11px" }}>{session?.user?.email}</div>
          </div>
        </div>
      </Card>

      <Card style={{ marginBottom: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "14px 0", cursor: "pointer" }} onClick={toggle}>
          {isDark ? <Sun size={20} color="var(--color-text-muted)" /> : <Moon size={20} color="var(--color-text-muted)" />}
          <div style={{ flex: 1 }}>
            <div style={{ color: "var(--color-text-primary)", fontWeight: 600, fontSize: "13px" }}>Appearance</div>
            <div style={{ color: "var(--color-text-muted)", fontSize: "11px" }}>{isDark ? "Dark mode" : "Light mode"}</div>
          </div>
        </div>
      </Card>

      <Card style={{ marginBottom: "12px" }}>
        <div
          style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", padding: "14px 0", cursor: "pointer" }}
          onClick={handleToggleClaimNotifications}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <Bell size={20} color="var(--color-text-muted)" />
            <div>
              <div style={{ color: "var(--color-text-primary)", fontWeight: 600, fontSize: "13px" }}>Claim status emails</div>
              <div style={{ color: "var(--color-text-muted)", fontSize: "11px" }}>Get notified when a bar claim is approved or rejected</div>
            </div>
          </div>
          <div
            style={{
              width: 44,
              height: 24,
              borderRadius: 12,
              background: claimNotifications ? "#7c3aed" : "#d1d5db",
              position: "relative",
              transition: "background 0.2s",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: 18,
                height: 18,
                borderRadius: "50%",
                background: "white",
                position: "absolute",
                top: 3,
                left: claimNotifications ? 23 : 3,
                transition: "left 0.2s",
              }}
            />
          </div>
        </div>
      </Card>

      <Card style={{ marginBottom: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "14px 0", cursor: "pointer" }} onClick={() => router.push("/notifications")}>
          <Bell size={20} color="var(--color-text-muted)" />
          <div style={{ flex: 1 }}>
            <div style={{ color: "var(--color-text-primary)", fontWeight: 600, fontSize: "13px" }}>Notifications</div>
            <div style={{ color: "var(--color-text-muted)", fontSize: "11px" }}>View recent notifications</div>
          </div>
        </div>
      </Card>

      <Card style={{ marginBottom: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "14px 0", cursor: "pointer" }} onClick={() => router.push("/privacy")}>
          <Shield size={20} color="var(--color-text-muted)" />
          <div style={{ flex: 1 }}>
            <div style={{ color: "var(--color-text-primary)", fontWeight: 600, fontSize: "13px" }}>Privacy & Safety</div>
            <div style={{ color: "var(--color-text-muted)", fontSize: "11px" }}>Privacy policy, reporting, data deletion</div>
          </div>
        </div>
      </Card>

      <Card style={{ marginBottom: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "14px 0", cursor: "pointer" }} onClick={() => router.push("/qr-generator")}>
          <QrCode size={20} color="var(--color-text-muted)" />
          <div style={{ flex: 1 }}>
            <div style={{ color: "var(--color-text-primary)", fontWeight: 600, fontSize: "13px" }}>QR Code Generator</div>
            <div style={{ color: "var(--color-text-muted)", fontSize: "11px" }}>Generate QR codes for URLs or text</div>
          </div>
        </div>
      </Card>

      <Card style={{ marginBottom: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "14px 0", cursor: "pointer" }} onClick={() => router.push("/help")}>
          <Question size={20} color="var(--color-text-muted)" />
          <div style={{ flex: 1 }}>
            <div style={{ color: "var(--color-text-primary)", fontWeight: 600, fontSize: "13px" }}>Help & Support</div>
            <div style={{ color: "var(--color-text-muted)", fontSize: "11px" }}>FAQ, contact us</div>
          </div>
        </div>
      </Card>

      <Button variant="secondary" fullWidth onClick={() => signOut({ callbackUrl: "/login" })}>
        <SignOut size={16} /> Sign Out
      </Button>

      <p style={{ color: "var(--color-text-muted)", fontSize: "10px", textAlign: "center", marginTop: "16px" }}>Hoppr v1.0.0</p>
    </div>
  );
}
