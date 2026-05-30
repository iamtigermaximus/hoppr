import { PrismaClient } from "@prisma/client";
import { mockPromotions, mockVenues } from "../src/lib/marketing-api";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding mock promotions into business_promotions table...\n");

  // Collect unique venue IDs used by promotions
  const venueIds = [...new Set(mockPromotions.map((p) => p.venueId))];

  // Ensure each venue exists as a Bar in business_bars
  for (const vid of venueIds) {
    const venue = mockVenues.find((v) => v.id === vid);
    if (!venue) continue;

    await prisma.$executeRawUnsafe(
      `INSERT INTO business_bars (id, name, address, latitude, longitude, "isActive", "claimStatus", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, true, 'UNCLAIMED', NOW(), NOW())
       ON CONFLICT (id) DO NOTHING`,
      vid,
      venue.name,
      venue.address,
      venue.lat,
      venue.lng
    );
  }
  console.log(`Ensured ${venueIds.length} bars exist in business_bars.\n`);

  // Now seed promotions
  let created = 0;
  let skipped = 0;

  for (const promo of mockPromotions) {
    // Check if already seeded by title + barId
    const existing = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
      `SELECT id FROM business_promotions WHERE title = $1 AND "barId" = $2 LIMIT 1`,
      promo.title,
      promo.venueId
    );

    if (existing.length > 0) {
      console.log(`  [SKIP] "${promo.title}" at ${promo.venueName} already exists`);
      skipped++;
      continue;
    }

    await prisma.$executeRawUnsafe(
      `INSERT INTO business_promotions (id, title, description, "barId", "imageUrl", "startDate", "endDate", "discountType", "isActive", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, NOW(), NOW())`,
      promo.id,
      promo.title,
      promo.description,
      promo.venueId,
      promo.imageUrl || null,
      new Date(promo.validFrom),
      new Date(promo.validTo),
      promo.type
    );

    console.log(`  [OK] "${promo.title}" at ${promo.venueName} (barId: ${promo.venueId})`);
    created++;
  }

  console.log(`\nDone: ${created} created, ${skipped} skipped.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
