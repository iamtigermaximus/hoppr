"use client";
import { useParams } from "next/navigation";
import { useVenue } from "@/hooks/useVenues";
import { useEvents } from "@/hooks/useEvents";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { formatDistance, formatEventTime } from "@/lib/utils";
import { MapPin, Phone, Globe } from "@phosphor-icons/react";
import { useGeolocation } from "@/hooks/useGeolocation";

const typeLabels: Record<string, string> = {
  PUB: "Pub", CLUB: "Club", COCKTAIL_LOUNGE: "Cocktail Lounge",
  SPORTS_BAR: "Sports Bar", KARAOKE_BAR: "Karaoke Bar",
  WINE_BAR: "Wine Bar", BREWERY_TAPROOM: "Brewery Taproom",
  LIVE_MUSIC: "Live Music Venue",
};

export function VenueDetail() {
  const params = useParams();
  const id = params.id as string;
  const { data: venue, isLoading } = useVenue(id);
  const { lat, lng } = useGeolocation();
  const { data: events } = useEvents();

  if (isLoading) return <div style={{ padding: 16, color: "#737373" }}>Loading...</div>;
  if (!venue || venue.error) return <div style={{ padding: 16, color: "#ef4444" }}>Venue not found</div>;

  const distance = lat && lng ? formatDistance(
    Math.sqrt((venue.lat - lat) ** 2 + (venue.lng - lng) ** 2) * 111.32
  ) : null;

  const venueEvents = events?.filter((e: any) => e.venueId === id) || [];

  return (
    <div style={{ padding: "16px", maxWidth: "600px", margin: "0 auto" }}>
      <h1 style={{ fontWeight: 800, fontSize: "22px", color: "#fff", marginBottom: "4px" }}>{venue.name}</h1>
      <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "12px" }}>
        <Badge $type="event">{typeLabels[venue.type] || venue.type}</Badge>
        {distance && <span style={{ color: "#737373", fontSize: "11px" }}>· {distance}</span>}
      </div>

      <div style={{ color: "#a3a3a3", fontSize: "13px", marginBottom: "16px", lineHeight: 1.6 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <MapPin size={14} /> {venue.address}, {venue.district}
        </div>
        {venue.phone && (
          <div style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "4px" }}>
            <Phone size={14} /> {venue.phone}
          </div>
        )}
        {venue.website && (
          <div style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "4px" }}>
            <Globe size={14} /> {venue.website}
          </div>
        )}
      </div>

      <Button variant="secondary" fullWidth style={{ marginBottom: "24px" }} onClick={() => {
        window.open(`https://www.google.com/maps/dir/?api=1&destination=${venue.lat},${venue.lng}`, "_blank");
      }}>
        <MapPin size={16} /> Get Directions
      </Button>

      {venue.promotions?.length > 0 && (
        <div style={{ marginBottom: "24px" }}>
          <SectionHeader title="Active Promotions" />
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {venue.promotions.map((promo: any) => (
              <Card key={promo.id}>
                <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                  <Badge $type="promo">PROMO</Badge>
                  <div>
                    <div style={{ color: "#fff", fontWeight: 600, fontSize: "13px" }}>{promo.title}</div>
                    <div style={{ color: "#a3a3a3", fontSize: "11px", marginTop: "2px" }}>{promo.description}</div>
                    <div style={{ color: "#737373", fontSize: "10px", marginTop: "4px" }}>
                      {formatEventTime(new Date(promo.validFrom))} — {formatEventTime(new Date(promo.validTo))}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {venueEvents.length > 0 && (
        <div style={{ marginBottom: "24px" }}>
          <SectionHeader title="Upcoming Events" />
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {venueEvents.map((event: any) => (
              <Card key={event.id} $accent="#3b82f633" onClick={() => window.location.href = `/events/${event.id}`}>
                <div style={{ display: "flex", gap: "8px" }}>
                  <Badge $type="event">EVENT</Badge>
                  <div>
                    <div style={{ color: "#fff", fontWeight: 600, fontSize: "13px" }}>{event.title}</div>
                    <div style={{ color: "#a3a3a3", fontSize: "11px" }}>
                      {formatEventTime(new Date(event.startTime))} · {event.participants?.length || 0} going
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {venue.passes?.length > 0 && (
        <div style={{ marginBottom: "24px" }}>
          <SectionHeader title="Available Passes" />
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {venue.passes.map((pass: any) => (
              <Card key={pass.id} onClick={() => window.location.href = "/passes"}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "4px" }}>
                      <Badge $type="pass">PASS</Badge>
                      <span style={{ color: "#fff", fontWeight: 600, fontSize: "13px" }}>{pass.title}</span>
                    </div>
                    <div style={{ color: "#a3a3a3", fontSize: "11px" }}>{pass.benefits.join(" · ")}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ color: "#f59e0b", fontWeight: 700, fontSize: "14px" }}>€{pass.price}</div>
                    {pass.originalPrice && pass.originalPrice > pass.price && (
                      <div style={{ color: "#737373", fontSize: "11px", textDecoration: "line-through" }}>€{pass.originalPrice}</div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
