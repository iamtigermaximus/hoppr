import type { Metadata } from "next";
import { StyledComponentsRegistry } from "@/lib/registry";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hoppr — Discover. Crawl. Connect.",
  description: "Finland's drinking establishments, unified.",
  viewport: "width=device-width, initial-scale=1, viewport-fit=cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <StyledComponentsRegistry>{children}</StyledComponentsRegistry>
      </body>
    </html>
  );
}
