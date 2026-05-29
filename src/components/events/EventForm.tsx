"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import styled from "styled-components";
import { Input, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { useCreateEvent } from "@/hooks/useEvents";
import { useVenues } from "@/hooks/useVenues";
import { useGeolocation } from "@/hooks/useGeolocation";
import { formatDistance } from "@/lib/utils";
import { MapPin, CheckCircle, House, X, ArrowRight } from "@phosphor-icons/react";

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

const VenueList = styled.div`
  display: flex; flex-direction: column; gap: 6px;
  max-height: 260px; overflow-y: auto;
  background: #0a0a0a;
  border: 1px solid #262626;
  border-radius: 12px;
  padding: 8px;
`;

const VenueOption = styled.div<{ $selected: boolean }>`
  display: flex; align-items: center; gap: 10px;
  padding: 10px 12px;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.15s;
  background: ${({ $selected }) => $selected ? "#7c3aed22" : "transparent"};
  border: 1px solid ${({ $selected }) => $selected ? "#7c3aed" : "transparent"};
  &:hover { background: #1a1a1a; }
`;

const Filters = styled.div`
  display: flex; gap: 6px; flex-wrap: wrap;
`;

const SelectedBar = styled.div`
  display: inline-flex; align-items: center; gap: 6px;
  background: #7c3aed22; border: 1px solid #7c3aed44;
  border-radius: 8px; padding: 6px 10px;
  font-size: 12px; color: #fff; font-weight: 500;
`;

const RouteLine = styled.div`
  display: flex; align-items: center; gap: 6px; flex-wrap: wrap;
  margin-top: 4px;
`;

const labelStyle: React.CSSProperties = { color: "#a3a3a3", fontSize: "12px", fontWeight: 600 };

export function EventForm() {
  const router = useRouter();
  const { mutate: createEvent, isPending } = useCreateEvent();
  const { lat, lng } = useGeolocation();
  const { data: venues = [] } = useVenues();

  const [title, setTitle] = useState("");
  const [selectedVenues, setSelectedVenues] = useState<any[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [description, setDescription] = useState("");
  const [maxAttendees, setMaxAttendees] = useState("0");
  const [isPrivate, setIsPrivate] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const toggleType = (key: string) => {
    setSelectedTypes(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const toggleVenue = (venue: any) => {
    setSelectedVenues(prev => {
      const exists = prev.find(v => v.id === venue.id);
      if (exists) return prev.filter(v => v.id !== venue.id);
      return [...prev, venue];
    });
  };

  const removeVenue = (venueId: string) => {
    setSelectedVenues(prev => prev.filter(v => v.id !== venueId));
  };

  // Filter venues
  const filteredVenues = venues
    .map((v: any) => ({
      ...v,
      distance: lat && lng ? Math.sqrt((v.lat - lat) ** 2 + (v.lng - lng) ** 2) * 111.32 : 99,
    }))
    .filter((v: any) => selectedTypes.length === 0 || selectedTypes.includes(v.type))
    .sort((a: any, b: any) => a.distance - b.distance)
    .slice(0, 10);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault(); setError("");
    if (!title || selectedVenues.length === 0 || !startTime) {
      setError("Please fill in all required fields and select at least one venue"); return;
    }

    // Build crawl route: primary is first venue, route is all joined
    const primary = selectedVenues[0];
    const venueName = selectedVenues.length === 1
      ? primary.name
      : selectedVenues.map(v => v.name).join(" → ");
    const venueType = selectedVenues.length === 1 ? primary.type : "CRAWL";

    createEvent(
      {
        title, description: description || undefined,
        venueId: primary.id,
        venueName,
        venueType,
        startTime: new Date(startTime).toISOString(),
        endTime: endTime ? new Date(endTime).toISOString() : undefined,
        maxAttendees: parseInt(maxAttendees) || null, isPrivate,
        imageUrl: imageUrl || null,
        crawlStops: selectedVenues.length > 1 ? selectedVenues.slice(1) : [],
      },
      {
        onSuccess: (data: any) => {
          if (data.id) router.push(`/events/${data.id}`);
        },
        onError: (err: any) => setError(err?.error || "Failed to create event"),
      }
    );
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px", padding: "16px", maxWidth: "480px", margin: "0 auto" }}>
      <h1 style={{ fontWeight: 800, fontSize: "22px", color: "#fff", marginBottom: "4px" }}>Create Event</h1>

      <label style={labelStyle}>Event title *</label>
      <Input placeholder="e.g., Friday Pub Crawl" maxLength={60} value={title} onChange={(e) => setTitle(e.target.value)} required />

      <label style={labelStyle}>Filter venues by type</label>
      <Filters>
        {VENUE_TYPES.map(t => (
          <Chip key={t.key} $active={selectedTypes.includes(t.key)} onClick={() => toggleType(t.key)} type="button">
            {t.label}
          </Chip>
        ))}
      </Filters>

      {/* Selected venues route display */}
      {selectedVenues.length > 0 && (
        <div>
          <div style={{ ...labelStyle, marginBottom: "6px" }}>
            Your crawl route ({selectedVenues.length} {selectedVenues.length === 1 ? "bar" : "bars"})
          </div>
          <RouteLine>
            {selectedVenues.map((v, i) => (
              <span key={v.id} style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                <SelectedBar>
                  {v.name}
                  <button type="button" onClick={() => removeVenue(v.id)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: "#a3a3a3" }}>
                    <X size={12} />
                  </button>
                </SelectedBar>
                {i < selectedVenues.length - 1 && <ArrowRight size={12} color="#737373" />}
              </span>
            ))}
          </RouteLine>
        </div>
      )}

      <label style={labelStyle}>
        {selectedTypes.length > 0
          ? `Nearby ${selectedTypes.map(t => VENUE_TYPES.find(vt => vt.key === t)?.label).join(" & ")}`
          : "Nearby venues"}
        <span style={{ color: "#737373", fontWeight: 400, marginLeft: "4px" }}>(tap to select, tap again to remove)</span>
      </label>

      <VenueList>
        {filteredVenues.length === 0 && (
          <div style={{ padding: "20px", textAlign: "center", color: "#737373", fontSize: "13px" }}>
            No venues found. Try different categories.
          </div>
        )}
        {filteredVenues.map((venue: any) => {
          const isSelected = selectedVenues.some(v => v.id === venue.id);
          return (
            <VenueOption
              key={venue.id}
              $selected={isSelected}
              onClick={() => toggleVenue(venue)}
            >
              <div style={{ width: "36px", height: "36px", background: isSelected ? "#7c3aed22" : "#262626", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {isSelected
                  ? <CheckCircle size={18} color="#7c3aed" weight="fill" />
                  : <House size={18} color="#737373" weight="regular" />
                }
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: "#fff", fontWeight: 600, fontSize: "13px" }}>{venue.name}</div>
                <div style={{ color: "#737373", fontSize: "10px", marginTop: "1px" }}>
                  {venue.type.replace(/_/g, " ")} · {venue.district} · <MapPin size={10} style={{ display: "inline" }} /> {formatDistance(venue.distance)}
                </div>
              </div>
              {isSelected && (
                <span style={{ color: "#7c3aed", fontSize: "10px", fontWeight: 600 }}>
                  #{selectedVenues.findIndex(v => v.id === venue.id) + 1}
                </span>
              )}
            </VenueOption>
          );
        })}
      </VenueList>

      <label style={labelStyle}>Start date & time *</label>
      <Input type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />

      <label style={labelStyle}>End date & time (optional)</label>
      <Input type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)} />

      <label style={labelStyle}>Description (optional, max 500 chars)</label>
      <Textarea placeholder="What's the plan?" maxLength={500} value={description} onChange={(e) => setDescription(e.target.value)} />

      <label style={labelStyle}>Cover image (optional)</label>
      {imageUrl ? (
        <div style={{ position: "relative", borderRadius: "12px", overflow: "hidden", height: "160px", background: "#1a1a1a" }}>
          <img src={imageUrl} alt="Event cover" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          <button
            type="button"
            onClick={() => setImageUrl("")}
            style={{ position: "absolute", top: "8px", right: "8px", width: "28px", height: "28px", borderRadius: "50%", background: "rgba(0,0,0,0.7)", border: "none", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px" }}
          >✕</button>
        </div>
      ) : (
        <>
          <input
            type="file" accept="image/*"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              setUploading(true);
              const fd = new FormData();
              fd.append("file", file);
              const res = await fetch("/api/upload", { method: "POST", body: fd });
              if (res.ok) {
                const data = await res.json();
                setImageUrl(data.url);
              }
              setUploading(false);
            }}
            style={{ display: "none" }}
            id="event-image-upload"
          />
          <Button type="button" variant="secondary" size="sm" fullWidth onClick={() => document.getElementById("event-image-upload")?.click()} disabled={uploading}>
            {uploading ? "Uploading..." : "📷 Upload a cover photo"}
          </Button>
        </>
      )}

      <label style={labelStyle}>Max attendees (0 = unlimited)</label>
      <Input type="number" min="0" value={maxAttendees} onChange={(e) => setMaxAttendees(e.target.value)} />

      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <input type="checkbox" id="private" checked={isPrivate} onChange={(e) => setIsPrivate(e.target.checked)}
          style={{ accentColor: "#7c3aed", width: "18px", height: "18px" }} />
        <label htmlFor="private" style={{ ...labelStyle, cursor: "pointer" }}>Private event</label>
      </div>

      {error && <p style={{ color: "#ef4444", fontSize: "12px" }}>{error}</p>}
      <Button type="submit" size="lg" fullWidth disabled={isPending}>
        {isPending ? "Creating..." : `Create Event${selectedVenues.length > 1 ? ` (${selectedVenues.length} stops)` : ""}`}
      </Button>
    </form>
  );
}
