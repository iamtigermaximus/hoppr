"use client";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useThemeToggle } from "@/components/contexts/ThemeContext";
import { SignOut, User, Bell, Shield, Question, Sun, Moon } from "@phosphor-icons/react";

export default function SettingsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { isDark, toggle } = useThemeToggle();

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
        <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "14px 0" }}>
          <Bell size={20} color="var(--color-text-muted)" />
          <div style={{ flex: 1 }}>
            <div style={{ color: "var(--color-text-primary)", fontWeight: 600, fontSize: "13px" }}>Notifications</div>
            <div style={{ color: "var(--color-text-muted)", fontSize: "11px" }}>Manage notification preferences</div>
          </div>
        </div>
      </Card>

      <Card style={{ marginBottom: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "14px 0" }}>
          <Shield size={20} color="var(--color-text-muted)" />
          <div style={{ flex: 1 }}>
            <div style={{ color: "var(--color-text-primary)", fontWeight: 600, fontSize: "13px" }}>Privacy & Safety</div>
            <div style={{ color: "var(--color-text-muted)", fontSize: "11px" }}>Blocked users, report history</div>
          </div>
        </div>
      </Card>

      <Card style={{ marginBottom: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "14px 0" }}>
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

      <p style={{ color: "var(--color-text-muted)", fontSize: "10px", textAlign: "center", marginTop: "16px" }}>Hoppr v1.0.0 · Helsinki, Finland</p>
    </div>
  );
}
