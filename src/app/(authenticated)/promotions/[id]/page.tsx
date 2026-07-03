import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import PromoDetail from "@/components/promotions/PromoDetail";

interface PromoPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: PromoPageProps): Promise<Metadata> {
  const { id } = await params;

  try {
    const promo = await prisma.barPromotion.findUnique({
      where: { id },
      select: {
        title: true,
        description: true,
        imageUrl: true,
        bar: { select: { name: true } },
      },
    });

    if (!promo) {
      return { title: "Promotion not found" };
    }

    const title = `${promo.title} at ${promo.bar.name}`;

    const description = promo.description
      ? promo.description.slice(0, 160)
      : `${promo.title} is now available at ${promo.bar.name}. Check it out on Hoppr.`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: "article",
        images: promo.imageUrl
          ? [{ url: promo.imageUrl, width: 1200, height: 630, alt: promo.title }]
          : [],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: promo.imageUrl ? [promo.imageUrl] : [],
      },
      alternates: {
        canonical: `/promotions/${id}`,
      },
    };
  } catch {
    return { title: "Promotion" };
  }
}

export default function PromoDetailPage() {
  return <PromoDetail />;
}
