"use client";
import { useFeed } from "@/hooks/useFeed";
import { useGeolocation } from "@/hooks/useGeolocation";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { HomeCard, CardGrid, type HomeCardItem } from "./HomeCard";

export function EventList() {
  const { lat, lng } = useGeolocation();
  const { data: items = [] } = useFeed({ lat, lng, time: "week" });
  const events = items.filter((i: any) => i.type === "event").slice(0, 6);

  if (!events.length) return null;

  const cards: HomeCardItem[] = events.map((e: any) => ({
    id: e.id,
    type: "event" as const,
    title: e.title,
    venueName: e.venueName,
    image: e.image,
    distance: e.distance,
    startTime: e.startTime,
  }));

  return (
    <div style={{ marginBottom: "18px", padding: "0 16px" }}>
      <SectionHeader title="Events near you" onSeeAll={() => window.location.href = "/discover"} />
      <CardGrid>
        {cards.map((item) => (
          <HomeCard key={item.id} item={item} />
        ))}
      </CardGrid>
    </div>
  );
}
