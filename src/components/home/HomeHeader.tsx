"use client";
import { useState, useRef, useEffect } from "react";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { Bell, User, Gear, SignOut } from "@phosphor-icons/react";
import { Avatar } from "@/components/ui/Avatar";
import { useMyProfile } from "@/hooks/useProfile";

export function HomeHeader() {
  const { data: session } = useSession();
  const user = session?.user;
  const { data: profile } = useMyProfile();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const today = new Date();
  const dateStr = today.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div style={{ padding: "16px 16px 0", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <span style={{ fontWeight: 800, fontSize: "18px", color: "#fff", letterSpacing: "-0.5px" }}>Helsinki</span>
          <span style={{ color: "#737373", fontSize: "12px" }}>▾</span>
        </div>
        <div style={{ color: "#737373", fontSize: "12px", marginTop: "2px" }}>{dateStr}</div>
      </div>
      <div style={{ display: "flex", gap: "14px", alignItems: "center" }}>
        <Link href="/notifications">
          <Bell size={20} color="#737373" />
        </Link>
        <div ref={menuRef} style={{ position: "relative" }}>
          <button onClick={() => setMenuOpen(!menuOpen)} style={{ cursor: "pointer", background: "none", border: "none", padding: 0 }}>
            <Avatar src={profile?.avatarUrl} name={profile?.username || user?.name || undefined} size={34} />
          </button>
          {menuOpen && (
            <div style={{
              position: "absolute", top: "42px", right: 0,
              background: "#1a1a1a", border: "1px solid #262626", borderRadius: "12px",
              padding: "6px", minWidth: "180px", zIndex: 60,
              boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
            }}>
              <Link href="/profile/me" onClick={() => setMenuOpen(false)} style={{
                display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px",
                borderRadius: "8px", color: "#a3a3a3", fontSize: "13px", textDecoration: "none",
              }} onMouseEnter={(e) => (e.currentTarget.style.background = "#262626")}
                 onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                <User size={16} /> Profile
              </Link>
              <Link href="/settings" onClick={() => setMenuOpen(false)} style={{
                display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px",
                borderRadius: "8px", color: "#a3a3a3", fontSize: "13px", textDecoration: "none",
              }} onMouseEnter={(e) => (e.currentTarget.style.background = "#262626")}
                 onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                <Gear size={16} /> Settings
              </Link>
              <div style={{ height: "1px", background: "#262626", margin: "4px 0" }} />
              <button onClick={() => { setMenuOpen(false); signOut({ callbackUrl: "/login" }); }} style={{
                display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px",
                borderRadius: "8px", color: "#ef4444", fontSize: "13px", width: "100%",
                background: "none", border: "none", cursor: "pointer",
              }} onMouseEnter={(e) => (e.currentTarget.style.background = "#262626")}
                 onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                <SignOut size={16} /> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
