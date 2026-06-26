"use client";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import styled from "styled-components";
import { Calendar, MapPin, Users, Clock, CheckCircle, Sparkle, Storefront } from "@phosphor-icons/react";
import { useSession } from "next-auth/react";
import { Badge } from "@/components/ui/Badge";
import { AvatarGroup } from "@/components/ui/AvatarGroup";
import { Button } from "@/components/ui/Button";
import { FollowButton } from "@/components/ui/FollowButton";
import CrowdIndicator from "@/components/venues/CrowdIndicator";
import SponsoredBadge from "@/components/ads/SponsoredBadge";
import type { FeedItem } from "@/types/feed";
import { formatDistance, formatEventTime } from "@/lib/utils";

const CardWrapper = styled.div<{ $color: string }>`
  background: var(--color-card, #1a1a1a);
  border: 1px solid var(--color-card-border, #262626);
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  transition: border-color 0.15s;
  display: flex;
  &:hover { border-color: ${({ $color }) => $color}44; }
`;

const CardImage = styled.div`
  width: 120px; min-width: 120px;
  background: #262626;
  position: relative;
  overflow: hidden;
  img { width: 100%; height: 100%; object-fit: cover; position: absolute; inset: 0; }
`;

const CardIconPlaceholder = styled.div<{ $color: string }>`
  width: 100px; min-width: 100px;
  background: linear-gradient(135deg, ${({ $color }) => $color}22, ${({ $color }) => $color}08);
  display: flex; align-items: center; justify-content: center;
`;

const CardBody = styled.div`
  padding: 14px 16px;
  flex: 1; min-width: 0;
  display: flex; flex-direction: column; justify-content: center;
`;

const TopBadge = styled.div`
  position: absolute; top: 8px; left: 8px; z-index: 2;
`;

const TypeLabel = styled.div<{ $color: string }>`
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 9px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.5px;
  color: ${({ $color }) => $color};
  padding: 3px 8px; border-radius: 4px;
  background: ${({ $color }) => $color}15;
  margin-bottom: 6px;
`;

const typeLabels = {
  featured: { label: "FEATURED", icon: Storefront, color: "#a78bfa" },
  event: { label: "EVENT", icon: Calendar, color: "#3b82f6" },
  promotion: { label: "PROMO", icon: MapPin, color: "#10b981" },
};

export function FeedCard({ item }: { item: FeedItem }) {
  const router = useRouter();
  const cardRef = useRef<HTMLDivElement>(null);
  const trackedRef = useRef(false);
  const { data: session } = useSession();
  const userId = (session?.user as any)?.id as string | undefined;
  const t = (typeLabels as Record<string, { label: string; icon: any; color: string }>)[item.type] ?? { label: item.type.toUpperCase(), icon: MapPin, color: "#737373" };
  const color = t.color;
  const IconComponent = t.icon;
  const imageSrc = "image" in item ? (item as any).image : (item as any).imageUrl;
  const isSponsored = item.isSponsored === true;
  const campaignId = (item as any).campaignId as string | undefined;

  const handleClick = () => {
    if (isSponsored && campaignId) {
      fetch(`/api/campaigns/${campaignId}/track`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "click" }),
      }).catch(() => {});
    }
    if (item.type === "featured") router.push(`/venues/${item.venueId}`);
    else if (item.type === "event") router.push(`/events/${item.id}`);
    else if (item.type === "promotion") router.push(`/promotions/${item.id}`);
  };

  // Impression tracking via IntersectionObserver
  useEffect(() => {
    if (!isSponsored || !campaignId || trackedRef.current) return;
    const el = cardRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          trackedRef.current = true;
          observer.disconnect();
          fetch(`/api/campaigns/${campaignId}/track`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "impression" }),
          }).catch(() => {});
        }
      },
      { threshold: 0.5 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [isSponsored, campaignId]);

  // Check user status for this item
  const isEventJoined = item.type === "event" && userId && (item as any).attendees?.some((a: any) => a.id === userId);

  return (
    <CardWrapper $color={color} onClick={handleClick} ref={cardRef}>
      {imageSrc ? (
        <CardImage>
          <img src={imageSrc} alt="" />
          <div style={{ position: "absolute", top: "8px", left: "8px", display: "flex", gap: "6px", zIndex: 2 }}>
            <Badge $type={item.type === "promotion" ? "promo" : item.type}>{t.label}</Badge>
            {isEventJoined && (
              <span style={{ background: "rgba(16,185,129,0.8)", backdropFilter: "blur(4px)", color: "#fff", fontSize: "9px", fontWeight: 700, padding: "3px 8px", borderRadius: "4px", display: "inline-flex", alignItems: "center", gap: "3px" }}>
                <CheckCircle size={10} weight="fill" /> JOINED
              </span>
            )}
          </div>
        </CardImage>
      ) : (
        <CardIconPlaceholder $color={color}>
          <IconComponent size={36} color={color} weight="fill" opacity={0.3} />
        </CardIconPlaceholder>
      )}

      <CardBody>
        {!imageSrc && <TypeLabel $color={color}><IconComponent size={10} weight="fill" />{t.label}</TypeLabel>}

        <div style={{ color: "#fff", fontWeight: 600, fontSize: "14px", marginBottom: "4px", lineHeight: 1.3 }}>
          {item.title}
        </div>

        <div style={{ color: "#a3a3a3", fontSize: "11px", marginBottom: "6px" }}>
          {item.type === "featured" && `${item.venueType?.replace(/_/g, " ") || "Venue"}${(item as any).district ? ` · ${(item as any).district}` : ""}`}
          {item.type === "event" && `${item.venueName} · ${formatEventTime(new Date(item.startTime))}`}
          {item.type === "promotion" && `${item.venueName} · ${formatEventTime(new Date(item.validFrom))}`}
        </div>

        <div style={{ color: "#737373", fontSize: "10px", marginBottom: "6px", display: "inline-flex", alignItems: "center", gap: "3px" }}>
          <MapPin size={10} />{formatDistance(item.distance)}
        </div>

        {/* Crowd indicator */}
        {(item as any).crowdLevel && (
          <div style={{ marginBottom: "4px" }}>
            <CrowdIndicator level={(item as any).crowdLevel} reportedAt={(item as any).crowdReportedAt} variant="badge" />
          </div>
        )}

        {/* Compact follow button */}
        <div style={{ marginBottom: "4px" }}>
          <FollowButton barId={item.venueId} compact />
        </div>

        {/* Sponsored badge */}
        {isSponsored && (
          <div style={{ marginBottom: "4px" }}>
            <SponsoredBadge />
          </div>
        )}

        {/* Recommendation reasons — shown when personalized */}
        {item.recommendationReasons && item.recommendationReasons.length > 0 && (
          <div style={{ display: "flex", gap: "4px", marginBottom: "6px", flexWrap: "wrap" }}>
            {item.recommendationReasons.map((reason, i) => (
              <span
                key={i}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "3px",
                  background: `${color}18`,
                  color: color,
                  fontSize: "9px",
                  fontWeight: 600,
                  padding: "2px 6px",
                  borderRadius: "3px",
                }}
              >
                <Sparkle size={9} weight="fill" />
                {reason}
              </span>
            ))}
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          {item.type === "featured" && (
            <>
              {(item as any).qualityScore != null && (
                <span style={{ color: "#a78bfa", fontSize: "12px", fontWeight: 600 }}>
                  ★ {(item as any).qualityScore} quality
                </span>
              )}
              <Button size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); router.push(`/venues/${item.venueId}`); }}>
                <Storefront size={12} /> Visit
              </Button>
            </>
          )}
          {item.type === "event" && item.attendees && item.attendees.length > 0 ? (
            <AvatarGroup users={item.attendees} max={4} size={24} />
          ) : <div />}

          {item.type === "event" && (
            isEventJoined ? (
              <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", color: "#10b981", fontSize: "12px", fontWeight: 600 }}>
                <CheckCircle size={14} weight="fill" /> Joined
              </span>
            ) : (
              <Button size="sm" onClick={(e) => { e.stopPropagation(); handleClick(); }}><Users size={12} /> Join</Button>
            )
          )}
          {item.type === "promotion" && (
            <Button size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); handleClick(); }}><Clock size={12} /> View</Button>
          )}
        </div>
      </CardBody>
    </CardWrapper>
  );
}
