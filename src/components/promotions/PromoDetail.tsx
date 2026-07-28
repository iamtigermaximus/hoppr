"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import styled from "styled-components";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SkeletonDetail } from "@/components/ui/Skeleton";
import { formatDistance, formatEventTime } from "@/lib/utils";
import { MapPin, Clock, Calendar, ArrowLeft, NavigationArrow, Fire, Ticket, Lightning } from "@phosphor-icons/react";
import ShareButton from "@/components/ui/ShareButton";
import SharePrompt from "@/components/ui/SharePrompt";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useQuery } from "@tanstack/react-query";
import { markEligibleForPushOptIn } from "@/lib/push-eligibility";
import ActivationTimer from "./ActivationTimer";

interface Benefit {
  item: string;
  discountedPrice: number;
  originalPrice: number;
  description?: string;
}

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

const BenefitsCard = styled.div`
  background: #1a1a1a; border: 1px solid #262626;
  border-radius: 14px; padding: 16px; margin-bottom: 12px;
`;

const BenefitRow = styled.div`
  display: flex; justify-content: space-between; align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #262626;
  &:last-child { border-bottom: none; padding-bottom: 0; }
  &:first-of-type { padding-top: 0; }
`;

const BenefitLeft = styled.div``;
const BenefitName = styled.div`
  color: #fff; font-size: 14px; font-weight: 600;
`;
const BenefitDesc = styled.div`
  color: #737373; font-size: 11px; margin-top: 2px;
`;

const BenefitRight = styled.div`
  text-align: right;
`;
const DiscountedPrice = styled.div`
  font-size: 18px; font-weight: 700; color: #10b981;
`;
const OriginalPrice = styled.div`
  font-size: 12px; color: #737373; text-decoration: line-through;
`;

const BenefitActivateBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: #7c3aed;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 6px 14px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s;
  font-family: inherit;
  margin-top: 6px;
  &:hover:not(:disabled) { background: #6d28d9; }
  &:disabled { opacity: 0.4; cursor: not-allowed; }
`;

const ActivateSection = styled.div`
  margin-top: 16px;
`;

const ActivateButton = styled(Button)`
  width: 100%;
  font-size: 16px;
  font-weight: 700;
  padding: 14px;
`;

const StatusMessage = styled.div<{ $type: "success" | "error" | "info" }>`
  text-align: center;
  padding: 12px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 500;
  margin-top: 12px;
  background: ${({ $type }) =>
    $type === "success" ? "#022c22" : $type === "error" ? "#450a0a" : "#0c1929"};
  color: ${({ $type }) =>
    $type === "success" ? "#10b981" : $type === "error" ? "#fca5a5" : "#93c5fd"};
  border: 1px solid ${({ $type }) =>
    $type === "success" ? "#065f46" : $type === "error" ? "#7f1d1d" : "#1e3a5f"};
`;

export default function PromoDetail() {
  const params = useParams();
  const router = useRouter();
  const { lat, lng } = useGeolocation();
  const { data: session } = useSession();
  const id = params.id as string;

  const [showTimer, setShowTimer] = useState(false);
  const [activation, setActivation] = useState<{
    expiresAt: string; activationId: string;
  } | null>(null);
  const [activationStatus, setActivationStatus] = useState<{
    type: "success" | "error" | "info"; message: string;
  } | null>(null);
  const [activating, setActivating] = useState(false);
  const [activeBenefitIndex, setActiveBenefitIndex] = useState<number | null>(null);

  const { data: promo, isLoading } = useQuery<any>({
    queryKey: ["promotion", id],
    queryFn: () => fetch(`/api/promotions?id=${id}`).then((r) => r.json()),
    enabled: !!id,
  });

  useEffect(() => {
    if (promo && !promo.error) {
      markEligibleForPushOptIn();
    }
  }, [promo]);

  const handleActivate = async (benefitIndex?: number) => {
    if (!session?.user) {
      setActivationStatus({
        type: "info",
        message: "Sign in to redeem this offer",
      });
      router.push("/login");
      return;
    }

    setActivating(true);
    setActivationStatus(null);
    if (benefitIndex !== undefined) setActiveBenefitIndex(benefitIndex);

    try {
      const res = await fetch("/api/promotions/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          promotionId: promo.id,
          barId: promo.venueId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setActivationStatus({ type: "error", message: data.error });
        setActiveBenefitIndex(null);
        return;
      }

      setActivation(data);
      setShowTimer(true);
      const benefitLabel = benefitIndex !== undefined && benefits[benefitIndex]
        ? benefits[benefitIndex].item
        : "Offer";
      setActivationStatus({
        type: "success",
        message: `${benefitLabel} activated! Show this screen to your bartender.`,
      });
    } catch {
      setActivationStatus({
        type: "error",
        message: "Something went wrong. Please try again.",
      });
      setActiveBenefitIndex(null);
    } finally {
      setActivating(false);
    }
  };

  const handleTimerExpire = () => {
    setShowTimer(false);
    setActiveBenefitIndex(null);
    setActivationStatus({
      type: "info",
      message: "This activation has expired. You can activate again if your redemption limit allows.",
    });
  };

  if (isLoading) return <SkeletonDetail />;
  if (!promo || promo.error) return <div style={{ padding: 32, textAlign: "center", color: "#ef4444" }}>Promotion not found</div>;

  const distance = promo.venueLat != null && promo.venueLng != null && lat && lng
    ? Math.sqrt((promo.venueLat - lat) ** 2 + (promo.venueLng - lng) ** 2) * 111.32
    : null;

  const isActive = new Date(promo.validFrom) <= new Date() && new Date(promo.validTo) >= new Date();
  const benefits: Benefit[] = Array.isArray(promo.benefits) ? promo.benefits : [];
  const hasBenefits = benefits.length > 0;

  // Check if promotion has expired or is upcoming
  const isExpired = new Date(promo.validTo) < new Date();
  const isUpcoming = new Date(promo.validFrom) > new Date();

  // Build the button label based on state
  const getButtonLabel = () => {
    if (activating) return "Activating...";
    if (isExpired) return "Offer ended";
    if (isUpcoming) return "Coming soon";
    if (!session?.user) return "Sign in to redeem";
    return hasBenefits ? "Use this offer" : "Redeem offer";
  };

  const buttonDisabled = !isActive || activating || isExpired || isUpcoming;

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
            {!isActive && <Badge $type="promo">{isUpcoming ? "UPCOMING" : "ENDED"}</Badge>}
            {promo.discount != null && (
              <Badge $type="featured">{promo.discount}% OFF</Badge>
            )}
          </div>
          <h1 style={{ fontWeight: 800, fontSize: "24px", color: "#fff", margin: 0, lineHeight: 1.2 }}>{promo.title}</h1>
        </div>
      </Hero>

      <SharePrompt
        storageKey={`promo_${promo.id}`}
        headline="Love this deal? Share it with your friends!"
        subtitle={`Let your crew know about ${promo.title} at ${promo.venueName}.`}
        shareTitle={promo.title}
        shareText={`Check out this deal: ${promo.title} at ${promo.venueName} on Hoppr!`}
      />

      <Content>
        <InfoCard>
          <h3 style={{ color: "#fff", fontWeight: 700, fontSize: "14px", marginBottom: "10px" }}>About this promotion</h3>
          <p style={{ color: "#a3a3a3", fontSize: "13px", lineHeight: 1.7, margin: 0 }}>{promo.description}</p>
        </InfoCard>

        {/* Benefits / Offers */}
        {hasBenefits && (
          <BenefitsCard>
            <h3 style={{ color: "#fff", fontWeight: 700, fontSize: "14px", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
              <Ticket size={16} color="#10b981" /> This week's offers
            </h3>
            {benefits.map((b, i) => (
              <BenefitRow key={i}>
                <div style={{ flex: 1 }}>
                  <BenefitLeft>
                    <BenefitName>{b.item}</BenefitName>
                    {b.description && <BenefitDesc>{b.description}</BenefitDesc>}
                  </BenefitLeft>
                  <BenefitActivateBtn
                    disabled={!isActive || activating || isExpired || isUpcoming}
                    onClick={() => handleActivate(i)}
                  >
                    <Lightning size={12} weight="fill" />
                    {activating && activeBenefitIndex === i ? "..." : "Activate"}
                  </BenefitActivateBtn>
                </div>
                <BenefitRight>
                  <DiscountedPrice>{b.discountedPrice}€</DiscountedPrice>
                  <OriginalPrice>{b.originalPrice}€</OriginalPrice>
                </BenefitRight>
              </BenefitRow>
            ))}
          </BenefitsCard>
        )}

        <InfoCard>
          <h3 style={{ color: "#fff", fontWeight: 700, fontSize: "14px", marginBottom: "10px" }}>Details</h3>
          <InfoRow><MapPin size={16} color="#737373" />{promo.venueName}, {promo.venueAddress}</InfoRow>
          {distance && <InfoRow><NavigationArrow size={16} color="#737373" />{formatDistance(distance)} away</InfoRow>}
          <InfoRow><Calendar size={16} color="#737373" />{formatEventTime(new Date(promo.validFrom))}</InfoRow>
          <InfoRow><Clock size={16} color="#737373" />Until {formatEventTime(new Date(promo.validTo))}</InfoRow>
          <InfoRow><Fire size={16} color="#f59e0b" />{promo.type?.replace(/_/g, " ")}</InfoRow>
          {promo.redemptionRule && (
            <InfoRow style={{ color: "#a3a3a3" }}>
              <Lightning size={16} color="#7c3aed" />
              {promo.redemptionRule === "ONCE_PER_DAY"
                ? "Once per day"
                : promo.redemptionRule === "SINGLE_USE"
                ? "One-time use"
                : promo.redemptionRule === "MULTI_USE"
                ? "Unlimited use"
                : "Limited redemptions"}
            </InfoRow>
          )}
        </InfoCard>

        <ActivateSection>
          <ActivateButton
            size="lg"
            disabled={buttonDisabled}
            onClick={() => handleActivate()}
            variant={hasBenefits ? "secondary" : "primary"}
          >
            {activating ? (
              "Activating..."
            ) : isActive ? (
              <><Lightning size={18} weight="fill" style={{ marginRight: 6 }} />{getButtonLabel()}</>
            ) : (
              getButtonLabel()
            )}
          </ActivateButton>

          {activationStatus && (
            <StatusMessage $type={activationStatus.type}>
              {activationStatus.message}
            </StatusMessage>
          )}

          <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
            <Button size="lg" fullWidth variant="secondary" onClick={() => router.push(`/venues/${promo.venueId}`)}>
              <MapPin size={16} /> View Venue
            </Button>
            <Button variant="secondary" size="lg" onClick={() => promo.venueLat != null && window.open(`https://www.google.com/maps/dir/?api=1&destination=${promo.venueLat},${promo.venueLng}`, "_blank")}>
              <NavigationArrow size={16} />
            </Button>
          </div>

          {!isExpired && !isUpcoming && (
            <p style={{ color: "#737373", fontSize: "11px", textAlign: "center", marginTop: "12px" }}>
              {promo.redemptionRule === "ONCE_PER_DAY"
                ? "Redeemable once per day while active"
                : "Tap above when you're at the venue"}
            </p>
          )}
        </ActivateSection>
      </Content>

      {/* Activation timer overlay */}
      {showTimer && activation && (
        <ActivationTimer
          expiresAt={activation.expiresAt}
          barName={promo.venueName}
          promoTitle={promo.title}
          benefits={
            activeBenefitIndex !== null && benefits[activeBenefitIndex]
              ? [benefits[activeBenefitIndex]]
              : benefits
          }
          onExpire={handleTimerExpire}
        />
      )}
    </div>
  );
}
