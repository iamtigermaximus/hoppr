"use client";
import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import styled from "styled-components";
import { ThemeProvider } from "@/components/contexts/ThemeContext";
import { SocketProvider } from "@/components/contexts/SocketContext";
import { AppHeader } from "@/components/app/AppHeader";
import { BottomNav } from "@/components/ui/BottomNav";
import { ToastProvider } from "@/components/ui/Toast";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { MagnifyingGlass, ArrowRight } from "@phosphor-icons/react";

// ---- Routes that anyone can browse without logging in ----
const PUBLIC_PATTERNS = [
  /^\/discover/,
  /^\/search/,
  /^\/venues\//,
  /^\/events\/(?!create)/, // allow /events/[id] but NOT /events/create
  /^\/promotions\//,
  /^\/bars/,
  /^\/map/,
  /^\/privacy/,
  /^\/help/,
];

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_PATTERNS.some((p) => p.test(pathname));
}

// ---- Styled components ----

const Main = styled.main`
  padding: 0 16px 80px;
  min-height: 100dvh;
  max-width: 100%;

  @media (min-width: 768px) {
    padding: 72px 24px 24px;
    max-width: 100%;
  }

  @media (min-width: 1024px) {
    padding: 72px 32px 32px;
  }
`;

const LoadingShell = styled.div`
  min-height: 100dvh;
  background: var(--color-bg, #0a0a0a);
  display: flex;
  align-items: center;
  justify-content: center;
`;

// Minimal public header — no avatar, no notifications, no bottom nav
const PublicHeader = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  position: sticky;
  top: 0;
  z-index: 40;
  background: var(--color-bg, #0a0a0a);

  @media (min-width: 768px) {
    display: none;
  }
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const SignInButton = styled(Link)`
  display: flex;
  align-items: center;
  gap: 4px;
  background: linear-gradient(135deg, #7c3aed, #5b21b6);
  color: #fff;
  font-weight: 600;
  font-size: 12px;
  padding: 6px 14px;
  border-radius: 10px;
  text-decoration: none;
`;

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const publicPage = isPublicRoute(pathname);

  useEffect(() => {
    // Only redirect on private routes — public routes are browsable without auth
    if (status === "unauthenticated" && !publicPage) {
      router.replace("/login");
    }
  }, [status, publicPage, router]);

  // Show blank shell while session is loading
  if (status === "loading") {
    return <LoadingShell />;
  }

  // ---- Public browsing (unauthenticated) ----
  if (status === "unauthenticated" && publicPage) {
    return (
      <ThemeProvider>
        <PublicHeader>
          <HeaderLeft>
            <Link href="/">
              <Image
                src="/hoppr-neon-nobg.png"
                alt="Hoppr"
                width={64}
                height={52}
                priority
              />
            </Link>
            <Link
              href="/search"
              style={{ display: "inline-flex", alignItems: "center" }}
            >
              <MagnifyingGlass size={18} color="#737373" />
            </Link>
          </HeaderLeft>
          <SignInButton href="/login">
            Sign in <ArrowRight size={12} />
          </SignInButton>
        </PublicHeader>
        <Main style={{ paddingBottom: "32px" }}>{children}</Main>
      </ThemeProvider>
    );
  }

  // ---- Authenticated (or public page viewed by logged-in user) ----
  return (
    <ThemeProvider>
      <SocketProvider>
        <ToastProvider>
          <AppHeader />
          <Main>
            <ErrorBoundary label="This page">
              {children}
            </ErrorBoundary>
          </Main>
          <BottomNav />
        </ToastProvider>
      </SocketProvider>
    </ThemeProvider>
  );
}
