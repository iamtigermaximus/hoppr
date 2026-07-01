"use client";
import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import styled from "styled-components";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SkeletonDetail } from "@/components/ui/Skeleton";
import { formatDistance, formatEventTime } from "@/lib/utils";
import { MapPin, Clock, Calendar, ArrowLeft, NavigationArrow, Fire } from "@phosphor-icons/react";
import ShareButton from "@/components/ui/ShareButton";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useQuery } from "@tanstack/react-query";
import { markEligibleForPushOptIn } from "@/lib/push-eligibility";

const Hero = styled.div<{ $imageUrl?: string }>`
  border-radius: 20px; overflow: hidden; height: 220px; position: relative; margin-bottom: 20px;
  ${({ $imageUrl }) => $imageUrl && `
    background-image: url(${$imageUrl});
    background-size: cover;
    background-position: center;
    &::before {
      content: "";
      position: absolute;
      inset: 0;
      background: rgba(0,0,0,0.55);
      border-radius: 20px;
    }
  `}
`;
const Content = styled.div`padding: 0 4px;`;

const InfoCard = styled.div`
  background: #1a1a1a; border: 1px solid #262626;
  border-radius: 14px; padding: 16px; margin-bottom: 12px;
`;

const InfoRow = styled.div`
  display: flex; align-items: center; gap: 10px;
  padding: 8px 0; color: #a3a3a3; font-size: 13px;
`;

export default function PromotionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { lat, lng } = useGeolocation();
  const id = params.id as string;

  const { data: promo, isLoading } = useQuery<any>({
    queryKey: ["promotion", id],
    queryFn: () => fetch(`/api/promotions?id=${id}`).then((r) => r.json()),
    enabled: !!id,
  });

  // Viewing a promotion detail is meaningful engagement — signal eligibility
  // for the push notification opt-in banner (shown later, not here).
  useEffect(() => {
    if (promo && !promo.error) {
      markEligibleForPushOptIn();
    }
  }, [promo]);

  if (isLoading) return <SkeletonDetail />;
  if (!promo || promo.error) return <div style={{ padding: 32, textAlign: "center", color: "#ef4444" }}>Promotion not found</div>;

  const distance = promo.venueLat != null && promo.venueLng != null && lat && lng
    ? Math.sqrt((promo.venueLat - lat) ** 2 + (promo.venueLng - lng) ** 2) * 111.32
    : null;

  const isActive = new Date(promo.validFrom) <= new Date() && new Date(promo.validTo) >= new Date();

  return (
    <div style={{ padding: "16px", maxWidth: "680px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
        <button onClick={() => router.back()} style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "#a3a3a3", fontSize: "13px", fontWeight: 500, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
          <ArrowLeft size={16} /> Back
        </button>
        <ShareButton title={promo.title} text={promo.description} />
      </div>

      <Hero $imageUrl={promo.imageUrl} style={{ background: promo.imageUrl ? undefined : `linear-gradient(135deg, ${promo.accentColor || "#1a0533"}, ${promo.accentColor ? promo.accentColor + "88" : "#0a0a0a"})` }}>
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "24px", background: "linear-gradient(transparent, rgba(0,0,0,0.9))", zIndex: 1 }}>
          <div style={{ display: "flex", gap: "6px", marginBottom: "8px" }}>
            <Badge $type="featured">PROMOTION</Badge>
            {isActive && <Badge $type="promo">ACTIVE</Badge>}
            {!isActive && <Badge $type="promo">{new Date(promo.validFrom) > new Date() ? "UPCOMING" : "ENDED"}</Badge>}
          </div>
          <h1 style={{ fontWeight: 800, fontSize: "24px", color: "#fff", margin: 0, lineHeight: 1.2 }}>{promo.title}</h1>
        </div>
      </Hero>

      <Content>
        <InfoCard>
          <h3 style={{ color: "#fff", fontWeight: 700, fontSize: "14px", marginBottom: "10px" }}>About this promotion</h3>
          <p style={{ color: "#a3a3a3", fontSize: "13px", lineHeight: 1.7, margin: 0 }}>{promo.description}</p>
        </InfoCard>

        <InfoCard>
          <h3 style={{ color: "#fff", fontWeight: 700, fontSize: "14px", marginBottom: "10px" }}>Details</h3>
          <InfoRow><MapPin size={16} color="#737373" />{promo.venueName}, {promo.venueAddress}</InfoRow>
          {distance && <InfoRow><NavigationArrow size={16} color="#737373" />{formatDistance(distance)} away</InfoRow>}
          <InfoRow><Calendar size={16} color="#737373" />{formatEventTime(new Date(promo.validFrom))}</InfoRow>
          <InfoRow><Clock size={16} color="#737373" />Until {formatEventTime(new Date(promo.validTo))}</InfoRow>
          <InfoRow><Fire size={16} color="#f59e0b" />{promo.type?.replace(/_/g, " ")}</InfoRow>
        </InfoCard>

        <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
          <Button size="lg" fullWidth onClick={() => router.push(`/venues/${promo.venueId}`)}>
            <MapPin size={16} /> View Venue
          </Button>
          <Button variant="secondary" size="lg" onClick={() => promo.venueLat != null && window.open(`https://www.google.com/maps/dir/?api=1&destination=${promo.venueLat},${promo.venueLng}`, "_blank")}>
            <NavigationArrow size={16} />
          </Button>
        </div>

        <p style={{ color: "#737373", fontSize: "11px", textAlign: "center", marginTop: "12px" }}>
          Show this screen at the venue to redeem
        </p>
      </Content>
    </div>
  );
}
