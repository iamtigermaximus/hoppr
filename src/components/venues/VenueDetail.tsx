"use client";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import styled from "styled-components";
import { useVenue } from "@/hooks/useVenues";
import { useEvents } from "@/hooks/useEvents";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { SectionHeader } from "@/components/ui/SectionHeader";
import CrowdIndicator from "@/components/venues/CrowdIndicator";
import ShareButton from "@/components/ui/ShareButton";
import { formatDistance, formatEventTime } from "@/lib/utils";
import { useGeolocation } from "@/hooks/useGeolocation";
import {
  MapPin, Phone, Globe, Envelope, Clock, Users, CurrencyDollar,
  Star, Wine, InstagramLogo, FacebookLogo, NavigationArrow, X,
} from "@phosphor-icons/react";

const menuCategoryLabels: Record<string, string> = {
  DRINK: "Drinks", FOOD: "Food", SNACK: "Snacks", DESSERT: "Desserts",
  COCKTAIL: "Cocktails", BEER: "Beer", WINE: "Wine", SPIRITS: "Spirits",
  SHOT: "Shots", COFFEE: "Coffee", OTHER: "Other",
};

const typeLabels: Record<string, string> = {
  PUB: "Pub", CLUB: "Club", COCKTAIL_LOUNGE: "Cocktail Lounge",
  SPORTS_BAR: "Sports Bar", KARAOKE_BAR: "Karaoke Bar",
  WINE_BAR: "Wine Bar", BREWERY_TAPROOM: "Brewery Taproom",
  LIVE_MUSIC: "Live Music Venue",
};

const priceLabels: Record<string, string> = {
  BUDGET: "€ · Budget-friendly",
  MODERATE: "€€ · Moderate",
  PREMIUM: "€€€ · Premium",
  LUXURY: "€€€€ · Luxury",
};

const InfoRow = styled.div`
  display: flex; align-items: center; gap: 8px;
  color: var(--color-text-secondary, #a3a3a3); font-size: 13px;
  padding: 6px 0;
`;

const InfoGrid = styled.div`
  display: grid; grid-template-columns: 1fr;
  gap: 4px;
  @media (min-width: 768px) {
    grid-template-columns: 1fr 1fr;
  }
`;

const HoursGrid = styled.div`
  display: flex; flex-direction: column; gap: 2px;
`;

const HourRow = styled.div<{ $today?: boolean }>`
  display: flex; justify-content: space-between;
  padding: 4px 0;
  font-size: 12px;
  color: ${({ $today }) => $today ? "var(--color-text-primary, #fff)" : "var(--color-text-secondary, #a3a3a3)"};
  font-weight: ${({ $today }) => $today ? 600 : 400};
`;

const AmenityBadge = styled.span`
  background: rgba(124,58,237,0.1);
  color: #a78bfa;
  font-size: 11px;
  padding: 4px 10px;
  border-radius: 6px;
  font-weight: 500;
`;

const Divider = styled.div`
  height: 1px; background: var(--color-card-border, #262626);
  margin: 20px 0;
`;

const SectionCard = styled.div`
  background: var(--color-card, #1a1a1a);
  border: 1px solid var(--color-card-border, #262626);
  border-radius: 14px;
  padding: 16px;
  margin-bottom: 16px;
`;

const ClaimModalOverlay = styled.div`
  position: fixed; inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex; align-items: center; justify-content: center;
  z-index: 2000; padding: 16px;
`;

const ClaimModalCard = styled.div`
  background: var(--color-card, #1a1a1a);
  border: 1px solid rgba(124, 58, 237, 0.3);
  border-radius: 16px;
  padding: 24px; width: 100%; max-width: 400px;
  position: relative;
`;

const ClaimModalTitle = styled.h3`
  font-weight: 700; font-size: 16px;
  color: var(--color-text-primary, #fff); margin: 0 0 8px 0;
`;

const ClaimModalSub = styled.p`
  font-size: 12px; color: var(--color-text-secondary, #a3a3a3);
  margin: 0 0 16px 0; line-height: 1.5;
`;

const ClaimInput = styled.input`
  width: 100%; padding: 10px 12px;
  border-radius: 8px; border: 1px solid var(--color-card-border, #262626);
  background: rgba(255,255,255,0.05); color: var(--color-text-primary, #fff);
  font-size: 13px; margin-bottom: 10px;
  &::placeholder { color: #737373; }
  &:focus { outline: none; border-color: #7c3aed; }
`;

const ClaimTextarea = styled.textarea`
  width: 100%; padding: 10px 12px;
  border-radius: 8px; border: 1px solid var(--color-card-border, #262626);
  background: rgba(255,255,255,0.05); color: var(--color-text-primary, #fff);
  font-size: 13px; margin-bottom: 12px; resize: vertical; min-height: 70px;
  font-family: inherit;
  &::placeholder { color: #737373; }
  &:focus { outline: none; border-color: #7c3aed; }
`;

const ClaimSuccess = styled.div`
  text-align: center; padding: 16px 0;
  color: #34d399; font-size: 14px; font-weight: 600;
`;

const ClaimError = styled.div`
  color: #ef4444; font-size: 12px; margin-bottom: 8px;
`;

const CloseButton = styled.button`
  position: absolute; top: 16px; right: 16px;
  background: none; border: none; color: var(--color-text-muted, #737373);
  cursor: pointer; padding: 4px;
  &:hover { color: var(--color-text-primary, #fff); }
`;

export function VenueDetail() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const id = params.id as string;
  const { data: venue, isLoading } = useVenue(id);
  const { lat, lng } = useGeolocation();
  const { data: events = [] } = useEvents();
  const venueEvents = events.filter((e: any) => e.venueId === id);

  // Claim form state
  const [claimOpen, setClaimOpen] = useState(false);
  const [claimRole, setClaimRole] = useState("");
  const [claimPhone, setClaimPhone] = useState("");
  const [claimNotes, setClaimNotes] = useState("");
  const [claimSubmitting, setClaimSubmitting] = useState(false);
  const [claimError, setClaimError] = useState("");
  const [claimSuccess, setClaimSuccess] = useState("");

  if (isLoading) return <div style={{ padding: 16, color: "var(--color-text-muted, #737373)" }}>Loading...</div>;
  if (!venue || venue.error) return <div style={{ padding: 16, color: "#ef4444" }}>Venue not found</div>;

  const menuByCategory = ((venue.menu as any[]) || []).reduce((acc: Record<string, any[]>, item: any) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  const distance = lat && lng
    ? formatDistance(Math.sqrt((venue.lat - lat) ** 2 + (venue.lng - lng) ** 2) * 111.32)
    : null;

  const today = new Date().toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
  const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

  const handleClaimSubmit = async () => {
    setClaimError("");
    setClaimSubmitting(true);
    try {
      const res = await fetch(`/api/venues/${id}/claim`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: claimRole, phone: claimPhone, notes: claimNotes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      setClaimSuccess(data.message || "Claim request submitted. A hoppr admin will reach out soon.");
    } catch (err: any) {
      setClaimError(err.message);
    } finally {
      setClaimSubmitting(false);
    }
  };

  return (
    <div style={{ padding: "16px", maxWidth: "680px", margin: "0 auto" }}>
      {/* Back button */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
        <button onClick={() => router.back()} style={{
          display: "inline-flex", alignItems: "center", gap: "6px",
          color: "var(--color-text-secondary, #a3a3a3)", fontSize: "13px", fontWeight: 500,
          background: "none", border: "none", cursor: "pointer", padding: 0,
        }}>
          ← Back to bars
        </button>
        <ShareButton title={venue.name} text={`${venue.type?.replace(/_/g, " ")} in ${venue.district}`} />
      </div>

      {/* Hero Image */}
      {venue.imageUrl && (
        <div style={{ borderRadius: "16px", overflow: "hidden", height: "200px", marginBottom: "16px", background: "var(--color-card, #1a1a1a)" }}>
          <img src={venue.imageUrl} alt={venue.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: "16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 style={{ fontWeight: 800, fontSize: "24px", color: "var(--color-text-primary, #fff)", marginBottom: "6px" }}>
              {venue.name}
              {venue.isVerified && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: "3px", marginLeft: "8px", background: "rgba(124,58,237,0.12)", color: "#a78bfa", fontSize: "9px", fontWeight: 700, padding: "2px 6px", borderRadius: "4px", verticalAlign: "middle" }}>
                  <Star size={10} weight="fill" /> VERIFIED
                </span>
              )}
            </h1>
            <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
              <Badge $type="event">{typeLabels[venue.type] || venue.type}</Badge>
              {venue.priceRange && (
                <span style={{ color: "var(--color-text-secondary, #a3a3a3)", fontSize: "12px" }}>{priceLabels[venue.priceRange]?.split("·")[0]}</span>
              )}
              {distance && <span style={{ color: "var(--color-text-muted, #737373)", fontSize: "11px" }}>· {distance} away</span>}
            </div>
          </div>
          {venue.crowdLevel ? (
            <div style={{ flexShrink: 0 }}>
              <CrowdIndicator level={venue.crowdLevel} reportedAt={venue.crowdReportedAt} variant="detail" capacity={venue.capacity} />
            </div>
          ) : venue.capacity ? (
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <div style={{ color: "var(--color-text-secondary, #a3a3a3)", fontSize: "10px" }}>Capacity</div>
              <div style={{ color: "var(--color-text-primary, #fff)", fontWeight: 700, fontSize: "18px" }}>{venue.capacity}</div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Description */}
      {venue.description && (
        <SectionCard>
          <p style={{ color: "var(--color-text-secondary, #a3a3a3)", fontSize: "13px", lineHeight: 1.7, margin: 0 }}>{venue.description}</p>
        </SectionCard>
      )}

      {/* Contact & Location */}
      <SectionCard>
        <h3 style={{ color: "var(--color-text-primary, #fff)", fontWeight: 700, fontSize: "14px", marginBottom: "10px" }}>Contact & Location</h3>
        <InfoGrid>
          <InfoRow><MapPin size={16} color="var(--color-text-muted, #737373)" />{venue.address}, {venue.district}, {venue.cityName || "Helsinki"}</InfoRow>
          {venue.website && <InfoRow><Globe size={16} color="var(--color-text-muted, #737373)" /><a href={venue.website} target="_blank" rel="noopener" style={{ color: "#7c3aed", textDecoration: "none" }}>{venue.website.replace("https://", "")}</a></InfoRow>}
          {venue.isVerified && (
            <>
              {venue.phone && <InfoRow><Phone size={16} color="var(--color-text-muted, #737373)" /><a href={`tel:${venue.phone}`} style={{ color: "#7c3aed", textDecoration: "none" }}>{venue.phone}</a></InfoRow>}
              {venue.email && <InfoRow><Envelope size={16} color="var(--color-text-muted, #737373)" /><a href={`mailto:${venue.email}`} style={{ color: "#7c3aed", textDecoration: "none" }}>{venue.email}</a></InfoRow>}
              {venue.instagram && <InfoRow><InstagramLogo size={16} color="var(--color-text-muted, #737373)" /><span>{venue.instagram}</span></InfoRow>}
              {venue.facebook && <InfoRow><FacebookLogo size={16} color="var(--color-text-muted, #737373)" /><span>{venue.facebook}</span></InfoRow>}
            </>
          )}
        </InfoGrid>
        <Button variant="secondary" fullWidth style={{ marginTop: "14px" }} onClick={() => {
          window.open(`https://www.google.com/maps/dir/?api=1&destination=${venue.lat},${venue.lng}`, "_blank");
        }}>
          <NavigationArrow size={16} /> Get Directions
        </Button>
      </SectionCard>

      {/* Opening Hours */}
      {venue.hours && (
        <SectionCard>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
            <Clock size={18} color="#7c3aed" />
            <h3 style={{ color: "var(--color-text-primary, #fff)", fontWeight: 700, fontSize: "14px", margin: 0 }}>Opening Hours</h3>
          </div>
          <HoursGrid>
            {days.map((day) => (
              <HourRow key={day} $today={day === today}>
                <span style={{ textTransform: "capitalize" }}>{day}</span>
                <span>{venue.hours?.[day] || "Closed"}</span>
              </HourRow>
            ))}
          </HoursGrid>
        </SectionCard>
      )}

      {/* Amenities */}
      {venue.amenities && venue.amenities.length > 0 && (
        <SectionCard>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
            <Star size={18} color="#7c3aed" />
            <h3 style={{ color: "var(--color-text-primary, #fff)", fontWeight: 700, fontSize: "14px", margin: 0 }}>Amenities</h3>
          </div>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {venue.amenities.map((a: string) => <AmenityBadge key={a}>{a}</AmenityBadge>)}
          </div>
        </SectionCard>
      )}

      {/* Price + Capacity */}
      {(venue.priceRange || venue.capacity) && (
        <SectionCard>
          <h3 style={{ color: "var(--color-text-primary, #fff)", fontWeight: 700, fontSize: "14px", marginBottom: "8px" }}>Overview</h3>
          <div style={{ display: "flex", gap: "24px" }}>
            {venue.priceRange && (
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <CurrencyDollar size={18} color="var(--color-text-muted, #737373)" />
                <span style={{ color: "var(--color-text-secondary, #a3a3a3)", fontSize: "13px" }}>{priceLabels[venue.priceRange] || venue.priceRange}</span>
              </div>
            )}
            {venue.capacity && (
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <Users size={18} color="var(--color-text-muted, #737373)" />
                <span style={{ color: "var(--color-text-secondary, #a3a3a3)", fontSize: "13px" }}>Up to {venue.capacity} people</span>
              </div>
            )}
          </div>
        </SectionCard>
      )}

      {/* Claim CTA for unclaimed bars */}
      {!venue.isVerified && (
        <>
          <SectionCard style={{ border: "1px solid rgba(124,58,237,0.3)", background: "linear-gradient(135deg, rgba(124,58,237,0.06), rgba(124,58,237,0.02))" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ width: "48px", height: "48px", background: "rgba(124,58,237,0.12)", borderRadius: "24px", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: "10px" }}>
                <Star size={24} color="#a78bfa" weight="fill" />
              </div>
              <h3 style={{ color: "#fff", fontWeight: 700, fontSize: "15px", margin: "0 0 6px" }}>Own this venue?</h3>
              <p style={{ color: "#a3a3a3", fontSize: "12px", lineHeight: 1.6, margin: "0 0 14px" }}>
                Request to claim this listing and a hoppr admin will reach out to help you get set up with promotions, menus, passes, and more.
              </p>
              <Button fullWidth onClick={() => { setClaimOpen(true); setClaimError(""); setClaimSuccess(""); }}>
                Claim this venue
              </Button>
            </div>
          </SectionCard>

          {/* Claim form modal */}
          {claimOpen && (
            <ClaimModalOverlay onClick={() => !claimSubmitting && setClaimOpen(false)}>
              <ClaimModalCard onClick={(e) => e.stopPropagation()}>
                <CloseButton onClick={() => !claimSubmitting && setClaimOpen(false)}>
                  <X size={18} />
                </CloseButton>

                {claimSuccess ? (
                  <ClaimSuccess>
                    <div style={{ fontSize: "32px", marginBottom: "8px" }}>✓</div>
                    {claimSuccess}
                  </ClaimSuccess>
                ) : !session ? (
                  <>
                    <ClaimModalTitle>Claim this venue</ClaimModalTitle>
                    <ClaimModalSub>
                      You need to be logged in to submit a claim request. Sign in or create an account to continue.
                    </ClaimModalSub>
                    <Button fullWidth onClick={() => router.push("/login")}>
                      Sign in
                    </Button>
                  </>
                ) : (
                  <>
                    <ClaimModalTitle>Request to claim {venue.name}</ClaimModalTitle>
                    <ClaimModalSub>
                      Leave your details and a hoppr admin will reach out to verify your ownership and help you get set up.
                    </ClaimModalSub>

                    {claimError && <ClaimError>{claimError}</ClaimError>}

                    <ClaimInput
                      placeholder="Your role at this venue (e.g. Owner, Manager)"
                      value={claimRole}
                      onChange={(e) => setClaimRole(e.target.value)}
                    />
                    <ClaimInput
                      type="tel"
                      placeholder="Phone number"
                      value={claimPhone}
                      onChange={(e) => setClaimPhone(e.target.value)}
                    />
                    <ClaimTextarea
                      placeholder="Anything else the admin should know? (optional)"
                      value={claimNotes}
                      onChange={(e) => setClaimNotes(e.target.value)}
                    />

                    <Button
                      fullWidth
                      disabled={claimSubmitting}
                      onClick={handleClaimSubmit}
                    >
                      {claimSubmitting ? "Submitting..." : "Submit request"}
                    </Button>
                  </>
                )}
              </ClaimModalCard>
            </ClaimModalOverlay>
          )}
        </>
      )}

      <Divider />

      {/* Promotions */}
      {venue.isVerified && venue.promotions?.length > 0 && (
        <div style={{ marginBottom: "24px" }}>
          <SectionHeader title="Active Promotions" />
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {venue.promotions.map((promo: any) => (
              <Card key={promo.id}>
                <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                  <Badge $type="promo">PROMO</Badge>
                  <div>
                    <div style={{ color: "var(--color-text-primary, #fff)", fontWeight: 600, fontSize: "13px" }}>{promo.title}</div>
                    <div style={{ color: "var(--color-text-secondary, #a3a3a3)", fontSize: "11px", marginTop: "2px" }}>{promo.description}</div>
                    <div style={{ color: "var(--color-text-muted, #737373)", fontSize: "10px", marginTop: "4px" }}>
                      {formatEventTime(new Date(promo.validFrom))} — {formatEventTime(new Date(promo.validTo))}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Events at this venue */}
      {venueEvents.length > 0 && (
        <div style={{ marginBottom: "24px" }}>
          <SectionHeader title="Upcoming Events" />
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {venueEvents.map((event: any) => (
              <Card key={event.id} $accent="#3b82f633" onClick={() => window.location.href = `/events/${event.id}`}>
                <div style={{ display: "flex", gap: "8px" }}>
                  <Badge $type="event">EVENT</Badge>
                  <div>
                    <div style={{ color: "var(--color-text-primary, #fff)", fontWeight: 600, fontSize: "13px" }}>{event.title}</div>
                    <div style={{ color: "var(--color-text-secondary, #a3a3a3)", fontSize: "11px" }}>
                      {formatEventTime(new Date(event.startTime))} · {event.participants?.length || 0} going
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Passes */}
      {venue.isVerified && venue.passes?.length > 0 && (
        <div style={{ marginBottom: "24px" }}>
          <SectionHeader title="Available Passes" />
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {venue.passes.map((pass: any) => (
              <Card key={pass.id} onClick={() => window.location.href = "/passes"}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "4px" }}>
                      <Badge $type="pass">PASS</Badge>
                      <span style={{ color: "var(--color-text-primary, #fff)", fontWeight: 600, fontSize: "13px" }}>{pass.title}</span>
                    </div>
                    <div style={{ color: "var(--color-text-secondary, #a3a3a3)", fontSize: "11px" }}>{pass.benefits.join(" · ")}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ color: "#f59e0b", fontWeight: 700, fontSize: "14px" }}>€{pass.price}</div>
                    {pass.originalPrice && pass.originalPrice > pass.price && (
                      <div style={{ color: "var(--color-text-muted, #737373)", fontSize: "11px", textDecoration: "line-through" }}>€{pass.originalPrice}</div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Menu */}
      {venue.isVerified && Object.keys(menuByCategory).length > 0 && (
        <div style={{ marginBottom: "24px" }}>
          <SectionHeader title="Menu" />
          {Object.entries(menuByCategory).map(([category, items]: [string, any[]]) => (
            <div key={category} style={{ marginBottom: "16px" }}>
              <h4 style={{ color: "#7c3aed", fontWeight: 700, fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>
                {menuCategoryLabels[category] || category}
              </h4>
              {items.map((item: any) => (
                <Card key={item.id} style={{ marginBottom: "4px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: "var(--color-text-primary, #fff)", fontWeight: 500, fontSize: "13px" }}>{item.name}</div>
                      {item.description && (
                        <div style={{ color: "var(--color-text-secondary, #a3a3a3)", fontSize: "11px", marginTop: "2px" }}>{item.description}</div>
                      )}
                    </div>
                    <span style={{ color: "#f59e0b", fontWeight: 700, fontSize: "13px", whiteSpace: "nowrap", marginLeft: "12px" }}>
                      €{item.price.toFixed(2)}
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* No data fallback */}
      {!venue.promotions?.length && !venueEvents.length && !venue.passes?.length && !venue.menu?.length && (
        <div style={{ textAlign: "center", padding: "24px", color: "var(--color-text-muted, #737373)", fontSize: "13px" }}>
          <Wine size={32} color="var(--color-text-muted, #737373)" style={{ marginBottom: "8px" }} />
          {venue.isVerified ? (
            <>
              <p>No active promos, events, or passes right now.</p>
              <p style={{ marginTop: "4px", fontSize: "11px" }}>Check back soon or browse the feed for what's happening.</p>
            </>
          ) : (
            <>
              <p>This venue hasn't been claimed yet.</p>
              <p style={{ marginTop: "4px", fontSize: "11px" }}>Once verified, the owner can add promotions, menus, and more.</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
