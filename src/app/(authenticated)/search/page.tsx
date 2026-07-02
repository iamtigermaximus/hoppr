"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styled from "styled-components";
import { MagnifyingGlass, MapPin, Calendar, Ticket, ArrowLeft } from "@phosphor-icons/react";
import { Badge } from "@/components/ui/Badge";
import { useQuery } from "@tanstack/react-query";
import { formatDistance, formatEventTime } from "@/lib/utils";
import { useGeolocation } from "@/hooks/useGeolocation";

// ---- Styles ----

const Page = styled.div`
  padding: 16px;
  max-width: 680px;
  margin: 0 auto;
`;

const SearchBar = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  background: #1a1a1a;
  border: 1px solid #262626;
  border-radius: 12px;
  padding: 0 14px;
  margin-bottom: 20px;
`;

const Input = styled.input`
  flex: 1;
  background: none;
  border: none;
  color: #fff;
  font-size: 15px;
  padding: 12px 0;
  outline: none;
  &::placeholder {
    color: #525252;
  }
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  margin-top: 20px;
  &:first-of-type {
    margin-top: 0;
  }
`;

const SectionTitle = styled.h3`
  color: #fff;
  font-weight: 700;
  font-size: 14px;
  margin: 0;
`;

const SectionCount = styled.span`
  color: #525252;
  font-size: 12px;
`;

const ResultCard = styled(Link)`
  display: flex;
  align-items: center;
  gap: 12px;
  background: #1a1a1a;
  border: 1px solid #262626;
  border-radius: 12px;
  padding: 14px;
  margin-bottom: 8px;
  text-decoration: none;
  transition: background 0.15s;
  &:hover {
    background: #222;
  }
`;

const CardImage = styled.div<{ $url?: string }>`
  width: 48px;
  height: 48px;
  border-radius: 10px;
  flex-shrink: 0;
  background: ${({ $url }) =>
    $url ? `url(${$url}) center/cover` : "linear-gradient(135deg, #2a2a2a, #1a1a1a)"};
`;

const CardBody = styled.div`
  flex: 1;
  min-width: 0;
`;

const CardTitle = styled.div`
  color: #fff;
  font-weight: 600;
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const CardSub = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  color: #737373;
  font-size: 11px;
  margin-top: 3px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const CardMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px 16px;
  color: #525252;
  text-align: center;
`;

const Prompt = styled.p`
  font-size: 13px;
  margin-top: 12px;
`;

const SkeletonCard = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  background: #1a1a1a;
  border: 1px solid #262626;
  border-radius: 12px;
  padding: 14px;
  margin-bottom: 8px;
`;

const SkeletonImage = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 10px;
  background: #262626;
  flex-shrink: 0;
`;

const SkeletonLine = styled.div<{ $w?: number }>`
  height: 12px;
  background: #262626;
  border-radius: 4px;
  width: ${({ $w }) => $w ?? 120}px;
  margin-bottom: 6px;
`;

// ---- Types ----

interface SearchResult {
  id: string;
  name?: string;
  title?: string;
  type?: string;
  venueName?: string;
  venueId?: string;
  district?: string;
  startTime?: string;
  imageUrl?: string | null;
  distance?: number | null;
}

interface SearchData {
  venues: SearchResult[];
  events: SearchResult[];
  promotions: SearchResult[];
}

// ---- Component ----

export default function SearchPage() {
  const router = useRouter();
  const { lat, lng } = useGeolocation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  // Auto-focus the search input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Debounce: wait 300ms after the user stops typing
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const hasCoords = lat != null && lng != null;

  const { data, isLoading } = useQuery<SearchData>({
    queryKey: ["search", debouncedQuery, lat, lng],
    queryFn: async () => {
      const params = new URLSearchParams({ q: debouncedQuery });
      if (hasCoords) {
        params.set("lat", String(lat));
        params.set("lng", String(lng));
      }
      const res = await fetch(`/api/search?${params.toString()}`);
      if (!res.ok) throw new Error("Search failed");
      const json = await res.json();

      // Track the search query in analytics
      fetch("/api/analytics/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          events: [{
            type: "SEARCH",
            data: { query: debouncedQuery },
          }],
        }),
      }).catch(() => {}); // fire-and-forget

      return json;
    },
    enabled: debouncedQuery.length > 0,
  });

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    // Force immediate search on Enter
    setDebouncedQuery(query.trim());
  }, [query]);

  const totalResults = data
    ? data.venues.length + data.events.length + data.promotions.length
    : 0;

  const showLoading = isLoading && debouncedQuery.length > 0;
  const showEmpty = !debouncedQuery;
  const showNoResults = !isLoading && debouncedQuery && totalResults === 0;
  const showResults = !isLoading && totalResults > 0;

  return (
    <Page>
      {/* Back + header */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
        <button
          onClick={() => router.back()}
          style={{
            display: "inline-flex",
            alignItems: "center",
            color: "#a3a3a3",
            fontSize: "13px",
            fontWeight: 500,
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 0,
          }}
        >
          <ArrowLeft size={16} />
        </button>
        <span style={{ color: "#fff", fontWeight: 800, fontSize: "18px" }}>Search</span>
      </div>

      {/* Search input */}
      <form onSubmit={handleSubmit}>
        <SearchBar>
          <MagnifyingGlass size={18} color="#525252" />
          <Input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Bars, events, promotions..."
          />
          {query && (
            <button
              type="button"
              onClick={() => { setQuery(""); setDebouncedQuery(""); }}
              style={{
                background: "none",
                border: "none",
                color: "#525252",
                cursor: "pointer",
                fontSize: "14px",
                padding: 0,
              }}
            >
              Clear
            </button>
          )}
        </SearchBar>
      </form>

      {/* Empty state — no query yet */}
      {showEmpty && (
        <EmptyState>
          <MagnifyingGlass size={40} color="#333" />
          <Prompt>Search for bars, events, and promotions across Helsinki</Prompt>
        </EmptyState>
      )}

      {/* Loading state */}
      {showLoading && (
        <div>
          {[1, 2, 3].map((i) => (
            <SkeletonCard key={i}>
              <SkeletonImage />
              <div>
                <SkeletonLine $w={160} />
                <SkeletonLine $w={100} />
              </div>
            </SkeletonCard>
          ))}
        </div>
      )}

      {/* No results */}
      {showNoResults && (
        <EmptyState>
          <MagnifyingGlass size={40} color="#333" />
          <Prompt>Nothing found for &ldquo;{debouncedQuery}&rdquo;</Prompt>
          <p style={{ color: "#525252", fontSize: "12px", marginTop: "4px" }}>
            Try different keywords or check the spelling
          </p>
        </EmptyState>
      )}

      {/* Results */}
      {showResults && data && (
        <div>
          {/* Venues */}
          {data.venues.length > 0 && (
            <>
              <SectionHeader>
                <MapPin size={14} color="#7c3aed" />
                <SectionTitle>Venues</SectionTitle>
                <SectionCount>{data.venues.length}</SectionCount>
              </SectionHeader>
              {data.venues.map((v) => (
                <ResultCard key={v.id} href={`/venues/${v.id}`}>
                  <CardImage $url={v.imageUrl ?? undefined} />
                  <CardBody>
                    <CardTitle>{v.name}</CardTitle>
                    <CardSub>
                      {v.type?.replace(/_/g, " ")} {v.district ? `· ${v.district}` : ""}
                    </CardSub>
                    {v.distance != null && (
                      <CardMeta>
                        <span style={{ color: "#737373", fontSize: "11px" }}>
                          {formatDistance(v.distance)}
                        </span>
                      </CardMeta>
                    )}
                  </CardBody>
                </ResultCard>
              ))}
            </>
          )}

          {/* Events */}
          {data.events.length > 0 && (
            <>
              <SectionHeader>
                <Calendar size={14} color="#f59e0b" />
                <SectionTitle>Events</SectionTitle>
                <SectionCount>{data.events.length}</SectionCount>
              </SectionHeader>
              {data.events.map((e) => (
                <ResultCard key={e.id} href={`/events/${e.id}`}>
                  <CardImage $url={e.imageUrl ?? undefined} />
                  <CardBody>
                    <CardTitle>{e.title}</CardTitle>
                    <CardSub>
                      <MapPin size={10} color="#525252" />
                      {e.venueName}
                    </CardSub>
                    <CardMeta>
                      {e.startTime && (
                        <span style={{ color: "#737373", fontSize: "11px" }}>
                          {formatEventTime(new Date(e.startTime))}
                        </span>
                      )}
                      {e.distance != null && (
                        <span style={{ color: "#737373", fontSize: "11px" }}>
                          {formatDistance(e.distance)}
                        </span>
                      )}
                    </CardMeta>
                  </CardBody>
                </ResultCard>
              ))}
            </>
          )}

          {/* Promotions */}
          {data.promotions.length > 0 && (
            <>
              <SectionHeader>
                <Ticket size={14} color="#10b981" />
                <SectionTitle>Promotions</SectionTitle>
                <SectionCount>{data.promotions.length}</SectionCount>
              </SectionHeader>
              {data.promotions.map((p) => (
                <ResultCard key={p.id} href={`/promotions/${p.id}`}>
                  <CardImage $url={p.imageUrl ?? undefined} />
                  <CardBody>
                    <CardTitle>{p.title}</CardTitle>
                    <CardSub>
                      <MapPin size={10} color="#525252" />
                      {p.venueName}
                    </CardSub>
                    <CardMeta>
                      {p.type && (
                        <Badge $type="promo">{p.type.replace(/_/g, " ")}</Badge>
                      )}
                      {p.distance != null && (
                        <span style={{ color: "#737373", fontSize: "11px" }}>
                          {formatDistance(p.distance)}
                        </span>
                      )}
                    </CardMeta>
                  </CardBody>
                </ResultCard>
              ))}
            </>
          )}
        </div>
      )}
    </Page>
  );
}
