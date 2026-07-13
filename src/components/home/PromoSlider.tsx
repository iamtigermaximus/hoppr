"use client";
import { useFeed } from "@/hooks/useFeed";
import { useGeolocation } from "@/hooks/useGeolocation";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { HomeCard, CardGrid, type HomeCardItem } from "./HomeCard";

export function PromoSlider() {
  const { lat, lng } = useGeolocation();
  const { data: items = [] } = useFeed({ lat, lng, time: "week" });
  const promos = items.filter((i: any) => i.type === "promotion").slice(0, 6);

  if (!promos.length) return null;

  const cards: HomeCardItem[] = promos.map((p: any) => ({
    id: p.id,
    type: "promotion" as const,
    title: p.title,
    venueName: p.venueName,
    image: p.image,
    distance: p.distance,
    validFrom: p.validFrom,
    accentColor: p.accentColor,
  }));

  return (
    <div style={{ marginBottom: "18px", padding: "0 16px" }}>
      <SectionHeader title="Promotions near you" onSeeAll={() => window.location.href = "/discover"} />
      <CardGrid>
        {cards.map((item) => (
          <HomeCard key={item.id} item={item} />
        ))}
      </CardGrid>
    </div>
  );
}
