import type { Metadata, Viewport } from "next";
import { StyledComponentsRegistry } from "@/lib/registry";
import { AuthProvider } from "@/components/contexts/AuthContext";
import { QueryProvider } from "@/components/contexts/QueryProvider";
import { PushNotificationProvider } from "@/components/contexts/PushNotificationProvider";
import AppShell from "@/components/AppShell";
import "leaflet/dist/leaflet.css";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0a0a0a",
};

const BASE_URL =
  process.env.NEXT_PUBLIC_CONSUMER_URL || "https://hoppr.fi";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "Hoppr — Discover. Crawl. Connect.",
    template: "%s | Hoppr",
  },
  description:
    "Discover the best bars, clubs, events, promotions, and VIP passes in Finland. Real-time crowd levels, full menus, and exclusive deals — all in one app.",
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
  openGraph: {
    type: "website",
    siteName: "Hoppr",
    title: "Hoppr — Discover. Crawl. Connect.",
    description:
      "Discover the best bars, clubs, events, promotions, and VIP passes in Finland. Real-time crowd levels, full menus, and exclusive deals.",
    url: BASE_URL,
    images: [
      {
        url: "/og-default.png",
        width: 1200,
        height: 630,
        alt: "Hoppr — Discover. Crawl. Connect.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Hoppr — Discover. Crawl. Connect.",
    description:
      "Discover the best bars, clubs, events, promotions, and VIP passes in Finland.",
    images: ["/og-default.png"],
  },
  robots: {
    index: true,
    follow: true,
    "max-image-preview": "large",
    "max-snippet": -1,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <StyledComponentsRegistry>
          <AuthProvider>
              <PushNotificationProvider>
                <QueryProvider>
                  <AppShell>{children}</AppShell>
                </QueryProvider>
              </PushNotificationProvider>
            </AuthProvider>
        </StyledComponentsRegistry>
      </body>
    </html>
  );
}
