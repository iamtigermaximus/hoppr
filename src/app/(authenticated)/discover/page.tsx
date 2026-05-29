"use client";
import { useState } from "react";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useFeed } from "@/hooks/useFeed";
import { TimeFilters } from "@/components/feed/TimeFilters";
import { FeedList } from "@/components/feed/FeedList";
import type { TimeFilter } from "@/types/feed";

export default function DiscoverPage() {
  const { lat, lng } = useGeolocation();
  const [time, setTime] = useState<TimeFilter>("today");
  const { data: items = [], isLoading } = useFeed({ lat, lng, time });

  return (
    <>
      <div style={{ padding: "16px 16px 0", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
        <div>
          <span style={{ fontWeight: 800, fontSize: "18px", color: "#fff", letterSpacing: "-0.5px", display: "block" }}>Discover</span>
          <span style={{ fontSize: "11px", color: "#a3a3a3" }}>📍 Nearby</span>
        </div>
      </div>
      <TimeFilters active={time} onChange={setTime} />
      <FeedList items={items} isLoading={isLoading} />
    </>
  );
}
