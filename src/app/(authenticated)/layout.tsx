"use client";
import { ThemeProvider } from "@/components/contexts/ThemeContext";
import { SocketProvider } from "@/components/contexts/SocketContext";
import { AppHeader } from "@/components/app/AppHeader";
import { BottomNav } from "@/components/ui/BottomNav";
import { ToastProvider } from "@/components/ui/Toast";
import styled from "styled-components";

const Main = styled.main`
  padding: 0 16px 80px;
  min-height: 100dvh;
  max-width: 100%;
  margin: 0 auto;

  @media (min-width: 768px) {
    max-width: 960px;
    padding: 0 24px 20px;
    padding-left: 120px;
  }

  @media (min-width: 1024px) {
    max-width: 1200px;
    padding-left: 120px;
    padding-right: 32px;
  }

  @media (min-width: 1440px) {
    max-width: 1400px;
    padding-left: 120px;
    padding-right: 40px;
  }
`;

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <SocketProvider>
        <ToastProvider>
          <AppHeader />
          <Main>{children}</Main>
          <BottomNav />
        </ToastProvider>
      </SocketProvider>
    </ThemeProvider>
  );
}
