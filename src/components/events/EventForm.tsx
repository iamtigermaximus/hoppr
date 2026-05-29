"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useCreateEvent } from "@/hooks/useEvents";

export function EventForm() {
  const router = useRouter();
  const { mutate: createEvent, isPending } = useCreateEvent();
  const [title, setTitle] = useState("");
  const [venueId, setVenueId] = useState("");
  const [venueName, setVenueName] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [description, setDescription] = useState("");
  const [maxAttendees, setMaxAttendees] = useState("0");
  const [isPrivate, setIsPrivate] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault(); setError("");
    if (!title || !venueId || !venueName || !startTime) {
      setError("Please fill in all required fields"); return;
    }
    createEvent(
      {
        title, description: description || undefined, venueId, venueName,
        startTime: new Date(startTime).toISOString(),
        endTime: endTime ? new Date(endTime).toISOString() : undefined,
        maxAttendees: parseInt(maxAttendees) || null, isPrivate,
      },
      {
        onSuccess: (data: any) => {
          if (data.id) router.push(`/events/${data.id}`);
        },
        onError: (err: any) => setError(err?.error || "Failed to create event"),
      }
    );
  };

  const labelStyle: React.CSSProperties = { color: "#a3a3a3", fontSize: "12px", fontWeight: 600 };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px", padding: "16px", maxWidth: "480px", margin: "0 auto" }}>
      <h1 style={{ fontWeight: 800, fontSize: "22px", color: "#fff", marginBottom: "8px" }}>Create Event</h1>

      <label style={labelStyle}>Event title *</label>
      <Input placeholder="e.g., Friday Pub Crawl" maxLength={60} value={title} onChange={(e) => setTitle(e.target.value)} required />

      <label style={labelStyle}>Venue name *</label>
      <Input placeholder="Search for a bar..." value={venueName} onChange={(e) => { setVenueName(e.target.value); setVenueId(e.target.value.toLowerCase().replace(/\s+/g, "-")); }} required />

      <label style={labelStyle}>Start date & time *</label>
      <Input type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />

      <label style={labelStyle}>End date & time (optional)</label>
      <Input type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)} />

      <label style={labelStyle}>Description (optional, max 500 chars)</label>
      <Textarea placeholder="What's the plan?" maxLength={500} value={description} onChange={(e) => setDescription(e.target.value)} />

      <label style={labelStyle}>Max attendees (0 = unlimited)</label>
      <Input type="number" min="0" value={maxAttendees} onChange={(e) => setMaxAttendees(e.target.value)} />

      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <input type="checkbox" id="private" checked={isPrivate} onChange={(e) => setIsPrivate(e.target.checked)}
          style={{ accentColor: "#7c3aed", width: "18px", height: "18px" }} />
        <label htmlFor="private" style={{ ...labelStyle, cursor: "pointer" }}>Private event</label>
      </div>

      {error && <p style={{ color: "#ef4444", fontSize: "12px" }}>{error}</p>}
      <Button type="submit" size="lg" fullWidth disabled={isPending}>
        {isPending ? "Creating..." : "Create Event"}
      </Button>
    </form>
  );
}
