"use client";
import { useParams, useRouter } from "next/navigation";
import styled from "styled-components";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";
import { SkeletonDetail } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { formatDistance, formatEventTime } from "@/lib/utils";
import { MapPin, ArrowLeft, NavigationArrow, Ticket, CheckCircle, Clock, CurrencyCircleDollar } from "@phosphor-icons/react";
import ShareButton from "@/components/ui/ShareButton";
import { usePurchasePass } from "@/hooks/usePasses";
import { useVenue } from "@/hooks/useVenues";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useQuery } from "@tanstack/react-query";

const Hero = styled.div`
  border-radius: 20px; overflow: hidden;
  background: linear-gradient(135deg, #1a0a00, #2d1a00, #0a0a0a);
  padding: 28px 24px; margin-bottom: 20px;
  text-align: center;
  border: 1px solid rgba(245,158,11,0.2);
`;

const InfoCard = styled.div`
  background: #1a1a1a; border: 1px solid #262626;
  border-radius: 14px; padding: 16px; margin-bottom: 12px;
`;

const Benefit = styled.div`
  display: flex; align-items: center; gap: 8px;
  padding: 8px 0; color: #a3a3a3; font-size: 13px;
`;

export default function PassDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { lat, lng } = useGeolocation();
  const { toast } = useToast();
  const { mutate: purchase, isPending } = usePurchasePass();
  const id = params.id as string;

  const { data: passes = [], isLoading } = useQuery<any[]>({
    queryKey: ["passes"],
    queryFn: () => fetch("/api/passes").then((r) => r.json()),
  });

  const pass = passes.find((p: any) => p.id === id);
  const { data: venue } = useVenue(pass?.venueId || "");

  if (isLoading) return <SkeletonDetail />;

  if (!pass) {
    return (
      <ErrorState
        message="Pass not found"
        description="This pass may have been removed or the link is invalid."
      />
    );
  }

  const distance = venue && lat && lng && venue.lat != null && venue.lng != null
    ? Math.sqrt((venue.lat - lat) ** 2 + (venue.lng - lng) ** 2) * 111.32
    : null;

  const handleBuy = () => {
    purchase(id, { onSuccess: () => { toast("Pass purchased!", "success"); router.push("/passes/my"); } });
  };

  return (
    <div style={{ padding: "16px", maxWidth: "680px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
        <button onClick={() => router.back()} style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "#a3a3a3", fontSize: "13px", fontWeight: 500, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
          <ArrowLeft size={16} /> Back
        </button>
        <ShareButton title={pass.title} text={pass.description} />
      </div>

      <Hero>
        <div style={{ width: "64px", height: "64px", background: "linear-gradient(135deg, #f59e0b, #d97706)", borderRadius: "18px", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
          <Ticket size={32} color="#fff" weight="fill" />
        </div>
        <div style={{ display: "flex", gap: "6px", justifyContent: "center", marginBottom: "8px" }}>
          <Badge $type="pass">VIP PASS</Badge>
        </div>
        <h1 style={{ fontWeight: 800, fontSize: "22px", color: "#fff", margin: "0 0 12px", lineHeight: 1.2 }}>{pass.title}</h1>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "baseline", gap: "8px", marginBottom: "6px" }}>
          <span style={{ color: "#f59e0b", fontWeight: 800, fontSize: "32px" }}>€{pass.price}</span>
        </div>
        <div style={{ color: "#737373", fontSize: "11px" }}>Valid until {formatEventTime(new Date(pass.validUntil))}</div>
      </Hero>

      {pass.benefits?.length > 0 && (
        <InfoCard>
          <h3 style={{ color: "#fff", fontWeight: 700, fontSize: "14px", marginBottom: "10px" }}>What you get</h3>
          {pass.benefits.map((b: string) => (
            <Benefit key={b}><CheckCircle size={16} color="#10b981" weight="fill" />{b}</Benefit>
          ))}
        </InfoCard>
      )}

      <InfoCard>
        <h3 style={{ color: "#fff", fontWeight: 700, fontSize: "14px", marginBottom: "10px" }}>Location</h3>
        <Benefit><MapPin size={16} color="#737373" />{venue?.name || pass.venueName}, {venue?.address || ""}</Benefit>
        {distance && <Benefit><NavigationArrow size={16} color="#737373" />{formatDistance(distance)} away</Benefit>}
        <Benefit><Clock size={16} color="#737373" />Valid until {formatEventTime(new Date(pass.validUntil))}</Benefit>
      </InfoCard>

      <Button size="lg" fullWidth onClick={handleBuy} disabled={isPending}>
        <CurrencyCircleDollar size={18} /> {isPending ? "Purchasing..." : `Buy for €${pass.price}`}
      </Button>

      <p style={{ color: "#737373", fontSize: "11px", textAlign: "center", marginTop: "10px" }}>
        No payment required for MVP -- tap to claim instantly
      </p>
    </div>
  );
}
