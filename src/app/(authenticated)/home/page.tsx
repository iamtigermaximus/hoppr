"use client";
import { TrendingCarousel } from "@/components/home/TrendingCarousel";
import { PromoSlider } from "@/components/home/PromoSlider";
import { EventList } from "@/components/home/EventList";
import { BarSlider } from "@/components/home/BarSlider";
import { CategoryGrid } from "@/components/home/CategoryGrid";

export default function HomePage() {
  const today = new Date();
  const dateStr = today.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  return (
    <>
      <div style={{ padding: "4px 16px 12px" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
          <span style={{ fontWeight: 800, fontSize: "18px", color: "#fff", letterSpacing: "-0.5px" }}>Helsinki</span>
          <span style={{ color: "#737373", fontSize: "12px" }}>{dateStr}</span>
        </div>
      </div>
      <TrendingCarousel />
      <PromoSlider />
      <EventList />
      <BarSlider />
      <CategoryGrid />
    </>
  );
}
