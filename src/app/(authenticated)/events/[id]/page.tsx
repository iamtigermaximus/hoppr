import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { EventDetail } from "@/components/events/EventDetail";

interface EventPageProps {
  params: Promise<{ id: string }>;
}

function formatEventDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export async function generateMetadata({
  params,
}: EventPageProps): Promise<Metadata> {
  const { id } = await params;

  try {
    const event = await prisma.event.findUnique({
      where: { id },
      select: {
        title: true,
        description: true,
        venueName: true,
        venueType: true,
        startTime: true,
        imageUrl: true,
      },
    });

    if (!event) {
      return { title: "Event not found" };
    }

    const title = `${event.title} at ${event.venueName}`;

    const description = event.description
      ? event.description.slice(0, 160)
      : `${event.title} is happening at ${event.venueName} on ${formatEventDate(event.startTime)}. Check it out on Hoppr.`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: "article",
        images: event.imageUrl
          ? [{ url: event.imageUrl, width: 1200, height: 630, alt: event.title }]
          : [],
        publishedTime: event.startTime.toISOString(),
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: event.imageUrl ? [event.imageUrl] : [],
      },
      alternates: {
        canonical: `/events/${id}`,
      },
    };
  } catch {
    return { title: "Event" };
  }
}

export default async function EventDetailPage({ params }: EventPageProps) {
  const { id } = await params;
  return <EventDetail id={id} />;
}
