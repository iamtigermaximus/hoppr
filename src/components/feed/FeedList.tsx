"use client";
import { FeedCard } from "./FeedCard";
import type { FeedItem } from "@/types/feed";

export function FeedList({ items, isLoading }: { items: FeedItem[]; isLoading: boolean }) {
  if (isLoading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "8px", padding: "0 16px" }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} style={{ height: "80px", background: "#1a1a1a", borderRadius: "14px" }} />
        ))}
      </div>
    );
  }

  if (!items.length) {
    return (
      <div style={{ textAlign: "center", padding: "48px 16px", color: "#737373", fontSize: "14px" }}>
        No events, promos, or passes nearby right now
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px", padding: "0 16px" }}>
      {items.map((item) => (
        <FeedCard key={`${item.type}-${item.id}`} item={item} />
      ))}
    </div>
  );
}
