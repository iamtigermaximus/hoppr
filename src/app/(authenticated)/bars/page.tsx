"use client";
import { useState, useMemo } from "react";
import styled from "styled-components";
import { useRouter } from "next/navigation";
import { useVenues } from "@/hooks/useVenues";
import { useGeolocation } from "@/hooks/useGeolocation";
import { Chip } from "@/components/ui/Chip";
import { Button } from "@/components/ui/Button";
import { formatDistance } from "@/lib/utils";
import CrowdIndicator from "@/components/venues/CrowdIndicator";
import { House, MapPin, Star, MagnifyingGlass, X, NavigationArrow, Clock, ListBullets, ChartBar } from "@phosphor-icons/react";

const VENUE_TYPES = [
  { key: "PUB", label: "Pubs" },
  { key: "CLUB", label: "Clubs" },
  { key: "COCKTAIL_LOUNGE", label: "Cocktails" },
  { key: "SPORTS_BAR", label: "Sports" },
  { key: "KARAOKE_BAR", label: "Karaoke" },
  { key: "WINE_BAR", label: "Wine" },
  { key: "BREWERY_TAPROOM", label: "Brewery" },
  { key: "LIVE_MUSIC", label: "Live Music" },
];

const ratings: Record<string, number> = {
  v1: 4.8, v2: 4.6, v3: 4.9, v4: 4.2, v5: 4.3, v6: 4.5, v7: 4.7, v8: 4.4,
  v9: 4.1, v10: 4.6, v11: 4.3, v12: 4.8, v13: 4.4, v14: 4.7, v15: 4.5,
};

const SearchBar = styled.div`
  display: flex; align-items: center; gap: 8px;
  background: var(--color-card, #1a1a1a); border: 1px solid var(--color-card-border, #262626);
  border-radius: 12px; padding: 10px 14px;
  margin-bottom: 14px;
`;

const SearchInput = styled.input`
  flex: 1; background: none; border: none; color: var(--color-text-primary, #fff);
  font-size: 14px; outline: none;
  &::placeholder { color: var(--color-text-muted, #737373); }
`;

const Filters = styled.div`display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 14px;`;

const BarCard = styled.div`
  background: var(--color-card, #1a1a1a); border: 1px solid var(--color-card-border, #262626);
  border-radius: 16px; overflow: hidden; cursor: pointer;
  transition: border-color 0.15s;
  &:hover { border-color: #7c3aed44; }
`;

const BarImage = styled.div`
  height: 160px; width: 100%; position: relative; overflow: hidden; background: var(--color-card-border, #262626);
  img { width: 100%; height: 100%; object-fit: cover; }
`;

const BarBody = styled.div`
  padding: 14px 16px;
`;

const List = styled.div`
  display: flex; flex-direction: column; gap: 10px;
  @media (min-width: 768px) {
    display: grid; grid-template-columns: 1fr 1fr;
  }
  @media (min-width: 1200px) {
    grid-template-columns: 1fr 1fr 1fr;
  }
`;

const HeatSection = styled.div`
  margin-bottom: 24px;
`;

const HeatSectionHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  padding: 0 4px;
`;

const HeatSectionTitle = styled.h2`
  font-size: 14px;
  font-weight: 700;
  color: var(--color-text-primary, #fff);
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const HeatSectionCount = styled.span`
  font-size: 11px;
  color: #737373;
  font-weight: 500;
`;

const HeatCardGrid = styled.div`
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 4px;
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;

  &::-webkit-scrollbar { display: none; }

  @media (min-width: 768px) {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    overflow-x: visible;
  }
`;

const HeatCard = styled.div<{ $color: string; $bg: string }>`
  min-width: 140px;
  max-width: 180px;
  background: ${({ $bg }) => $bg};
  border: 1px solid ${({ $color }) => `${$color}44`};
  border-radius: 14px;
  padding: 14px;
  cursor: pointer;
  scroll-snap-align: start;
  transition: border-color 0.15s;

  &:hover { border-color: ${({ $color }) => $color}; }

  @media (min-width: 768px) {
    max-width: none;
  }
`;

const HeatCardName = styled.div`
  color: var(--color-text-primary, #fff);
  font-weight: 700;
  font-size: 13px;
  margin-bottom: 6px;
`;

const HeatCardLevel = styled.div<{ $color: string }>`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 10px;
  font-weight: 600;
  color: ${({ $color }) => $color};
  margin-bottom: 4px;
`;

const HeatCardDot = styled.span<{ $color: string; $pulse?: boolean }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ $color }) => $color};
  ${({ $pulse }) => ($pulse ? "animation: heatPulse 1.5s ease-in-out infinite;" : "")}

  @keyframes heatPulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.5); }
    50% { box-shadow: 0 0 0 6px rgba(220, 38, 38, 0); }
  }
`;

const HeatCardType = styled.div`
  color: #737373;
  font-size: 10px;
  margin-bottom: 2px;
`;

const HeatCardTime = styled.div`
  color: #525252;
  font-size: 9px;
  margin-top: 6px;
`;

const HeatCardDistance = styled.div`
  color: #a3a3a3;
  font-size: 10px;
  display: flex;
  align-items: center;
  gap: 3px;
  margin-top: 4px;
`;

const heatLevelConfig: Record<string, { color: string; bg: string; label: string; pulse?: boolean }> = {
  QUIET: { color: "#10b981", bg: "rgba(16,185,129,0.10)", label: "Quiet" },
  GETTING_BUSY: { color: "#f59e0b", bg: "rgba(245,158,11,0.10)", label: "Getting Busy" },
  BUSY: { color: "#f97316", bg: "rgba(249,115,22,0.10)", label: "Busy" },
  PACKED: { color: "#ef4444", bg: "rgba(239,68,68,0.10)", label: "Packed" },
  AT_CAPACITY: { color: "#dc2626", bg: "rgba(220,38,38,0.15)", label: "At Capacity", pulse: true },
};

const levelOrder = ["AT_CAPACITY", "PACKED", "BUSY", "GETTING_BUSY", "QUIET"];

function heatTimeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  return `${hours}h ago`;
}

function isVenueOpen(hours?: Record<string, string>): boolean {
  if (!hours) return false;
  const now = new Date();
  const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const today = days[now.getDay()];
  const timeStr = hours[today];
  if (!timeStr || timeStr === "Closed") return false;

  const parts = timeStr.split("–").map(s => s.trim());
  if (parts.length !== 2) return false;

  const parseTime = (s: string): number => {
    const match = s.match(/(\d+)(?::(\d+))?\s*(AM|PM)?/i);
    if (!match) return -1;
    let hour = parseInt(match[1]);
    const min = match[2] ? parseInt(match[2]) : 0;
    const ampm = match[3]?.toUpperCase();
    if (ampm === "PM" && hour !== 12) hour += 12;
    if (ampm === "AM" && hour === 12) hour = 0;
    return hour * 60 + min;
  };

  const openMin = parseTime(parts[0]);
  let closeMin = parseTime(parts[1]);
  if (closeMin < openMin) closeMin += 24 * 60;
  const nowMin = now.getHours() * 60 + now.getMinutes();

  return nowMin >= openMin && nowMin < closeMin;
}

const PAGE_SIZE = 12;

export default function BarsPage() {
  const router = useRouter();
  const { lat, lng } = useGeolocation();
  const { data: venues = [] } = useVenues();
  const [search, setSearch] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [view, setView] = useState<"list" | "heatmap">("list");

  const toggleType = (key: string) => {
    setSelectedTypes(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
    setPage(1);
  };

  const clearFilters = () => {
    setSelectedTypes([]);
    setSearch("");
    setPage(1);
  };

  const filtered = useMemo(() => {
    const result = (venues as any[])
      .map((v: any) => ({
        ...v,
        distance: lat && lng ? Math.sqrt((v.lat - lat) ** 2 + (v.lng - lng) ** 2) * 111.32 : 99,
      }))
      .filter((v: any) => {
        if (selectedTypes.length > 0 && !selectedTypes.includes(v.type)) return false;
        if (search && !v.name.toLowerCase().includes(search.toLowerCase())
          && !v.district?.toLowerCase().includes(search.toLowerCase())
          && !v.type?.toLowerCase().replace(/_/g, " ").includes(search.toLowerCase())) return false;
        return true;
      })
      .sort((a: any, b: any) => a.distance - b.distance);

    return result;
  }, [venues, lat, lng, selectedTypes, search]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const displayed = filtered.slice(0, page * PAGE_SIZE);
  const hasMore = page < totalPages;

  const heatBars = useMemo(() => {
    return filtered
      .filter((v: any) => v.crowdLevel)
      .sort((a: any, b: any) => {
        const aRank = levelOrder.indexOf(a.crowdLevel);
        const bRank = levelOrder.indexOf(b.crowdLevel);
        if (aRank !== bRank) return aRank - bRank;
        return (a.distance || 99) - (b.distance || 99);
      });
  }, [filtered]);

  const heatDistricts = useMemo(() => {
    const map = new Map<string, any[]>();
    for (const bar of heatBars) {
      const d = bar.district || "Other";
      if (!map.has(d)) map.set(d, []);
      map.get(d)!.push(bar);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [heatBars]);

  return (
    <div style={{ padding: "16px", maxWidth: "680px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <h1 style={{ fontWeight: 800, fontSize: "22px", color: "var(--color-text-primary, #fff)", margin: 0 }}>Bars & Venues</h1>
        <div style={{ display: "flex", gap: "4px", background: "var(--color-card, #1a1a1a)", border: "1px solid var(--color-card-border, #262626)", borderRadius: "10px", padding: "3px" }}>
          <button onClick={() => { setView("list"); setPage(1); }} style={{ display: "flex", alignItems: "center", gap: "5px", padding: "6px 12px", borderRadius: "8px", border: "none", fontSize: "11px", fontWeight: 600, cursor: "pointer", background: view === "list" ? "#7c3aed" : "transparent", color: view === "list" ? "#fff" : "#737373" }}>
            <ListBullets size={13} /> List
          </button>
          <button onClick={() => { setView("heatmap"); setPage(1); }} style={{ display: "flex", alignItems: "center", gap: "5px", padding: "6px 12px", borderRadius: "8px", border: "none", fontSize: "11px", fontWeight: 600, cursor: "pointer", background: view === "heatmap" ? "#7c3aed" : "transparent", color: view === "heatmap" ? "#fff" : "#737373" }}>
            <ChartBar size={13} /> Heat Map
          </button>
        </div>
      </div>

      <SearchBar>
        <MagnifyingGlass size={18} color="var(--color-text-muted, #737373)" />
        <SearchInput
          placeholder="Search by name, type, or district..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
        {search && (
          <button onClick={() => setSearch("")} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
            <X size={16} color="var(--color-text-muted, #737373)" />
          </button>
        )}
      </SearchBar>

      <Filters>
        {VENUE_TYPES.map(t => (
          <Chip key={t.key} $active={selectedTypes.includes(t.key)} onClick={() => toggleType(t.key)} type="button">
            {t.label}
          </Chip>
        ))}
        {(selectedTypes.length > 0 || search) && (
          <Chip $active={false} onClick={clearFilters} style={{ color: "#ef4444" }}>
            Clear all
          </Chip>
        )}
      </Filters>

      <div style={{ color: "var(--color-text-muted, #737373)", fontSize: "12px", marginBottom: "12px" }}>
        {filtered.length} {filtered.length === 1 ? "venue" : "venues"} found
        {selectedTypes.length > 0 && ` · ${selectedTypes.map(t => VENUE_TYPES.find(vt => vt.key === t)?.label).join(", ")}`}
      </div>

      {/* Heat map view */}
      {view === "heatmap" && (
        heatBars.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 16px", color: "var(--color-text-muted, #737373)" }}>
            <ChartBar size={48} color="#737373" style={{ marginBottom: "12px" }} />
            <p style={{ fontSize: "14px" }}>No crowd data available yet.</p>
            <p style={{ fontSize: "12px", marginTop: "4px" }}>Bars will appear here once they start reporting crowd levels.</p>
          </div>
        ) : (
          heatDistricts.map(([district, bars]) => (
            <HeatSection key={district}>
              <HeatSectionHeader>
                <HeatSectionTitle>{district}</HeatSectionTitle>
                <HeatSectionCount>{bars.length} {bars.length === 1 ? "bar" : "bars"} reporting</HeatSectionCount>
              </HeatSectionHeader>
              <HeatCardGrid>
                {bars.map((bar: any) => {
                  const cfg = heatLevelConfig[bar.crowdLevel] || heatLevelConfig.QUIET;
                  return (
                    <HeatCard
                      key={bar.id}
                      $color={cfg.color}
                      $bg={cfg.bg}
                      onClick={() => router.push(`/venues/${bar.id}`)}
                    >
                      <HeatCardName>{bar.name}</HeatCardName>
                      <HeatCardLevel $color={cfg.color}>
                        <HeatCardDot $color={cfg.color} $pulse={cfg.pulse} />
                        {cfg.label}
                      </HeatCardLevel>
                      <HeatCardType>{bar.type?.replace(/_/g, " ")}</HeatCardType>
                      <HeatCardTime>Reported {heatTimeAgo(bar.crowdReportedAt)}</HeatCardTime>
                      <HeatCardDistance>
                        <NavigationArrow size={10} /> {formatDistance(bar.distance)}
                      </HeatCardDistance>
                    </HeatCard>
                  );
                })}
              </HeatCardGrid>
            </HeatSection>
          ))
        )
      )}

      {/* Venue list */}
      {view === "list" && (
        <List>
          {displayed.length === 0 && (
            <div style={{ textAlign: "center", padding: "48px 16px", color: "var(--color-text-muted, #737373)" }}>
              <House size={48} color="var(--color-text-muted, #737373)" style={{ marginBottom: "12px" }} />
              <p style={{ fontSize: "14px" }}>No venues match your search.</p>
              <p style={{ fontSize: "12px", marginTop: "4px" }}>Try different filters or search terms.</p>
            </div>
          )}
          {displayed.map((venue: any) => (
          <BarCard key={venue.id} onClick={() => router.push(`/venues/${venue.id}`)}>
            {venue.imageUrl ? (
              <BarImage>
                <img src={venue.imageUrl} alt={venue.name} />
                <div style={{ position: "absolute", top: "10px", left: "10px", background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", color: "var(--color-text-primary, #fff)", fontSize: "10px", fontWeight: 600, padding: "3px 8px", borderRadius: "6px", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                  <Star size={10} weight="fill" color="#f59e0b" /> {ratings[venue.id] || 4.0}
                </div>
                {(() => {
                  const open = isVenueOpen(venue.hours);
                  return (
                    <div style={{ position: "absolute", top: "10px", right: "10px", background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", padding: "3px 8px", borderRadius: "6px", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                      <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: open ? "#10b981" : "#ef4444" }} />
                      <span style={{ color: open ? "#10b981" : "#ef4444", fontSize: "10px", fontWeight: 600 }}>{open ? "Open" : "Closed"}</span>
                    </div>
                  );
                })()}
              </BarImage>
            ) : (
              <div style={{ height: "100px", background: "linear-gradient(135deg, #1a0533, #2d1060)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                <House size={40} color="#a78bfa" weight="fill" opacity={0.3} />
                <div style={{ position: "absolute", top: "10px", left: "10px", background: "rgba(0,0,0,0.5)", color: "var(--color-text-primary, #fff)", fontSize: "10px", fontWeight: 600, padding: "3px 8px", borderRadius: "6px", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                  <Star size={10} weight="fill" color="#f59e0b" /> {ratings[venue.id] || 4.0}
                </div>
                {(() => {
                  const open = isVenueOpen(venue.hours);
                  return (
                    <div style={{ position: "absolute", top: "10px", right: "10px", background: "rgba(0,0,0,0.5)", padding: "3px 8px", borderRadius: "6px", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                      <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: open ? "#10b981" : "#ef4444" }} />
                      <span style={{ color: open ? "#10b981" : "#ef4444", fontSize: "10px", fontWeight: 600 }}>{open ? "Open" : "Closed"}</span>
                    </div>
                  );
                })()}
              </div>
            )}

            <BarBody>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ color: "var(--color-text-primary, #fff)", fontWeight: 700, fontSize: "15px" }}>{venue.name}</div>
                  <div style={{ color: "var(--color-text-secondary, #a3a3a3)", fontSize: "12px", marginTop: "2px" }}>
                    {venue.type?.replace(/_/g, " ")} · {venue.district}
                  </div>
                </div>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "3px", color: "#7c3aed", fontSize: "12px", fontWeight: 600 }}>
                  <NavigationArrow size={12} /> {formatDistance(venue.distance)}
                </span>
              </div>
              {venue.crowdLevel && (
                <div style={{ marginTop: "6px" }}>
                  <CrowdIndicator level={venue.crowdLevel} reportedAt={venue.crowdReportedAt} variant="badge" />
                </div>
              )}
            </BarBody>
          </BarCard>
        ))}
        </List>
      )}

      {/* Load more — list view only */}
      {view === "list" && hasMore && (
        <div style={{ textAlign: "center", marginTop: "16px" }}>
          <Button variant="secondary" fullWidth onClick={() => setPage(p => p + 1)}>
            Show more ({filtered.length - displayed.length} remaining)
          </Button>
        </div>
      )}
    </div>
  );
}
