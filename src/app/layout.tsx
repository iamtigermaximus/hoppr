import type { Metadata, Viewport } from "next";
import { StyledComponentsRegistry } from "@/lib/registry";
import { AuthProvider } from "@/components/contexts/AuthContext";
import { QueryProvider } from "@/components/contexts/QueryProvider";
import { PushNotificationProvider } from "@/components/contexts/PushNotificationProvider";
import "leaflet/dist/leaflet.css";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0a0a0a",
};

export const metadata: Metadata = {
  title: "Hoppr — Discover. Crawl. Connect.",
  description: "Finland's drinking establishments, unified.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Hoppr",
  },
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
            <PushNotificationProvider>
              <QueryProvider>{children}</QueryProvider>
            </PushNotificationProvider>
          </AuthProvider>
        </StyledComponentsRegistry>
      </body>
    </html>
  );
}
