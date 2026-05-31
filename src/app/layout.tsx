import type { Metadata } from "next";
import { StyledComponentsRegistry } from "@/lib/registry";
import { AuthProvider } from "@/components/contexts/AuthContext";
import { QueryProvider } from "@/components/contexts/QueryProvider";
import "leaflet/dist/leaflet.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hoppr — Discover. Crawl. Connect.",
  description: "Finland's drinking establishments, unified.",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <StyledComponentsRegistry>
          <AuthProvider>
            <QueryProvider>{children}</QueryProvider>
          </AuthProvider>
        </StyledComponentsRegistry>
      </body>
    </html>
  );
}
