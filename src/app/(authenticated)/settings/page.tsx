"use client";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { SignOut, User, Bell, Shield, Question } from "@phosphor-icons/react";

const menuItemStyle: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: "12px",
  padding: "14px 0", cursor: "pointer",
};

export default function SettingsPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const handleSignOut = () => signOut({ callbackUrl: "/login" });

  return (
    <div style={{ padding: "16px", maxWidth: "600px", margin: "0 auto" }}>
      <h1 style={{ fontWeight: 800, fontSize: "18px", color: "#fff", marginBottom: "20px" }}>Settings</h1>

      <Card style={{ marginBottom: "12px" }}>
        <div style={menuItemStyle} onClick={() => router.push("/profile/me")}>
          <User size={20} color="#737373" />
          <div style={{ flex: 1 }}>
            <div style={{ color: "#fff", fontWeight: 600, fontSize: "13px" }}>Account</div>
            <div style={{ color: "#737373", fontSize: "11px" }}>{session?.user?.email}</div>
          </div>
        </div>
      </Card>

      <Card style={{ marginBottom: "12px" }}>
        <div style={menuItemStyle}>
          <Bell size={20} color="#737373" />
          <div style={{ flex: 1 }}>
            <div style={{ color: "#fff", fontWeight: 600, fontSize: "13px" }}>Notifications</div>
            <div style={{ color: "#737373", fontSize: "11px" }}>Manage notification preferences</div>
          </div>
        </div>
      </Card>

      <Card style={{ marginBottom: "12px" }}>
        <div style={menuItemStyle}>
          <Shield size={20} color="#737373" />
          <div style={{ flex: 1 }}>
            <div style={{ color: "#fff", fontWeight: 600, fontSize: "13px" }}>Privacy & Safety</div>
            <div style={{ color: "#737373", fontSize: "11px" }}>Blocked users, report history</div>
          </div>
        </div>
      </Card>

      <Card style={{ marginBottom: "24px" }}>
        <div style={menuItemStyle}>
          <Question size={20} color="#737373" />
          <div style={{ flex: 1 }}>
            <div style={{ color: "#fff", fontWeight: 600, fontSize: "13px" }}>Help & Support</div>
            <div style={{ color: "#737373", fontSize: "11px" }}>FAQ, contact us</div>
          </div>
        </div>
      </Card>

      <Button variant="secondary" fullWidth onClick={handleSignOut}>
        <SignOut size={16} /> Sign Out
      </Button>

      <p style={{ color: "#737373", fontSize: "10px", textAlign: "center", marginTop: "16px" }}>Hoppr v1.0.0 · Helsinki, Finland</p>
    </div>
  );
}
