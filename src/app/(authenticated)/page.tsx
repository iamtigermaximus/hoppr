"use client";
import { HomeHeader } from "@/components/home/HomeHeader";
import { PromoSlider } from "@/components/home/PromoSlider";
import { TrendingBars } from "@/components/home/TrendingBars";
import { EventList } from "@/components/home/EventList";
import { BarSlider } from "@/components/home/BarSlider";
import { CategoryGrid } from "@/components/home/CategoryGrid";

export default function HomePage() {
  return (
    <>
      <HomeHeader />
      <PromoSlider />
      <TrendingBars />
      <EventList />
      <BarSlider />
      <CategoryGrid />
    </>
  );
}
