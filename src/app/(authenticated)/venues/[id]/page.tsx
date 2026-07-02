import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { VenueDetail } from "@/components/venues/VenueDetail";

interface VenuePageProps {
  params: Promise<{ id: string }>;
}

const TYPE_LABELS: Record<string, string> = {
  PUB: "Pub",
  CLUB: "Club",
  LOUNGE: "Lounge",
  COCKTAIL_BAR: "Cocktail Bar",
  RESTAURANT_BAR: "Restaurant Bar",
  SPORTS_BAR: "Sports Bar",
  KARAOKE: "Karaoke Bar",
  LIVE_MUSIC: "Live Music Venue",
  WINE_BAR: "Wine Bar",
  BREWERY_TAPROOM: "Brewery Taproom",
  COCKTAIL_LOUNGE: "Cocktail Lounge",
};

export async function generateMetadata({
  params,
}: VenuePageProps): Promise<Metadata> {
  const { id } = await params;

  try {
    const venue = await prisma.bar.findUnique({
      where: { id },
      select: {
        name: true,
        description: true,
        type: true,
        district: true,
        cityName: true,
        coverImage: true,
        imageUrls: true,
      },
    });

    if (!venue) {
      return { title: "Venue not found" };
    }

    const typeLabel =
      TYPE_LABELS[venue.type] || venue.type?.replace(/_/g, " ") || "Bar";
    const location = venue.district || venue.cityName || "Finland";
    const title = `${venue.name} — Full Menu, Crowd Levels & Events`;

    const description = venue.description
      ? venue.description.slice(0, 160)
      : `${venue.name} is a ${typeLabel.toLowerCase()} in ${location}. Check out the menu, upcoming events, crowd levels, and promotions on Hoppr.`;

    const ogImage = venue.coverImage || venue.imageUrls?.[0];

    return {
      title,
      description,
      openGraph: {
        title: `${venue.name} — ${typeLabel} in ${location}`,
        description,
        type: "website",
        images: ogImage
          ? [{ url: ogImage, width: 1200, height: 630, alt: venue.name }]
          : [],
      },
      twitter: {
        card: "summary_large_image",
        title: `${venue.name} — ${typeLabel} in ${location}`,
        description,
        images: ogImage ? [ogImage] : [],
      },
      alternates: {
        canonical: `/venues/${id}`,
      },
    };
  } catch {
    return { title: "Venue" };
  }
}

export default function VenueDetailPage() {
  return <VenueDetail />;
}
