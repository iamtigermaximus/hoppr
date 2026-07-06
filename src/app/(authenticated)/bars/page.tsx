"use client";
import { useState, useMemo } from "react";
import styled from "styled-components";
import { useRouter } from "next/navigation";
import { useVenues } from "@/hooks/useVenues";
import { useGeolocation } from "@/hooks/useGeolocation";
import { Chip } from "@/components/ui/Chip";
import { Button } from "@/components/ui/Button";
import { formatDistance, formatPriceRange, isVenueOpen } from "@/lib/utils";
import CrowdIndicator from "@/components/venues/CrowdIndicator";
import SponsoredBadge from "@/components/ads/SponsoredBadge";
import { useQuery } from "@tanstack/react-query";
import { House, Star, Users, MagnifyingGlass, X, NavigationArrow, ListBullets, ChartBar, Megaphone } from "@phosphor-icons/react";
import { SkeletonBarCard } from "@/components/ui/Skeleton";

const VENUE_TYPE_LABEL_MAP: Record<string, string> = {
  PUB: "Pubs",
  CLUB: "Clubs",
  COCKTAIL_LOUNGE: "Cocktails",
  SPORTS_BAR: "Sports",
  KARAOKE_BAR: "Karaoke",
  WINE_BAR: "Wine",
  BREWERY_TAPROOM: "Brewery",
  LIVE_MUSIC: "Live Music",
};

const VENUE_TYPE_KEYS = Object.keys(VENUE_TYPE_LABEL_MAP);

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

const PAGE_SIZE = 12;

export default function BarsPage() {
  const router = useRouter();
  const { lat, lng } = useGeolocation();
  const { data: venues = [], isLoading } = useVenues();
  const [search, setSearch] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedDistricts, setSelectedDistricts] = useState<string[]>([]);
  const [page, setPage] = useState(1);

  const districts = useMemo(() => {
    const set = new Set<string>();
    (venues as any[]).forEach((v: any) => { if (v.district) set.add(v.district); });
    return Array.from(set).sort();
  }, [venues]);

  const { data: campaigns = [] } = useQuery<any[]>({
    queryKey: ["campaigns", "featured-bars"],
    queryFn: () => fetch("/api/campaigns").then((r) => r.json()),
  });

  const featuredBars = useMemo(() => {
    const featured = campaigns
      .filter((c: any) => c.type === "FEATURED_LISTING")
      .map((c: any) => {
        const bar = (venues as any[]).find((v: any) => v.id === c.barId);
        if (!bar) return null;
        const distance = lat && lng && bar.latitude && bar.longitude
          ? Math.sqrt((bar.latitude - lat) ** 2 + (bar.longitude - lng) ** 2) * 111.32
          : 99;
        return {
          ...bar,
          distance,
          campaignId: c.id,
          campaignTitle: c.title,
          isFeatured: true as const,
        };
      })
      .filter(Boolean);
    return featured;
  }, [campaigns, venues, lat, lng]);

  const toggleType = (key: string) => {
    setSelectedTypes(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
    setPage(1);
  };

  const toggleDistrict = (district: string) => {
    setSelectedDistricts(prev =>
      prev.includes(district) ? prev.filter(d => d !== district) : [...prev, district]
    );
    setPage(1);
  };

  const clearFilters = () => {
    setSelectedTypes([]);
    setSelectedDistricts([]);
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
        if (selectedDistricts.length > 0 && !selectedDistricts.includes(v.district)) return false;
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

  return (
    <div style={{ padding: "16px", maxWidth: "680px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <h1 style={{ fontWeight: 800, fontSize: "22px", color: "var(--color-text-primary, #fff)", margin: 0 }}>Bars & Venues</h1>
        <div style={{ display: "flex", gap: "4px", background: "var(--color-card, #1a1a1a)", border: "1px solid var(--color-card-border, #262626)", borderRadius: "10px", padding: "3px" }}>
          <button style={{ display: "flex", alignItems: "center", gap: "5px", padding: "6px 12px", borderRadius: "8px", border: "none", fontSize: "11px", fontWeight: 600, cursor: "pointer", background: "#7c3aed", color: "#fff" }}>
            <ListBullets size={13} /> List
          </button>
          <button onClick={() => router.push("/map")} style={{ display: "flex", alignItems: "center", gap: "5px", padding: "6px 12px", borderRadius: "8px", border: "none", fontSize: "11px", fontWeight: 600, cursor: "pointer", background: "transparent", color: "#737373" }}>
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
        {VENUE_TYPE_KEYS.map(key => (
          <Chip key={key} $active={selectedTypes.includes(key)} onClick={() => toggleType(key)} type="button">
            {VENUE_TYPE_LABEL_MAP[key]}
          </Chip>
        ))}
        {(selectedTypes.length > 0 || selectedDistricts.length > 0 || search) && (
          <Chip $active={false} onClick={clearFilters} style={{ color: "#ef4444" }}>
            Clear all
          </Chip>
        )}
      </Filters>

      {districts.length > 0 && (
        <Filters>
          {districts.map(d => (
            <Chip key={d} $active={selectedDistricts.includes(d)} onClick={() => toggleDistrict(d)} type="button">
              {d}
            </Chip>
          ))}
        </Filters>
      )}

      <div style={{ color: "var(--color-text-muted, #737373)", fontSize: "12px", marginBottom: "12px" }}>
        {filtered.length === 1 ? `${filtered.length} venue found` : `${filtered.length} venues found`}
        {selectedTypes.length > 0 && ` · ${selectedTypes.map(type => VENUE_TYPE_LABEL_MAP[type]).join(", ")}`}
      </div>

      {isLoading && (
        <List>
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonBarCard key={i} />
          ))}
        </List>
      )}

      {!isLoading && (<>
      {/* Featured listings */}
      {featuredBars.length > 0 && (
        <div style={{ marginBottom: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px", padding: "0 4px" }}>
            <Megaphone size={14} color="#a78bfa" weight="fill" />
            <span style={{ fontSize: "11px", fontWeight: 700, color: "#a78bfa", textTransform: "uppercase", letterSpacing: "0.5px" }}>Featured</span>
          </div>
          <List>
            {featuredBars.map((bar: any) => (
              <BarCard
                key={`featured-${bar.id}`}
                style={{ borderColor: "#7c3aed44", background: "linear-gradient(135deg, rgba(124,58,237,0.06), rgba(124,58,237,0.02))" }}
                onClick={() => router.push(`/venues/${bar.id}`)}
              >
                {bar.imageUrl || bar.coverImage ? (
                  <BarImage>
                    <img src={bar.imageUrl || bar.coverImage} alt={bar.name} />
                    <div style={{ position: "absolute", top: "10px", left: "10px", display: "flex", gap: "6px", zIndex: 2 }}>
                      <div style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", color: "#fff", fontSize: "10px", fontWeight: 600, padding: "3px 8px", borderRadius: "6px", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                        <Star size={10} weight="fill" color="#a78bfa" /> Featured
                      </div>
                    </div>
                  </BarImage>
                ) : (
                  <div style={{ height: "100px", background: "linear-gradient(135deg, rgba(124,58,237,0.15), rgba(124,58,237,0.05))", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                    <Megaphone size={40} color="#a78bfa" weight="fill" opacity={0.2} />
                    <div style={{ position: "absolute", top: "10px", left: "10px", background: "rgba(0,0,0,0.5)", color: "#fff", fontSize: "10px", fontWeight: 600, padding: "3px 8px", borderRadius: "6px", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                      <Star size={10} weight="fill" color="#a78bfa" /> Featured
                    </div>
                  </div>
                )}
                <BarBody>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ color: "#fff", fontWeight: 700, fontSize: "15px" }}>{bar.name}</div>
                      <div style={{ color: "#a3a3a3", fontSize: "12px", marginTop: "2px" }}>
                        {VENUE_TYPE_LABEL_MAP[bar.type] || bar.type?.replace(/_/g, " ")} · {bar.district}
                        {bar.priceRange && <> · <span style={{ color: "#f59e0b" }}>{formatPriceRange(bar.priceRange)}</span></>}
                        {bar.coverCharge != null && <> · {bar.coverCharge === 0 ? <span style={{ color: "#10b981" }}>Free entry</span> : <span>{`Entry: €${bar.coverCharge}`}</span>}</>}
                      </div>
                      {bar.musicTags?.length > 0 && (
                        <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", marginTop: "4px" }}>
                          {bar.musicTags.slice(0, 3).map((tag: string) => (
                            <span key={tag} style={{ background: "rgba(99,102,241,0.12)", color: "#a5b4fc", fontSize: "9px", fontWeight: 600, padding: "1px 6px", borderRadius: "3px" }}>{tag}</span>
                          ))}
                        </div>
                      )}
                      {bar.followerCount > 0 && (
                        <div style={{ color: "#737373", fontSize: "10px", marginTop: "3px" }}>
                          <Users size={10} style={{ verticalAlign: "middle", marginRight: "3px" }} />
                          {bar.followerCount === 1 ? `${bar.followerCount} follower` : `${bar.followerCount} followers`}
                        </div>
                      )}
                    </div>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "3px", color: "#7c3aed", fontSize: "12px", fontWeight: 600 }}>
                      <NavigationArrow size={12} /> {formatDistance(bar.distance)}
                    </span>
                  </div>
                  <div style={{ marginTop: "6px" }}>
                    <SponsoredBadge />
                  </div>
                </BarBody>
              </BarCard>
            ))}
          </List>
        </div>
      )}

      {/* Venue list */}
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
                {venue.qualityScore != null && venue.qualityScore > 0 && (
                  <div style={{ position: "absolute", top: "10px", left: "10px", background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", color: "var(--color-text-primary, #fff)", fontSize: "10px", fontWeight: 600, padding: "3px 8px", borderRadius: "6px", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                    <Star size={10} weight="fill" color="#f59e0b" /> {venue.qualityScore.toFixed(1)}
                  </div>
                )}
                {(() => {
                  const open = isVenueOpen(venue.hours);
                  if (open === null) return null;
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
                {venue.qualityScore != null && venue.qualityScore > 0 && (
                  <div style={{ position: "absolute", top: "10px", left: "10px", background: "rgba(0,0,0,0.5)", color: "var(--color-text-primary, #fff)", fontSize: "10px", fontWeight: 600, padding: "3px 8px", borderRadius: "6px", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                    <Star size={10} weight="fill" color="#f59e0b" /> {venue.qualityScore.toFixed(1)}
                  </div>
                )}
                {(() => {
                  const open = isVenueOpen(venue.hours);
                  if (open === null) return null;
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
                    {VENUE_TYPE_LABEL_MAP[venue.type] || venue.type?.replace(/_/g, " ")} · {venue.district}
                    {venue.priceRange && <> · <span style={{ color: "#f59e0b" }}>{formatPriceRange(venue.priceRange)}</span></>}
                    {venue.coverCharge != null && <> · {venue.coverCharge === 0 ? <span style={{ color: "#10b981" }}>Free entry</span> : <span>Entry: €{venue.coverCharge}</span>}</>}
                  </div>
                  {venue.musicTags?.length > 0 && (
                    <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", marginTop: "4px" }}>
                      {venue.musicTags.slice(0, 3).map((tag: string) => (
                        <span key={tag} style={{ background: "rgba(99,102,241,0.12)", color: "#a5b4fc", fontSize: "9px", fontWeight: 600, padding: "1px 6px", borderRadius: "3px" }}>{tag}</span>
                      ))}
                    </div>
                  )}
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

      {/* Load more */}
      {hasMore && (
        <div style={{ textAlign: "center", marginTop: "16px" }}>
          <Button variant="secondary" fullWidth onClick={() => setPage(p => p + 1)}>
            {`Show more (${filtered.length - displayed.length} remaining)`}
          </Button>
        </div>
      )}
    </>
    )}
    </div>
  );
}
