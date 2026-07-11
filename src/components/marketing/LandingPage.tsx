"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import styled, { keyframes } from "styled-components";
import { useGeolocation } from "@/hooks/useGeolocation";
import {
  MapPin,
  Users,
  Fire,
  Ticket,
  ArrowRight,
  Sparkle,
  Calendar,
  Clock,
  ChatCircle,
  MagnifyingGlass,
} from "@phosphor-icons/react";

// ---- Animations ----

const fadeInUp = keyframes`
  from { opacity: 0; transform: translateY(24px); }
  to { opacity: 1; transform: translateY(0); }
`;

const pulse = keyframes`
  0%, 100% { box-shadow: 0 4px 24px rgba(124, 58, 237, 0.4); }
  50% { box-shadow: 0 4px 40px rgba(124, 58, 237, 0.7); }
`;

const slideLeft = keyframes`
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
`;

// ---- Styled Components ----

const Page = styled.div`
  min-height: 100dvh;
  background: var(--color-bg, #0a0a0a);
  color: var(--color-text-primary, #fff);
  overflow-x: hidden;
`;

const Section = styled.section<{ $delay?: number }>`
  opacity: 0;
  animation: ${fadeInUp} 0.6s ease-out forwards;
  animation-delay: ${({ $delay = 0 }) => $delay}s;
  padding: 0 24px;
  max-width: 480px;
  margin: 0 auto;

  @media (min-width: 768px) {
    max-width: 720px;
    padding: 0 40px;
  }

  @media (min-width: 1024px) {
    max-width: 960px;
  }
`;

// ---- Hero ----

const HeroSection = styled.section`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 56px 24px 0;
  text-align: center;
  max-width: 480px;
  margin: 0 auto;
  opacity: 0;
  animation: ${fadeInUp} 0.6s ease-out forwards;

  @media (min-width: 768px) {
    max-width: 640px;
    padding-top: 80px;
  }

  @media (min-width: 1024px) {
    max-width: 720px;
    padding-top: 100px;
  }
`;

const Badge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(124, 58, 237, 0.12);
  border: 1px solid rgba(124, 58, 237, 0.3);
  border-radius: 20px;
  padding: 6px 16px;
  font-size: 12px;
  font-weight: 600;
  color: #a78bfa;
  margin-bottom: 24px;
`;

const HeroTitle = styled.h1`
  font-weight: 900;
  font-size: 40px;
  line-height: 1.1;
  letter-spacing: -1.5px;
  margin: 0 0 12px;
  background: linear-gradient(135deg, #fff 0%, #c4b5fd 50%, #7c3aed 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;

  @media (min-width: 768px) {
    font-size: 56px;
    letter-spacing: -2px;
  }

  @media (min-width: 1024px) {
    font-size: 64px;
  }
`;

const HeroSubtitle = styled.p`
  color: #a3a3a3;
  font-size: 15px;
  line-height: 1.6;
  margin: 0 0 32px;
  max-width: 360px;

  @media (min-width: 768px) {
    font-size: 17px;
    max-width: 480px;
  }
`;

const CTAButton = styled.button`
  background: linear-gradient(135deg, #7c3aed, #5b21b6);
  color: #fff;
  font-weight: 700;
  font-size: 17px;
  padding: 16px 40px;
  border-radius: 16px;
  border: none;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  animation: ${pulse} 2.5s ease-in-out infinite;
  transition: transform 0.15s;
  &:hover {
    transform: translateY(-2px);
  }
  &:active {
    transform: translateY(0);
  }
`;

const SignInLink = styled.button`
  background: none;
  border: none;
  color: #737373;
  font-size: 14px;
  cursor: pointer;
  margin-top: 18px;
  transition: color 0.15s;
  &:hover {
    color: #a3a3a3;
  }
`;

const Divider = styled.div`
  width: 100%;
  height: 1px;
  background: linear-gradient(90deg, transparent, #262626 20%, #262626 80%, transparent);
  margin: 48px 0;
  max-width: 480px;
  margin-left: auto;
  margin-right: auto;

  @media (min-width: 768px) {
    max-width: 720px;
    margin: 64px auto;
  }

  @media (min-width: 1024px) {
    max-width: 960px;
    margin: 80px auto;
  }
`;

const SectionHeader = styled.div`
  text-align: center;
  margin-bottom: 24px;
`;

const SectionTitle = styled.h2`
  font-weight: 800;
  font-size: 22px;
  letter-spacing: -0.5px;
  margin: 0 0 8px;

  @media (min-width: 768px) {
    font-size: 28px;
  }
`;

const SectionSub = styled.p`
  color: #737373;
  font-size: 13px;
  line-height: 1.5;
  margin: 0;

  @media (min-width: 768px) {
    font-size: 15px;
  }
`;

// ---- Live Preview ----

const LivePreviewStrip = styled.div`
  overflow-x: auto;
  margin: 0 -24px;
  padding: 0 24px;
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;

  &::-webkit-scrollbar {
    display: none;
  }
  scrollbar-width: none;

  @media (min-width: 768px) {
    margin: 0 -40px;
    padding: 0 40px;
  }

  @media (min-width: 1024px) {
    margin: 0 auto;
    padding: 0;
    max-width: 960px;
  }
`;

const LiveTrack = styled.div`
  display: flex;
  gap: 12px;
  width: max-content;
  animation: ${slideLeft} 40s linear infinite;

  &:hover {
    animation-play-state: paused;
  }

  @media (min-width: 768px) {
    gap: 16px;
  }

  @media (min-width: 1024px) {
    gap: 20px;
  }
`;

const PreviewCard = styled.div`
  min-width: 220px;
  background: #1a1a1a;
  border: 1px solid #262626;
  border-radius: 14px;
  padding: 14px;
  flex-shrink: 0;
  scroll-snap-align: start;

  @media (min-width: 768px) {
    min-width: 260px;
  }

  @media (min-width: 1024px) {
    min-width: 280px;
  }
`;

const PreviewCardImage = styled.div<{ $color?: string; $hasImage?: boolean }>`
  width: 100%;
  height: 100px;
  background: ${({ $color = "#1a1a1a", $hasImage }) =>
    $hasImage ? "transparent" : `linear-gradient(135deg, ${$color}22, ${$color}08)`};
  border-radius: 10px;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  overflow: hidden;
`;

const PreviewCardTitle = styled.div`
  font-weight: 700;
  font-size: 13px;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const PreviewCardMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  color: #737373;
  font-size: 11px;
`;

const LiveLabel = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #10b981;
  font-size: 11px;
  font-weight: 600;
  margin-bottom: 12px;
`;

const LiveDot = styled.span`
  width: 6px;
  height: 6px;
  background: #10b981;
  border-radius: 50%;
  display: inline-block;
`;

// ---- Features ----

const FeatureGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;

  @media (min-width: 768px) {
    grid-template-columns: repeat(3, 1fr);
    gap: 14px;
  }
`;

const FeatureCard = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
  padding: 18px 14px;
  background: #1a1a1a;
  border: 1px solid #262626;
  border-radius: 16px;
`;

const FeatureIcon = styled.div<{ $color: string }>`
  width: 44px;
  height: 44px;
  background: ${({ $color }) => `${$color}15`};
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const FeatureTitle = styled.div`
  font-weight: 700;
  font-size: 13px;
  line-height: 1.3;
`;

const FeatureDesc = styled.div`
  color: #737373;
  font-size: 11px;
  line-height: 1.4;
`;

// ---- Stats ----

const StatsRow = styled.div`
  display: flex;
  justify-content: center;
  gap: 32px;
  text-align: center;
  padding: 8px 0;

  @media (min-width: 768px) {
    gap: 64px;
  }
`;

const StatItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
`;

const StatNumber = styled.div`
  font-weight: 900;
  font-size: 28px;
  background: linear-gradient(135deg, #c4b5fd, #7c3aed);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;

  @media (min-width: 768px) {
    font-size: 36px;
  }
`;

const StatLabel = styled.div`
  color: #737373;
  font-size: 11px;
  font-weight: 500;

  @media (min-width: 768px) {
    font-size: 13px;
  }
`;

// ---- How It Works ----

const StepsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;

  @media (min-width: 768px) {
    flex-direction: row;
    gap: 24px;
  }
`;

const StepRow = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 14px;

  @media (min-width: 768px) {
    flex: 1;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 16px;
  }
`;

const StepNumber = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #7c3aed, #5b21b6);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 15px;
  flex-shrink: 0;

  @media (min-width: 768px) {
    width: 48px;
    height: 48px;
    font-size: 20px;
  }
`;

const StepContent = styled.div``;

const StepTitle = styled.div`
  font-weight: 700;
  font-size: 14px;
  margin-bottom: 2px;
`;

const StepDesc = styled.div`
  color: #737373;
  font-size: 12px;
  line-height: 1.4;
`;

// ---- Bottom CTA ----

const BottomCTA = styled.section`
  text-align: center;
  padding: 48px 24px 64px;
  max-width: 480px;
  margin: 0 auto;
  opacity: 0;
  animation: ${fadeInUp} 0.6s ease-out forwards;
  animation-delay: 0.8s;

  @media (min-width: 768px) {
    max-width: 640px;
    padding: 64px 24px 96px;
  }
`;

const BottomCTATitle = styled.h2`
  font-weight: 800;
  font-size: 24px;
  letter-spacing: -0.5px;
  margin: 0 0 8px;
`;

const BottomCTASub = styled.p`
  color: #a3a3a3;
  font-size: 14px;
  line-height: 1.5;
  margin: 0 0 28px;
`;

// ---- Preview data (static fallback when API is unavailable) ----

type PreviewItem = {
  id: string;
  type: "event" | "promotion";
  title: string;
  venueName: string;
  distance: number;
  timeLabel: string;
  accentColor?: string;
  image?: string;
};

const FALLBACK_PREVIEW: PreviewItem[] = [
  {
    id: "1",
    type: "promotion",
    title: "Happy Hour — 2 for 1 cocktails",
    venueName: "The Cocktail Bar",
    distance: 0.3,
    timeLabel: "4pm–7pm today",
    accentColor: "#f59e0b",
  },
  {
    id: "2",
    type: "event",
    title: "Live Jazz Night",
    venueName: "Storyville",
    distance: 0.6,
    timeLabel: "Tonight 8pm",
    accentColor: "#3b82f6",
  },
  {
    id: "3",
    type: "promotion",
    title: "Free welcome drink with dinner",
    venueName: "Ravintola Aino",
    distance: 1.1,
    timeLabel: "All day",
    accentColor: "#10b981",
  },
  {
    id: "4",
    type: "event",
    title: "Pub Quiz — win a 100€ tab",
    venueName: "Molly Malone's",
    distance: 0.8,
    timeLabel: "Tomorrow 7pm",
    accentColor: "#8b5cf6",
  },
  {
    id: "5",
    type: "promotion",
    title: "Student discount — 20% off",
    venueName: "Bar Loose",
    distance: 1.4,
    timeLabel: "Mon–Thu",
    accentColor: "#ef4444",
  },
  {
    id: "6",
    type: "event",
    title: "Afterwork DJ set",
    venueName: "Tanner",
    distance: 2.1,
    timeLabel: "Fri 6pm",
    accentColor: "#f97316",
  },
];

// ---- Component ----

export function LandingPage() {
  const router = useRouter();
  const [previewItems, setPreviewItems] = useState<PreviewItem[]>(FALLBACK_PREVIEW);
  const [stats, setStats] = useState({ bars: 180, events: 42, promos: 67 });
  const [cityName, setCityName] = useState<string | null>(null);
  const { lat, lng } = useGeolocation();

  // Reverse geocode the user's coordinates to get their city name
  useEffect(() => {
    if (lat == null || lng == null) return;

    const fetchCity = async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10`,
        );
        if (!res.ok) return;
        const data = await res.json();
        const city =
          data.address?.city ||
          data.address?.town ||
          data.address?.municipality ||
          data.address?.village ||
          null;
        if (city) setCityName(city);
      } catch {
        // Keep fallback "your city"
      }
    };

    fetchCity();
  }, [lat, lng]);

  // Try to fetch live data, fall back to static preview
  useEffect(() => {
    const fetchLive = async () => {
      try {
        const feedLat = lat ?? 60.1699;
        const feedLng = lng ?? 24.9384;
        const res = await fetch(
          `/api/feed?lat=${feedLat}&lng=${feedLng}&radius=50&time=month`,
        );
        if (!res.ok) return;
        const data = await res.json();
        if (!Array.isArray(data)) return;

        const mapped: PreviewItem[] = data.slice(0, 8).map((item: any) => ({
          id: item.id || String(Math.random()),
          type: item.type === "event" ? "event" : "promotion",
          title: item.title || "Check it out",
          venueName: item.venueName || "Nearby venue",
          distance: Math.round((item.distance || 1) * 10) / 10,
          timeLabel:
            item.type === "event"
              ? new Date(item.startTime).toLocaleDateString("en-US", {
                  weekday: "short",
                  hour: "numeric",
                  minute: "2-digit",
                })
              : "Active now",
          accentColor: item.accentColor || undefined,
          image: item.image || undefined,
        }));

        if (mapped.length > 0) {
          // Double for seamless CSS animation loop
          setPreviewItems([...mapped, ...mapped]);
        }

        // Stats from the live data
        const eventCount = data.filter((i: any) => i.type === "event").length;
        const promoCount = data.filter(
          (i: any) => i.type === "promotion",
        ).length;
        setStats({
          bars: Math.max(stats.bars, data.length * 3),
          events: Math.max(stats.events, eventCount),
          promos: Math.max(stats.promos, promoCount),
        });
      } catch {
        // Keep fallback data
      }
    };

    fetchLive();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lat, lng]);

  const previewIcons: Record<string, React.ReactNode> = {
    event: <Calendar size={28} color="#3b82f6" weight="fill" />,
    promotion: <Ticket size={28} color="#f59e0b" weight="fill" />,
  };

  return (
    <Page>
      {/* ---- Hero ---- */}
      <HeroSection>
        <Badge>
          <Sparkle size={14} color="#a78bfa" weight="fill" />
          {cityName ? `Discover ${cityName}` : "Discover your city"}
        </Badge>

        <Image
          src="/hoppr-neon-nobg.png"
          alt="Hoppr"
          width={100}
          height={82}
          priority
          style={{ marginBottom: "8px" }}
        />

        <HeroTitle>Find the vibe</HeroTitle>

        <HeroSubtitle>
          Discover bars, events, and promotions near you — with real-time crowd
          levels so you know what&apos;s happening before you go. Any time, any
          occasion.
        </HeroSubtitle>

        <CTAButton onClick={() => router.push("/register")}>
          Get started free <ArrowRight size={20} />
        </CTAButton>

        <SignInLink onClick={() => router.push("/login")}>
          Already have an account? Sign in
        </SignInLink>
      </HeroSection>

      <Divider />

      {/* ---- Live Preview ---- */}
      <Section $delay={0.3}>
        <SectionHeader>
          <LiveLabel>
            <LiveDot />
            What&apos;s nearby right now
          </LiveLabel>
          <SectionSub>
            Real promotions and events happening near you
          </SectionSub>
        </SectionHeader>

        <LivePreviewStrip>
          <LiveTrack>
            {previewItems.map((item, i) => (
              <PreviewCard key={`${item.id}-${i}`}>
                <PreviewCardImage $color={item.accentColor} $hasImage={!!item.image}>
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.title}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        borderRadius: "10px",
                      }}
                    />
                  ) : (
                    previewIcons[item.type]
                  )}
                </PreviewCardImage>
                <PreviewCardTitle>{item.title}</PreviewCardTitle>
                <PreviewCardMeta>
                  <MapPin size={12} color="#737373" weight="fill" />
                  {item.venueName} · {item.distance}km
                </PreviewCardMeta>
                <PreviewCardMeta style={{ marginTop: "4px" }}>
                  <Clock size={12} color="#737373" />
                  {item.timeLabel}
                </PreviewCardMeta>
              </PreviewCard>
            ))}
          </LiveTrack>
        </LivePreviewStrip>
      </Section>

      <Divider />

      {/* ---- Stats ---- */}
      <Section $delay={0.4}>
        <StatsRow>
          <StatItem>
            <StatNumber>{stats.bars}+</StatNumber>
            <StatLabel>Venues</StatLabel>
          </StatItem>
          <StatItem>
            <StatNumber>{stats.events}+</StatNumber>
            <StatLabel>Events</StatLabel>
          </StatItem>
          <StatItem>
            <StatNumber>{stats.promos}+</StatNumber>
            <StatLabel>Promotions</StatLabel>
          </StatItem>
        </StatsRow>
      </Section>

      <Divider />

      {/* ---- Features ---- */}
      <Section $delay={0.5}>
        <SectionHeader>
          <SectionTitle>Everything in one place</SectionTitle>
          <SectionSub>No more switching between apps and group chats</SectionSub>
        </SectionHeader>

        <FeatureGrid>
          <FeatureCard>
            <FeatureIcon $color="#3b82f6">
              <MapPin size={22} color="#3b82f6" weight="fill" />
            </FeatureIcon>
            <div>
              <FeatureTitle>Explore venues</FeatureTitle>
              <FeatureDesc>
                Browse bars, pubs, and clubs with real menus and photos
              </FeatureDesc>
            </div>
          </FeatureCard>

          <FeatureCard>
            <FeatureIcon $color="#f59e0b">
              <Ticket size={22} color="#f59e0b" weight="fill" />
            </FeatureIcon>
            <div>
              <FeatureTitle>Find deals</FeatureTitle>
              <FeatureDesc>
                Happy hours, student discounts, and exclusive offers
              </FeatureDesc>
            </div>
          </FeatureCard>

          <FeatureCard>
            <FeatureIcon $color="#ef4444">
              <Fire size={22} color="#ef4444" weight="fill" />
            </FeatureIcon>
            <div>
              <FeatureTitle>Live heatmap</FeatureTitle>
              <FeatureDesc>
                See crowd levels in real time. Never walk into an empty bar
              </FeatureDesc>
            </div>
          </FeatureCard>

          <FeatureCard>
            <FeatureIcon $color="#10b981">
              <Users size={22} color="#10b981" weight="fill" />
            </FeatureIcon>
            <div>
              <FeatureTitle>Create events</FeatureTitle>
              <FeatureDesc>
                Host pub crawls, after-works, or a spontaneous night out
              </FeatureDesc>
            </div>
          </FeatureCard>

          <FeatureCard>
            <FeatureIcon $color="#8b5cf6">
              <ChatCircle size={22} color="#8b5cf6" weight="fill" />
            </FeatureIcon>
            <div>
              <FeatureTitle>Group chat</FeatureTitle>
              <FeatureDesc>
                Coordinate with friends in event chat rooms — no switching apps
              </FeatureDesc>
            </div>
          </FeatureCard>

          <FeatureCard>
            <FeatureIcon $color="#06b6d4">
              <MagnifyingGlass size={22} color="#06b6d4" weight="fill" />
            </FeatureIcon>
            <div>
              <FeatureTitle>Smart search</FeatureTitle>
              <FeatureDesc>
                Find any venue, event, or promotion in seconds
              </FeatureDesc>
            </div>
          </FeatureCard>
        </FeatureGrid>
      </Section>

      <Divider />

      {/* ---- How it works ---- */}
      <Section $delay={0.6}>
        <SectionHeader>
          <SectionTitle>Three taps to a great night</SectionTitle>
        </SectionHeader>

        <StepsList>
          <StepRow>
            <StepNumber>1</StepNumber>
            <StepContent>
              <StepTitle>Find your vibe</StepTitle>
              <StepDesc>
                Browse nearby bars, filter by crowd level, and check what
                promotions are running.
              </StepDesc>
            </StepContent>
          </StepRow>
          <StepRow>
            <StepNumber>2</StepNumber>
            <StepContent>
              <StepTitle>Pick your scene</StepTitle>
              <StepDesc>
                See live events, join a pub crawl, or grab a happy hour deal
                before it ends.
              </StepDesc>
            </StepContent>
          </StepRow>
          <StepRow>
            <StepNumber>3</StepNumber>
            <StepContent>
              <StepTitle>Go out</StepTitle>
              <StepDesc>
                Navigate there, check in, and connect with friends. The rest
                takes care of itself.
              </StepDesc>
            </StepContent>
          </StepRow>
        </StepsList>
      </Section>

      <Divider />

      {/* ---- Bottom CTA ---- */}
      <BottomCTA>
        <BottomCTATitle>Ready to discover?</BottomCTATitle>
        <BottomCTASub>
          Join thousands of people discovering what&apos;s happening around them.
        </BottomCTASub>
        <CTAButton onClick={() => router.push("/register")}>
          Get started free <ArrowRight size={20} />
        </CTAButton>
      </BottomCTA>
    </Page>
  );
}
