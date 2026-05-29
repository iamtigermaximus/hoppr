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

  @media (min-width: 768px) {
    padding: 72px 24px 24px;
    max-width: 100%;
  }

  @media (min-width: 1024px) {
    padding: 72px 32px 32px;
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
