"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styled from "styled-components";
import { useSession } from "next-auth/react";
import { MapPin, X } from "@phosphor-icons/react";
import { TrendingCarousel } from "@/components/home/TrendingCarousel";
import { PromoSlider } from "@/components/home/PromoSlider";
import { EventList } from "@/components/home/EventList";
import { BarSlider } from "@/components/home/BarSlider";
import { CategoryGrid } from "@/components/home/CategoryGrid";
import { FromYourBars } from "@/components/home/FromYourBars";
import NotificationOptInBanner from "@/components/NotificationOptInBanner";
import { useCrowdScores } from "@/hooks/useCrowdScores";
import { useGeolocation } from "@/hooks/useGeolocation";

const HeatStrip = styled(Link)`
  display: block;
  margin: 0 16px 16px;
  padding: 12px 14px;
  background: linear-gradient(
    135deg,
    rgba(124, 58, 237, 0.08),
    rgba(239, 68, 68, 0.06)
  );
  border: 1px solid rgba(124, 58, 237, 0.2);
  border-radius: 14px;
  cursor: pointer;
  text-decoration: none;
`;

const HeatStripHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
`;

const HeatStripTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 700;
  color: var(--color-text-primary, #fff);
`;

const HeatDots = styled.div`
  display: flex;
  gap: 6px;
  align-items: center;
`;

const HeatDot = styled.span<{ $color: string }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ $color }) => $color};
`;

const HeatVibe = styled.span`
  font-size: 11px;
  color: #a3a3a3;
`;

function levelColor(level: string | null): string {
  switch (level) {
    case "QUIET":
      return "#10b981";
    case "GETTING_BUSY":
      return "#f59e0b";
    case "BUSY":
      return "#f97316";
    case "PACKED":
      return "#ef4444";
    case "AT_CAPACITY":
      return "#dc2626";
    default:
      return "#6b7280";
  }
}

const ONBOARDING_BANNER_KEY = "hoppr_onboarding_dismissed";

const OnboardingBanner = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin: 0 16px 12px;
  padding: 10px 14px;
  background: linear-gradient(135deg, rgba(124, 58, 237, 0.12), rgba(124, 58, 237, 0.04));
  border: 1px solid rgba(124, 58, 237, 0.25);
  border-radius: 12px;
`;

const OnboardingBannerText = styled.span`
  color: #d4c4ff;
  font-size: 12px;
  font-weight: 500;
  line-height: 1.4;
`;

const OnboardingBannerLink = styled.button`
  background: none;
  border: none;
  color: #a78bfa;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  padding: 0;
  &:hover { color: #c4b5fd; }
`;

const OnboardingBannerClose = styled.button`
  background: none;
  border: none;
  color: #737373;
  cursor: pointer;
  padding: 2px;
  display: flex;
  align-items: center;
  &:hover { color: #a3a3a3; }
`;

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const userName = (session?.user as Record<string, unknown> | undefined)?.name as string | undefined;
  const onboardingCompleted = (session?.user as Record<string, unknown> | undefined)?.onboardingCompleted as boolean | undefined;
  const today = new Date();
  const dateStr = today.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  const { lat, lng } = useGeolocation();
  const { data: scores = [] } = useCrowdScores(lat, lng);

  const [bannerDismissed, setBannerDismissed] = useState(false);

  // Redirect to onboarding if user hasn't completed it
  useEffect(() => {
    if (status === "authenticated" && onboardingCompleted === false) {
      router.replace("/onboarding");
    }
  }, [status, onboardingCompleted, router]);

  // Check localStorage for dismissed banner on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const dismissed = localStorage.getItem(ONBOARDING_BANNER_KEY);
      if (dismissed === "true") setBannerDismissed(true);
    }
  }, []);

  const dismissBanner = () => {
    localStorage.setItem(ONBOARDING_BANNER_KEY, "true");
    setBannerDismissed(true);
  };

  const hotCount = scores.filter(
    (s) =>
      s.computedLevel &&
      ["PACKED", "AT_CAPACITY"].includes(s.computedLevel),
  ).length;

  const busyCount = scores.filter(
    (s) =>
      s.computedLevel &&
      ["BUSY", "GETTING_BUSY"].includes(s.computedLevel),
  ).length;

  const topHot = scores
    .filter((s) => s.computedLevel && s.compositeScore > 0)
    .sort((a, b) => b.compositeScore - a.compositeScore)
    .slice(0, 3);

  return (
    <>
      <div style={{ padding: "4px 16px 12px" }}>
        {userName && (
          <div
            style={{
              color: "#a3a3a3",
              fontSize: "12px",
              marginBottom: "2px",
            }}
          >
            Welcome back, {userName.split(" ")[0]}
          </div>
        )}
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: "8px",
          }}
        >
          <span
            style={{
              fontWeight: 800,
              fontSize: "18px",
              color: "var(--color-text-primary, #fff)",
              letterSpacing: "-0.5px",
            }}
          >
            Helsinki
          </span>
          <span
            style={{
              color: "var(--color-text-muted, #737373)",
              fontSize: "12px",
            }}
          >
            {dateStr}
          </span>
        </div>
      </div>

      {/* Onboarding nudge banner — shown when user hasn't completed onboarding */}
      {status === "authenticated" && onboardingCompleted === false && !bannerDismissed && (
        <OnboardingBanner>
          <OnboardingBannerText>
            Personalize your experience — takes 30 seconds
          </OnboardingBannerText>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <OnboardingBannerLink onClick={() => router.push("/onboarding")}>
              Set preferences
            </OnboardingBannerLink>
            <OnboardingBannerClose onClick={dismissBanner}>
              <X size={14} />
            </OnboardingBannerClose>
          </div>
        </OnboardingBanner>
      )}

      <NotificationOptInBanner />

      <HeatStrip href="/map">
        <HeatStripHeader>
          <HeatStripTitle>
            <MapPin size={16} color="#ef4444" weight="fill" />
            Nearby Heat
          </HeatStripTitle>
          <span
            style={{
              fontSize: "10px",
              color: "#7c3aed",
              fontWeight: 600,
            }}
          >
            Open Map &rarr;
          </span>
        </HeatStripHeader>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <HeatDots>
            {topHot.map((v) => (
              <HeatDot
                key={v.id}
                $color={levelColor(v.computedLevel)}
              />
            ))}
          </HeatDots>
          <HeatVibe>
            {hotCount > 0
              ? `${hotCount} venues packed · ${busyCount} busy`
              : busyCount > 0
                ? `${busyCount} venues buzzing`
                : "All quiet right now"}
          </HeatVibe>
        </div>
      </HeatStrip>

      <TrendingCarousel />

      <FromYourBars />
      <PromoSlider />
      <EventList />
      <BarSlider />
      <CategoryGrid />
    </>
  );
}
