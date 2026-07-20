"use client";
import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import styled from "styled-components";
import { useVenue } from "@/hooks/useVenues";
import { useEvents } from "@/hooks/useEvents";
import { useCountdown } from "@/hooks/useCountdown";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { SectionHeader } from "@/components/ui/SectionHeader";
import CrowdIndicator from "@/components/venues/CrowdIndicator";
import ShareButton from "@/components/ui/ShareButton";
import SharePrompt from "@/components/ui/SharePrompt";
import { FollowButton } from "@/components/ui/FollowButton";
import { formatDistance, formatEventTime } from "@/lib/utils";
import { SkeletonDetail } from "@/components/ui/Skeleton";
import { useGeolocation } from "@/hooks/useGeolocation";
import { track } from "@/lib/analytics";
import {
  MapPin,
  Phone,
  Globe,
  Envelope,
  Clock,
  Users,
  CurrencyDollar,
  Ticket,
  Star,
  Wine,
  InstagramLogo,
  FacebookLogo,
  NavigationArrow,
  X,
  Fire,
} from "@phosphor-icons/react";

const menuCategoryLabels: Record<string, string> = {
  DRINK: "Drinks",
  FOOD: "Food",
  SNACK: "Snacks",
  DESSERT: "Desserts",
  COCKTAIL: "Cocktails",
  BEER: "Beer",
  WINE: "Wine",
  SPIRITS: "Spirits",
  SHOT: "Shots",
  COFFEE: "Coffee",
  OTHER: "Other",
};

const typeLabels: Record<string, string> = {
  PUB: "Pub",
  CLUB: "Club",
  COCKTAIL_LOUNGE: "Cocktail Lounge",
  SPORTS_BAR: "Sports Bar",
  KARAOKE_BAR: "Karaoke Bar",
  WINE_BAR: "Wine Bar",
  BREWERY_TAPROOM: "Brewery Taproom",
  LIVE_MUSIC: "Live Music Venue",
};

const priceLabels: Record<string, string> = {
  BUDGET: "€ · Budget-friendly",
  MODERATE: "€€ · Moderate",
  PREMIUM: "€€€ · Premium",
  LUXURY: "€€€€ · Luxury",
};

const InfoRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--color-text-secondary, #a3a3a3);
  font-size: 13px;
  padding: 6px 0;
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 4px;
  @media (min-width: 768px) {
    grid-template-columns: 1fr 1fr;
  }
`;

const HoursGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const HourRow = styled.div<{ $today?: boolean }>`
  display: flex;
  justify-content: space-between;
  padding: 4px 0;
  font-size: 12px;
  color: ${({ $today }) =>
    $today
      ? "var(--color-text-primary, #fff)"
      : "var(--color-text-secondary, #a3a3a3)"};
  font-weight: ${({ $today }) => ($today ? 600 : 400)};
`;

const AmenityBadge = styled.span`
  background: rgba(124, 58, 237, 0.1);
  color: #a78bfa;
  font-size: 11px;
  padding: 4px 10px;
  border-radius: 6px;
  font-weight: 500;
`;

const Divider = styled.div`
  height: 1px;
  background: var(--color-card-border, #262626);
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
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 16px;
`;

const ClaimModalCard = styled.div`
  background: var(--color-card, #1a1a1a);
  border: 1px solid rgba(124, 58, 237, 0.3);
  border-radius: 16px;
  padding: 24px;
  width: 100%;
  max-width: 400px;
  position: relative;
`;

const ClaimModalTitle = styled.h3`
  font-weight: 700;
  font-size: 16px;
  color: var(--color-text-primary, #fff);
  margin: 0 0 8px 0;
`;

const ClaimModalSub = styled.p`
  font-size: 12px;
  color: var(--color-text-secondary, #a3a3a3);
  margin: 0 0 16px 0;
  line-height: 1.5;
`;

const ClaimInput = styled.input`
  width: 100%;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid var(--color-card-border, #262626);
  background: rgba(255, 255, 255, 0.05);
  color: var(--color-text-primary, #fff);
  font-size: 13px;
  margin-bottom: 10px;
  &::placeholder {
    color: #737373;
  }
  &:focus {
    outline: none;
    border-color: #7c3aed;
  }
`;

const ClaimTextarea = styled.textarea`
  width: 100%;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid var(--color-card-border, #262626);
  background: rgba(255, 255, 255, 0.05);
  color: var(--color-text-primary, #fff);
  font-size: 13px;
  margin-bottom: 12px;
  resize: vertical;
  min-height: 70px;
  font-family: inherit;
  &::placeholder {
    color: #737373;
  }
  &:focus {
    outline: none;
    border-color: #7c3aed;
  }
`;

const ClaimSuccess = styled.div`
  text-align: center;
  padding: 16px 0;
  color: #34d399;
  font-size: 14px;
  font-weight: 600;
`;

const ClaimError = styled.div`
  color: #ef4444;
  font-size: 12px;
  margin-bottom: 8px;
`;

const FileDropZone = styled.label`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 16px;
  border: 2px dashed rgba(124, 58, 237, 0.3);
  border-radius: 10px;
  background: rgba(124, 58, 237, 0.04);
  cursor: pointer;
  margin-bottom: 10px;
  transition: border-color 0.2s, background 0.2s;
  &:hover {
    border-color: rgba(124, 58, 237, 0.6);
    background: rgba(124, 58, 237, 0.08);
  }
`;

const FileDropIcon = styled.div`
  color: #7c3aed;
  font-size: 24px;
`;

const FileDropText = styled.div`
  color: var(--color-text-secondary, #a3a3a3);
  font-size: 12px;
  text-align: center;
`;

const FileDropHint = styled.div`
  color: var(--color-text-muted, #737373);
  font-size: 10px;
`;

const FileList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 10px;
`;

const FileChip = styled.div<{ $error?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 6px 10px;
  border-radius: 6px;
  background: ${({ $error }) =>
    $error ? "rgba(239, 68, 68, 0.1)" : "rgba(124, 58, 237, 0.08)"};
  font-size: 11px;
  color: ${({ $error }) => ($error ? "#ef4444" : "#a78bfa")};
`;

const FileChipName = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
`;

const FileChipRemove = styled.button`
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  padding: 0;
  font-size: 14px;
  line-height: 1;
  opacity: 0.6;
  &:hover {
    opacity: 1;
  }
`;

const GuidanceBox = styled.div`
  background: rgba(124, 58, 237, 0.06);
  border: 1px solid rgba(124, 58, 237, 0.15);
  border-radius: 8px;
  padding: 10px 12px;
  margin-bottom: 12px;
  font-size: 11px;
  color: var(--color-text-secondary, #a3a3a3);
  line-height: 1.5;
`;

const GuidanceTitle = styled.div`
  color: #a78bfa;
  font-weight: 600;
  font-size: 12px;
  margin-bottom: 4px;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 16px;
  right: 16px;
  background: none;
  border: none;
  color: var(--color-text-muted, #737373);
  cursor: pointer;
  padding: 4px;
  &:hover {
    color: var(--color-text-primary, #fff);
  }
`;

// Per-promo card with countdown, redemptions, and share
function PromoDetailCard({ promo }: { promo: any }) {
  const countdown = useCountdown(promo.validTo);

  // Track promo view when card renders on the venue detail
  useEffect(() => {
    track({
      type: "PROMO_VIEW",
      barId: promo.venueId,
      promoId: promo.id,
      promoName: promo.title,
    });
  }, [promo.id, promo.title, promo.venueId]);

  return (
    <Card>
      <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
        <Badge $type="promo">PROMO</Badge>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
            <div
              style={{
                color: "var(--color-text-primary, #fff)",
                fontWeight: 600,
                fontSize: "13px",
              }}
            >
              {promo.title}
            </div>
            <ShareButton
              title={promo.title}
              text={`${promo.description || ""}\n${promo.venueName}`}
              url={`${typeof window !== "undefined" ? window.location.origin : ""}/venues/${promo.venueId}`}
              size={14}
              color="var(--color-text-muted, #737373)"
            />
          </div>
          <div
            style={{
              color: "var(--color-text-secondary, #a3a3a3)",
              fontSize: "11px",
              marginTop: "2px",
            }}
          >
            {promo.description}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              color: "var(--color-text-muted, #737373)",
              fontSize: "10px",
              marginTop: "4px",
            }}
          >
            <span>
              {formatEventTime(new Date(promo.validFrom))} —{" "}
              {formatEventTime(new Date(promo.validTo))}
            </span>
            {countdown && countdown !== "Ended" && (
              <span style={{ color: "#f59e0b", fontWeight: 600 }}>⏰ {countdown}</span>
            )}
            {promo.redemptions > 0 && (
              <span style={{ color: "#f59e0b", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "2px" }}>
                <Fire size={10} weight="fill" /> {promo.redemptions} claimed
              </span>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

export function VenueDetail() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const id = params.id as string;
  const { data: venue, isLoading } = useVenue(id);
  const { lat, lng } = useGeolocation();
  const { data: events = [] } = useEvents();
  const venueEvents = events.filter((e: any) => e.venueId === id);

  // Fetch brand post for this bar
  const { data: campaigns = [] } = useQuery<any[]>({
    queryKey: ["campaigns", "venue", id],
    queryFn: () => fetch("/api/campaigns").then((r) => r.json()),
    enabled: !!id,
  });
  const brandPost = useMemo(() => {
    return (campaigns as any[]).find(
      (c: any) => c.type === "BRAND_POST" && c.barId === id,
    ) || null;
  }, [campaigns, id]);

  // Claim form state
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const [claimOpen, setClaimOpen] = useState(false);
  const [claimName, setClaimName] = useState("");
  const [claimEmail, setClaimEmail] = useState("");
  const [claimRole, setClaimRole] = useState("");
  const [claimPhone, setClaimPhone] = useState("");
  const [claimNotes, setClaimNotes] = useState("");
  const [claimSubmitting, setClaimSubmitting] = useState(false);
  const [claimError, setClaimError] = useState("");
  const [claimSuccess, setClaimSuccess] = useState("");
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);

  // Track page view — drops a pebble, never blocks
  useEffect(() => {
    track({ type: "BAR_VIEW", barId: id });
  }, [id]);

  // Track brand post view when the brand section renders
  useEffect(() => {
    if (brandPost?.id) {
      track({ type: "BRAND_POST_VIEW", barId: id, promoId: brandPost.id });
    }
  }, [brandPost?.id, id]);

  if (isLoading) return <SkeletonDetail />;
  if (!venue || venue.error)
    return <div style={{ padding: 16, color: "#ef4444" }}>Venue not found</div>;

  const menuByCategory = ((venue.menu as any[]) || []).reduce(
    (acc: Record<string, any[]>, item: any) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    },
    {},
  );

  const distance =
    lat && lng
      ? formatDistance(
          Math.sqrt((venue.lat - lat) ** 2 + (venue.lng - lng) ** 2) * 111.32,
        )
      : null;

  const today = new Date()
    .toLocaleDateString("en-US", { weekday: "long" })
    .toLowerCase();
  const days = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ];

  const handleClaimSubmit = async () => {
    setClaimError("");
    setClaimSubmitting(true);
    try {
      // Step 1: Upload any attached documents
      let documentUrls: string[] = [];
      if (uploadFiles.length > 0) {
        setUploadingFiles(true);
        const uploadResults = await Promise.allSettled(
          uploadFiles.map(async (file) => {
            const formData = new FormData();
            formData.append("file", file);
            const res = await fetch("/api/upload", {
              method: "POST",
              body: formData,
            });
            if (!res.ok) {
              const err = await res.json().catch(() => ({}));
              throw new Error(err.error || `Failed to upload ${file.name}`);
            }
            const data = await res.json();
            return data.url as string;
          }),
        );
        setUploadingFiles(false);

        // Collect successful uploads and report failures
        const failed: string[] = [];
        uploadResults.forEach((r, i) => {
          if (r.status === "fulfilled") {
            documentUrls.push(r.value);
          } else {
            failed.push(uploadFiles[i].name);
          }
        });
        if (failed.length > 0) {
          throw new Error(
            `Failed to upload: ${failed.join(", ")}. Please try again.`,
          );
        }
      }

      // Step 2: Submit the claim
      const res = await fetch(`/api/venues/${id}/claim`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: claimName,
          email: claimEmail,
          role: claimRole,
          phone: claimPhone,
          notes: claimNotes,
          documentUrls,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      setClaimSuccess(
        data.message ||
          "Claim request submitted. A hoppr admin will reach out soon.",
      );
    } catch (err: any) {
      setClaimError(err.message);
    } finally {
      setClaimSubmitting(false);
    }
  };

  return (
    <div style={{ padding: "16px", maxWidth: "680px", margin: "0 auto" }}>
      {/* Back button */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "12px",
        }}
      >
        <button
          onClick={() => router.back()}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            color: "var(--color-text-secondary, #a3a3a3)",
            fontSize: "13px",
            fontWeight: 500,
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 0,
          }}
        >
          ← Back to bars
        </button>
        <ShareButton
          title={venue.name}
          text={`${venue.type?.replace(/_/g, " ")} in ${venue.district}`}
        />
      </div>

      {/* Hero Image */}
      {venue.imageUrl && (
        <div
          style={{
            borderRadius: "16px",
            overflow: "hidden",
            height: "200px",
            marginBottom: "8px",
            background: "var(--color-card, #1a1a1a)",
          }}
        >
          <img
            src={selectedImage ?? venue.imageUrl}
            alt={venue.name}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </div>
      )}

      {/* Photo gallery strip — horizontal scroll */}
      {venue.imageUrls?.length > 1 && (
        <div
          style={{
            display: "flex",
            gap: "8px",
            overflowX: "auto",
            scrollSnapType: "x mandatory",
            paddingBottom: "8px",
            marginBottom: "16px",
            WebkitOverflowScrolling: "touch",
          }}
        >
          {venue.imageUrls.map((url: string, i: number) => (
            <div
              key={i}
              onClick={() => setSelectedImage(url)}
              style={{
                minWidth: "100px",
                height: "72px",
                borderRadius: "10px",
                overflow: "hidden",
                scrollSnapAlign: "start",
                cursor: "pointer",
                border: "2px solid var(--color-card-border, #262626)",
                flexShrink: 0,
              }}
            >
              <img
                src={url}
                alt=""
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                loading="lazy"
              />
            </div>
          ))}
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: "16px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <div>
            <h1
              style={{
                fontWeight: 800,
                fontSize: "24px",
                color: "var(--color-text-primary, #fff)",
                marginBottom: "6px",
              }}
            >
              {venue.name}
              {venue.isVerified && (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "3px",
                    marginLeft: "8px",
                    background: "rgba(124,58,237,0.12)",
                    color: "#a78bfa",
                    fontSize: "9px",
                    fontWeight: 700,
                    padding: "2px 6px",
                    borderRadius: "4px",
                    verticalAlign: "middle",
                  }}
                >
                  <Star size={10} weight="fill" /> VERIFIED
                </span>
              )}
            </h1>
            <div
              style={{
                display: "flex",
                gap: "8px",
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <Badge $type="event">
                {typeLabels[venue.type] || venue.type}
              </Badge>
              {venue.priceRange && (
                <span
                  style={{
                    color: "var(--color-text-secondary, #a3a3a3)",
                    fontSize: "12px",
                  }}
                >
                  {priceLabels[venue.priceRange]?.split("·")[0]}
                </span>
              )}
              {venue.musicTags?.length > 0 && venue.musicTags.map((tag: string) => (
                <span
                  key={tag}
                  style={{
                    background: "rgba(99,102,241,0.15)",
                    color: "#a5b4fc",
                    fontSize: "10px",
                    fontWeight: 600,
                    padding: "2px 8px",
                    borderRadius: "4px",
                  }}
                >
                  {tag}
                </span>
              ))}
              <FollowButton
                barId={venue.id}
                initialFollowerCount={venue.followerCount}
                initialIsFollowing={venue.isFollowing}
              />
              {distance && (
                <span
                  style={{
                    color: "var(--color-text-muted, #737373)",
                    fontSize: "11px",
                  }}
                >
                  · {distance} away
                </span>
              )}
            </div>
          </div>
          {venue.crowdLevel ? (
            <div style={{ flexShrink: 0 }}>
              <CrowdIndicator
                level={venue.crowdLevel}
                reportedAt={venue.crowdReportedAt}
                variant="detail"
                capacity={venue.capacity}
              />
            </div>
          ) : venue.capacity ? (
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <div
                style={{
                  color: "var(--color-text-secondary, #a3a3a3)",
                  fontSize: "10px",
                }}
              >
                Capacity
              </div>
              <div
                style={{
                  color: "var(--color-text-primary, #fff)",
                  fontWeight: 700,
                  fontSize: "18px",
                }}
              >
                {venue.capacity}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Brand identity — captured social card image with text already baked in */}
      {brandPost && brandPost.imageUrl && (
        <SectionCard
          style={{
            background: "transparent",
            border: "none",
            borderRadius: "14px",
            padding: 0,
            overflow: "hidden",
          }}
        >
          <img
            src={brandPost.imageUrl}
            alt={brandPost.title || "Brand content"}
            onClick={() => setSelectedImage(brandPost.imageUrl!)}
            style={{
              width: "100%",
              display: "block",
              borderRadius: "14px",
              cursor: "pointer",
            }}
          />
        </SectionCard>
      )}

      {/* Share prompt — bars thrive on word of mouth */}
      <SharePrompt
        storageKey={`venue_${id}`}
        headline={`Know someone who'd love ${venue.name}? Share it!`}
        subtitle={`Spread the word — ${venue.name} is on Hoppr.`}
        shareTitle={venue.name}
        shareText={`Check out ${venue.name}${venue.district ? ` in ${venue.district}` : ""} on Hoppr!`}
      />

      {/* Description */}
      {venue.description && (
        <SectionCard>
          <p
            style={{
              color: "var(--color-text-secondary, #a3a3a3)",
              fontSize: "13px",
              lineHeight: 1.7,
              margin: 0,
            }}
          >
            {venue.description}
          </p>
        </SectionCard>
      )}

      {/* Contact & Location */}
      <SectionCard>
        <h3
          style={{
            color: "var(--color-text-primary, #fff)",
            fontWeight: 700,
            fontSize: "14px",
            marginBottom: "10px",
          }}
        >
          Contact & Location
        </h3>
        <InfoGrid>
          <InfoRow>
            <MapPin size={16} color="var(--color-text-muted, #737373)" />
            {venue.address}, {venue.district}, {venue.cityName || "Helsinki"}
          </InfoRow>
          {venue.website && (
            <InfoRow>
              <Globe size={16} color="var(--color-text-muted, #737373)" />
              <a
                href={venue.website}
                target="_blank"
                rel="noopener"
                style={{ color: "#7c3aed", textDecoration: "none" }}
                onClick={() => track({ type: "BAR_WEBSITE", barId: id })}
              >
                {venue.website.replace("https://", "")}
              </a>
            </InfoRow>
          )}
          {venue.phone && (
            <InfoRow>
              <Phone size={16} color="var(--color-text-muted, #737373)" />
              <a
                href={`tel:${venue.phone}`}
                style={{ color: "#7c3aed", textDecoration: "none" }}
                onClick={() => track({ type: "BAR_CALL", barId: id })}
              >
                {venue.phone}
              </a>
            </InfoRow>
          )}
          {venue.email && (
            <InfoRow>
              <Envelope
                size={16}
                color="var(--color-text-muted, #737373)"
              />
              <a
                href={`mailto:${venue.email}`}
                style={{ color: "#7c3aed", textDecoration: "none" }}
              >
                {venue.email}
              </a>
            </InfoRow>
          )}
          {venue.instagram && (
            <InfoRow>
              <InstagramLogo
                size={16}
                color="var(--color-text-muted, #737373)"
              />
              <span>{venue.instagram}</span>
            </InfoRow>
          )}
          {venue.facebook && (
            <InfoRow>
              <FacebookLogo
                size={16}
                color="var(--color-text-muted, #737373)"
              />
              <span>{venue.facebook}</span>
            </InfoRow>
          )}
        </InfoGrid>
        <Button
          variant="secondary"
          fullWidth
          style={{ marginTop: "14px" }}
          onClick={() => {
            track({ type: "BAR_DIRECTION", barId: id });
            window.open(
              `https://www.google.com/maps/dir/?api=1&destination=${venue.lat},${venue.lng}`,
              "_blank",
            );
          }}
        >
          <NavigationArrow size={16} /> Get Directions
        </Button>
      </SectionCard>

      {/* Opening Hours — always shown, with fallback when data is missing */}
      <SectionCard>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "10px",
          }}
        >
          <Clock size={18} color="#7c3aed" />
          <h3
            style={{
              color: "var(--color-text-primary, #fff)",
              fontWeight: 700,
              fontSize: "14px",
              margin: 0,
            }}
          >
            Opening Hours
          </h3>
        </div>

        {venue.hoursArePlaceholder && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 12px",
              marginBottom: "10px",
              borderRadius: "8px",
              background: "rgba(245, 158, 11, 0.1)",
              border: "1px solid rgba(245, 158, 11, 0.25)",
              color: "#f59e0b",
              fontSize: "12px",
              fontWeight: 500,
            }}
          >
            <span style={{ fontSize: "14px", lineHeight: 1 }}>&#9888;</span>
            <span>
              This venue hasn&apos;t been claimed or verified yet, so opening
              hours are an estimate and may not be accurate.
            </span>
          </div>
        )}

        <HoursGrid>
          {days.map((day) => {
            const entry = venue.hours?.[day] || "Closed";
            const isClosed = entry === "Closed";
            return (
              <HourRow key={day} $today={day === today}>
                <span style={{ textTransform: "capitalize" }}>{day}</span>
                <span
                  style={{
                    color: isClosed
                      ? "var(--color-text-muted, #737373)"
                      : undefined,
                  }}
                >
                  {entry}
                </span>
              </HourRow>
            );
          })}
        </HoursGrid>
      </SectionCard>

      {/* Amenities */}
      {venue.amenities && venue.amenities.length > 0 && (
        <SectionCard>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "10px",
            }}
          >
            <Star size={18} color="#7c3aed" />
            <h3
              style={{
                color: "var(--color-text-primary, #fff)",
                fontWeight: 700,
                fontSize: "14px",
                margin: 0,
              }}
            >
              Amenities
            </h3>
          </div>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {venue.amenities.map((a: string) => (
              <AmenityBadge key={a}>{a}</AmenityBadge>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Price + Capacity + Cover */}
      {(venue.priceRange || venue.capacity || venue.coverCharge != null) && (
        <SectionCard>
          <h3
            style={{
              color: "var(--color-text-primary, #fff)",
              fontWeight: 700,
              fontSize: "14px",
              marginBottom: "8px",
            }}
          >
            Overview
          </h3>
          <div style={{ display: "flex", gap: "24px" }}>
            {venue.priceRange && (
              <div
                style={{ display: "flex", alignItems: "center", gap: "6px" }}
              >
                <CurrencyDollar
                  size={18}
                  color="var(--color-text-muted, #737373)"
                />
                <span
                  style={{
                    color: "var(--color-text-secondary, #a3a3a3)",
                    fontSize: "13px",
                  }}
                >
                  {priceLabels[venue.priceRange] || venue.priceRange}
                </span>
              </div>
            )}
            {venue.coverCharge != null && (
              <div
                style={{ display: "flex", alignItems: "center", gap: "6px" }}
              >
                <Ticket size={18} color="var(--color-text-muted, #737373)" />
                <span
                  style={{
                    color: "var(--color-text-secondary, #a3a3a3)",
                    fontSize: "13px",
                  }}
                >
                  {venue.coverCharge === 0 ? "Free entry" : `Entry: €${venue.coverCharge}`}
                </span>
              </div>
            )}
            {venue.capacity && (
              <div
                style={{ display: "flex", alignItems: "center", gap: "6px" }}
              >
                <Users size={18} color="var(--color-text-muted, #737373)" />
                <span
                  style={{
                    color: "var(--color-text-secondary, #a3a3a3)",
                    fontSize: "13px",
                  }}
                >
                  Up to {venue.capacity} people
                </span>
              </div>
            )}
          </div>
        </SectionCard>
      )}

      {/* Claim CTA for unclaimed bars */}
      {!venue.isVerified && (
        <>
          <SectionCard
            style={{
              border: "1px solid rgba(124,58,237,0.3)",
              background:
                "linear-gradient(135deg, rgba(124,58,237,0.06), rgba(124,58,237,0.02))",
            }}
          >
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  background: "rgba(124,58,237,0.12)",
                  borderRadius: "24px",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "10px",
                }}
              >
                <Star size={24} color="#a78bfa" weight="fill" />
              </div>
              <h3
                style={{
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: "15px",
                  margin: "0 0 6px",
                }}
              >
                Own this venue?
              </h3>
              <p
                style={{
                  color: "#a3a3a3",
                  fontSize: "12px",
                  lineHeight: 1.6,
                  margin: "0 0 14px",
                }}
              >
                Request to claim this listing and a hoppr admin will reach out
                to help you get set up with promotions, menus, and more.
              </p>
              <Button
                fullWidth
                onClick={() => {
                  setClaimOpen(true);
                  setClaimError("");
                  setClaimSuccess("");
                }}
              >
                Claim this venue
              </Button>
            </div>
          </SectionCard>

          {/* Claim form modal */}
          {claimOpen && (
            <ClaimModalOverlay
              onClick={() => !claimSubmitting && setClaimOpen(false)}
            >
              <ClaimModalCard onClick={(e) => e.stopPropagation()}>
                <CloseButton
                  onClick={() => !claimSubmitting && setClaimOpen(false)}
                >
                  <X size={18} />
                </CloseButton>

                {claimSuccess ? (
                  <ClaimSuccess>
                    <div style={{ fontSize: "32px", marginBottom: "8px" }}>
                      ✓
                    </div>
                    {claimSuccess}
                  </ClaimSuccess>
                ) : !session ? (
                  <>
                    <ClaimModalTitle>Claim this venue</ClaimModalTitle>
                    <ClaimModalSub>
                      You need to be logged in to submit a claim request. Sign
                      in or create an account to continue.
                    </ClaimModalSub>
                    <Button fullWidth onClick={() => router.push("/login")}>
                      Sign in
                    </Button>
                  </>
                ) : (
                  <>
                    <ClaimModalTitle>
                      Request to claim {venue.name}
                    </ClaimModalTitle>
                    <ClaimModalSub>
                      Leave your details and a hoppr admin will reach out to
                      verify your ownership and help you get set up.
                    </ClaimModalSub>

                    {claimError && <ClaimError>{claimError}</ClaimError>}

                    <ClaimInput
                      placeholder="Your full name"
                      value={claimName}
                      onChange={(e) => setClaimName(e.target.value)}
                    />
                    <ClaimInput
                      type="email"
                      placeholder="Contact email (e.g. your bar's business email)"
                      value={claimEmail}
                      onChange={(e) => setClaimEmail(e.target.value)}
                    />
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

                    {/* Document upload */}
                    <GuidanceBox>
                      <GuidanceTitle>
                        Verification documents (optional but recommended)
                      </GuidanceTitle>
                      Uploading proof of ownership or affiliation helps us verify
                      your claim faster. Accepted documents include:
                      <br />• Business license or registration certificate
                      <br />• Government-issued photo ID
                      <br />• Utility bill or lease agreement for the venue
                      <br />• Any other document linking you to this business
                    </GuidanceBox>

                    <FileDropZone>
                      <FileDropIcon>📎</FileDropIcon>
                      <FileDropText>
                        Click to attach documents
                      </FileDropText>
                      <FileDropHint>
                        JPEG, PNG, PDF · max 10MB each
                      </FileDropHint>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,application/pdf"
                        multiple
                        style={{ display: "none" }}
                        onChange={(e) => {
                          const files = Array.from(e.target.files || []);
                          // Filter out files over 10MB
                          const valid = files.filter(
                            (f) => f.size <= 10 * 1024 * 1024,
                          );
                          if (valid.length < files.length) {
                            setClaimError(
                              "Some files were too large (max 10MB each).",
                            );
                          }
                          setUploadFiles((prev) => [...prev, ...valid]);
                          // Reset the input so the same file can be re-selected
                          e.target.value = "";
                        }}
                      />
                    </FileDropZone>

                    {uploadFiles.length > 0 && (
                      <FileList>
                        {uploadFiles.map((file, i) => (
                          <FileChip key={`${file.name}-${i}`}>
                            <FileChipName>{file.name}</FileChipName>
                            <FileChipRemove
                              type="button"
                              onClick={() =>
                                setUploadFiles((prev) =>
                                  prev.filter((_, j) => j !== i),
                                )
                              }
                              aria-label={`Remove ${file.name}`}
                            >
                              <X size={12} />
                            </FileChipRemove>
                          </FileChip>
                        ))}
                      </FileList>
                    )}

                    <Button
                      fullWidth
                      disabled={claimSubmitting}
                      onClick={handleClaimSubmit}
                    >
                      {claimSubmitting
                        ? uploadingFiles
                          ? "Uploading documents..."
                          : "Submitting..."
                        : "Submit request"}
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
              <PromoDetailCard key={promo.id} promo={promo} />
            ))}
          </div>
        </div>
      )}

      {/* Events at this venue — only when claimed */}
      {venue.isVerified && venueEvents.length > 0 && (
        <div style={{ marginBottom: "24px" }}>
          <SectionHeader title="Upcoming Events" />
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {venueEvents.map((event: any) => (
              <Card
                key={event.id}
                $accent="#3b82f633"
                onClick={() => (window.location.href = `/events/${event.id}`)}
              >
                <div style={{ display: "flex", gap: "8px" }}>
                  <Badge $type="event">EVENT</Badge>
                  <div>
                    <div
                      style={{
                        color: "var(--color-text-primary, #fff)",
                        fontWeight: 600,
                        fontSize: "13px",
                      }}
                    >
                      {event.title}
                    </div>
                    <div
                      style={{
                        color: "var(--color-text-secondary, #a3a3a3)",
                        fontSize: "11px",
                      }}
                    >
                      {formatEventTime(new Date(event.startTime))} ·{" "}
                      {event.participants?.length || 0} going
                    </div>
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
          {Object.entries(menuByCategory).map(
            ([category, items]: [string, any[]]) => (
              <div key={category} style={{ marginBottom: "16px" }}>
                <h4
                  style={{
                    color: "#7c3aed",
                    fontWeight: 700,
                    fontSize: "12px",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    marginBottom: "8px",
                  }}
                >
                  {menuCategoryLabels[category] || category}
                </h4>
                {items.map((item: any) => (
                  <Card key={item.id} style={{ marginBottom: "4px" }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            color: "var(--color-text-primary, #fff)",
                            fontWeight: 500,
                            fontSize: "13px",
                          }}
                        >
                          {item.name}
                        </div>
                        {item.description && (
                          <div
                            style={{
                              color: "var(--color-text-secondary, #a3a3a3)",
                              fontSize: "11px",
                              marginTop: "2px",
                            }}
                          >
                            {item.description}
                          </div>
                        )}
                      </div>
                      <span
                        style={{
                          color: "#f59e0b",
                          fontWeight: 700,
                          fontSize: "13px",
                          whiteSpace: "nowrap",
                          marginLeft: "12px",
                        }}
                      >
                        €{item.price.toFixed(2)}
                      </span>
                    </div>
                  </Card>
                ))}
              </div>
            ),
          )}
        </div>
      )}

      {/* No data fallback */}
      {!venue.promotions?.length &&
        !venueEvents.length &&
        !venue.menu?.length && (
          <div
            style={{
              textAlign: "center",
              padding: "24px",
              color: "var(--color-text-muted, #737373)",
              fontSize: "13px",
            }}
          >
            <Wine
              size={32}
              color="var(--color-text-muted, #737373)"
              style={{ marginBottom: "8px" }}
            />
            {venue.isVerified ? (
              <>
                <p>No active promos, events, or menu items yet.</p>
                <p style={{ marginTop: "4px", fontSize: "11px" }}>
                  Check back soon or browse the feed for what's happening.
                </p>
              </>
            ) : (
              <>
                <p>This venue hasn&apos;t been claimed yet.</p>
                <p style={{ marginTop: "4px", fontSize: "11px" }}>
                  Once claimed, the owner can post events, promotions, and
                  menus.
                </p>
              </>
            )}
          </div>
        )}
    </div>
  );
}
