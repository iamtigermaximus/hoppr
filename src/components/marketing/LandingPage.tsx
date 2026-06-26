"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import styled from "styled-components";
import Image from "next/image";
import { MapPin, Users, ArrowRight } from "@phosphor-icons/react";

const Page = styled.div`
  min-height: 100dvh; background: var(--color-bg, #0a0a0a);
  display: flex; flex-direction: column; align-items: center;
  padding: 48px 24px 32px;
  text-align: center;
`;

const Hero = styled.div`
  display: flex; flex-direction: column; align-items: center;
  gap: 16px; margin-top: 40px; margin-bottom: 48px;
`;

const Tagline = styled.h1`
  font-weight: 800; font-size: 28px; color: var(--color-text-primary, #fff);
  line-height: 1.2; letter-spacing: -0.5px;
  max-width: 320px;
`;

const Subtitle = styled.p`
  color: var(--color-text-secondary, #a3a3a3); font-size: 14px; line-height: 1.6;
  max-width: 320px;
`;

const CTA = styled.button`
  background: linear-gradient(135deg, #7c3aed, #5b21b6);
  color: #fff; font-weight: 700; font-size: 16px;
  padding: 14px 32px; border-radius: 14px;
  border: none; cursor: pointer;
  display: flex; align-items: center; gap: 8px;
  box-shadow: 0 4px 24px rgba(124,58,237,0.4);
  transition: transform 0.15s, box-shadow 0.15s;
  &:hover { transform: translateY(-1px); box-shadow: 0 6px 32px rgba(124,58,237,0.5); }
`;

const SignInLink = styled.button`
  background: none; border: none; color: var(--color-text-secondary, #a3a3a3);
  font-size: 14px; cursor: pointer; margin-top: 16px;
  &:hover { color: var(--color-text-primary, #fff); }
`;

const Features = styled.div`
  display: flex; flex-direction: column; gap: 16px;
  margin-top: 64px; width: 100%; max-width: 360px;
`;

const FeatureCard = styled.div`
  display: flex; align-items: flex-start; gap: 14px;
  text-align: left; padding: 16px;
  background: var(--color-card, #1a1a1a); border: 1px solid var(--color-card-border, #262626);
  border-radius: 16px;
`;

const FeatureTitle = styled.div`
  color: var(--color-text-primary, #fff); font-weight: 700; font-size: 14px; margin-bottom: 3px;
`;
const FeatureDesc = styled.div`
  color: var(--color-text-muted, #737373); font-size: 12px; line-height: 1.5;
`;

const features = [
  { icon: MapPin, color: "#3b82f6", title: "Discover nearby bars", desc: "Find pubs, clubs, and lounges near you with live open/closed status and distance." },
  { icon: Users, color: "#10b981", title: "Join events & crawls", desc: "Create or join pub crawls, after-work drinks, and club nights. Meet new people." },
];

export function LandingPage() {
  const { data: session } = useSession();
  const router = useRouter();

  // Redirect authenticated users to home
  if (session) {
    router.replace("/home-redirect");
    return null;
  }

  return (
    <Page>
      <Hero>
        <Image src="/hoppr-neon-nobg.png" alt="Hoppr" width={120} height={120} priority />
        <Tagline>Discover Finland's nightlife</Tagline>
        <Subtitle>
          Find bars, join pub crawls, and discover the best of Helsinki nightlife — all in one place.
        </Subtitle>
      </Hero>

      <CTA onClick={() => router.push("/register")}>
        Get Started <ArrowRight size={18} />
      </CTA>
      <SignInLink onClick={() => router.push("/login")}>
        Already have an account? Sign in
      </SignInLink>

      <Features>
        {features.map((f) => (
          <FeatureCard key={f.title}>
            <div style={{ minWidth: "40px", height: "40px", background: `${f.color}15`, borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <f.icon size={20} color={f.color} weight="fill" />
            </div>
            <div>
              <FeatureTitle>{f.title}</FeatureTitle>
              <FeatureDesc>{f.desc}</FeatureDesc>
            </div>
          </FeatureCard>
        ))}
      </Features>
    </Page>
  );
}
