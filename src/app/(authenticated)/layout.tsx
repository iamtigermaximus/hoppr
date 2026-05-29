"use client";
import { ThemeProvider } from "@/components/contexts/ThemeContext";
import { SocketProvider } from "@/components/contexts/SocketContext";
import { AppHeader } from "@/components/app/AppHeader";
import { BottomNav } from "@/components/ui/BottomNav";
import styled from "styled-components";

const Main = styled.main`
  padding-bottom: 80px;
  min-height: 100dvh;
  max-width: 600px;
  margin: 0 auto;

  @media (min-width: 768px) {
    max-width: 960px;
    padding-bottom: 20px;
    padding-left: 96px;
    padding-right: 16px;
  }

  @media (min-width: 1024px) {
    max-width: 1024px;
    padding-left: 96px;
    padding-right: 24px;
  }
`;

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <SocketProvider>
        <AppHeader />
        <Main>{children}</Main>
        <BottomNav />
      </SocketProvider>
    </ThemeProvider>
  );
}
