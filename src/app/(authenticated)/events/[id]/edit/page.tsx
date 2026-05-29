"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useEvent } from "@/hooks/useEvents";
import { Input, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function EditEventPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { data: event, isLoading } = useEvent(id);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [maxAttendees, setMaxAttendees] = useState("0");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (event) {
      setTitle(event.title || "");
      setDescription(event.description || "");
      setStartTime(event.startTime ? new Date(event.startTime).toISOString().slice(0, 16) : "");
      setEndTime(event.endTime ? new Date(event.endTime).toISOString().slice(0, 16) : "");
      setMaxAttendees(String(event.maxAttendees || 0));
    }
  }, [event]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setSaving(true);
    const res = await fetch(`/api/events/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        description: description || null,
        startTime: new Date(startTime).toISOString(),
        endTime: endTime ? new Date(endTime).toISOString() : null,
        maxAttendees: parseInt(maxAttendees) || null,
      }),
    });
    if (res.ok) {
      router.push(`/events/${id}`);
    } else {
      const data = await res.json();
      setError(data.error || "Failed to update");
    }
    setSaving(false);
  };

  if (isLoading) return <div style={{ padding: 32, textAlign: "center", color: "#737373" }}>Loading...</div>;
  if (!event) return <div style={{ padding: 32, textAlign: "center", color: "#ef4444" }}>Event not found</div>;

  const labelStyle: React.CSSProperties = { color: "#a3a3a3", fontSize: "12px", fontWeight: 600 };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px", padding: "16px", maxWidth: "480px", margin: "0 auto" }}>
      <h1 style={{ fontWeight: 800, fontSize: "22px", color: "#fff", marginBottom: "4px" }}>Edit Event</h1>

      <label style={labelStyle}>Event title</label>
      <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={60} required />

      <label style={labelStyle}>Description</label>
      <Textarea value={description} onChange={(e) => setDescription(e.target.value)} maxLength={500} />

      <label style={labelStyle}>Start date & time</label>
      <Input type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />

      <label style={labelStyle}>End date & time</label>
      <Input type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)} />

      <label style={labelStyle}>Max attendees (0 = unlimited)</label>
      <Input type="number" min="0" value={maxAttendees} onChange={(e) => setMaxAttendees(e.target.value)} />

      {error && <p style={{ color: "#ef4444", fontSize: "12px" }}>{error}</p>}

      <Button type="submit" size="lg" fullWidth disabled={saving}>
        {saving ? "Saving..." : "Save Changes"}
      </Button>
      <Button type="button" variant="ghost" fullWidth onClick={() => router.back()}>Cancel</Button>
    </form>
  );
}
