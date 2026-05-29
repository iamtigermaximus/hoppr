"use client";
import { Bell } from "@phosphor-icons/react";
import { Avatar } from "@/components/ui/Avatar";
import { useSession } from "next-auth/react";
import Link from "next/link";

export function HomeHeader() {
  const { data: session } = useSession();
  const user = session?.user;
  const today = new Date();
  const dateStr = today.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

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
        <Link href="/profile/me">
          <Avatar src={user?.image} name={user?.name || undefined} size={34} />
        </Link>
      </div>
    </div>
  );
}
