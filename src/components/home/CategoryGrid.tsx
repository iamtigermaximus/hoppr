"use client";
import { useRouter } from "next/navigation";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Users, Heart, MusicNotes, Clock, Microphone, Pen, BeerBottle } from "@phosphor-icons/react";
import { CATEGORIES } from "@/lib/constants";

const iconMap: Record<string, any> = {
  Users, Heart, MusicNotes, Clock, Microphone, Pen, BeerBottle,
};

export function CategoryGrid() {
  const router = useRouter();

  return (
    <div style={{ padding: "0 0 24px" }}>
      <SectionHeader title="Browse categories" />
      <div style={{ display: "flex", gap: "8px", overflowX: "auto", padding: "0 16px" }}>
        {CATEGORIES.map((cat) => {
          const IconComponent = iconMap[cat.icon] || Users;
          return (
            <div
              key={cat.key}
              onClick={() => router.push(`/discover`)}
              style={{
                minWidth: "76px", height: "76px", background: "#1a1a1a", border: "1px solid #262626",
                borderRadius: "14px", display: "flex", flexDirection: "column", alignItems: "center",
                justifyContent: "center", gap: "6px", cursor: "pointer",
              }}
            >
              <IconComponent size={22} color="#737373" weight="regular" />
              <div style={{ color: "#737373", fontSize: "10px", fontWeight: 500 }}>{cat.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
