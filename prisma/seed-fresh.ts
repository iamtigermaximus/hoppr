import { PrismaClient, PromotionType, VIPPassType } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding fresh promotions, passes, and trending data...\n");

  // Clean up stale promotions (no images or old test data)
  const staleDeleted = await prisma.barPromotion.deleteMany({
    where: { imageUrl: null },
  });
  if (staleDeleted.count > 0) console.log(`🧹 Cleaned ${staleDeleted.count} stale promotion(s)\n`);

  const now = new Date();
  const nextWeek = new Date(now.getTime() + 86400000 * 7);
  const nextMonth = new Date(now.getTime() + 86400000 * 30);
  const twoMonths = new Date(now.getTime() + 86400000 * 60);

  // Venue IDs
  const MIDNIGHT = "cmo6e72q2000giy8argyg0bdi";
  const GOLDEN_PINT = "cmo6e72lr000eiy8aqfnus9r1";
  const SKY_LOUNGE = "cmo6e72tn000iiy8aec4lj761";
  const STRUTS = "cmomwncww0005l5048397c0rz";
  const CLUB_X = "cmpt74cut000biynodhao5fba";
  const BREWDOG = "cmpt74cuf000aiyno0o3g51mf";
  const OMALLEYS = "cmpt74cie0008iynokhbgl3ja";

  // ============================================
  // 1. UPDATE QUALITY SCORES FOR TRENDING
  // ============================================
  console.log("📊 Updating quality scores...");
  const scoreUpdates = [
    { id: MIDNIGHT, qualityScore: 92, profileViews: 2500, directionClicks: 1200, vipEnabled: true },
    { id: SKY_LOUNGE, qualityScore: 88, profileViews: 1800, directionClicks: 800 },
    { id: GOLDEN_PINT, qualityScore: 85, profileViews: 3200, directionClicks: 1500 },
    { id: CLUB_X, qualityScore: 90, profileViews: 4100, directionClicks: 2100, vipEnabled: true },
    { id: STRUTS, qualityScore: 78, profileViews: 900, directionClicks: 400 },
  ];
  for (const s of scoreUpdates) {
    await prisma.bar.update({ where: { id: s.id }, data: s });
    console.log(`   ✅ ${s.id.slice(-8)} → score ${s.qualityScore}`);
  }

  // ============================================
  // 2. UPDATE VENUE COVER IMAGES
  // ============================================
  console.log("\n🖼️ Updating venue cover images...");
  const venueImages: Record<string, string> = {
    [MIDNIGHT]: "https://images.unsplash.com/photo-1566417713940-fe7c737a9ef2?w=1200&h=800&fit=crop",
    [CLUB_X]: "https://images.unsplash.com/photo-1574391884720-bbc4e5e1bfb6?w=1200&h=800&fit=crop",
    [SKY_LOUNGE]: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=1200&h=800&fit=crop",
    [GOLDEN_PINT]: "https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=1200&h=800&fit=crop",
    [STRUTS]: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1200&h=800&fit=crop",
    [BREWDOG]: "https://images.unsplash.com/photo-1598621047089-9a5c3c45e2e3?w=1200&h=800&fit=crop",
    [OMALLEYS]: "https://images.unsplash.com/photo-1577221084712-45b0445d2b00?w=1200&h=800&fit=crop",
  };
  for (const [id, img] of Object.entries(venueImages)) {
    await prisma.bar.update({ where: { id }, data: { coverImage: img } });
    console.log(`   ✅ ${id.slice(-8)} → cover image`);
  }

  // ============================================
  // 3. CREATE CURRENT PROMOTIONS
  // ============================================
  console.log("\n🎫 Creating promotions...");

  const promotions: Array<{
    id: string; barId: string; title: string; description: string; type: PromotionType;
    imageUrl?: string; accentColor?: string; priority: number; discount?: number;
    startDate: Date; endDate: Date; validDays: string[]; conditions: string[];
  }> = [
    // Midnight Club
    { id: "seed-promo-mc-ladies", barId: MIDNIGHT, title: "Ladies' Night — Free Entry 'til Midnight", type: "LADIES_NIGHT", description: "Ladies get free entry and a complimentary welcome drink until midnight. DJ Luna spinning R&B and hip-hop all night.", imageUrl: "https://images.unsplash.com/photo-1566417713940-fe7c737a9ef2?w=800&h=600&fit=crop", accentColor: "#831843", priority: 3, discount: 100, startDate: now, endDate: nextMonth, validDays: ["friday", "saturday"], conditions: ["Valid for ladies only", "Before midnight", "One welcome drink"] },
    { id: "seed-promo-mc-vip", barId: MIDNIGHT, title: "Saturday VIP — Bottle Service €150", type: "VIP_OFFER", description: "Premium bottle service with reserved seating in the VIP mezzanine. Includes one bottle of premium spirits + 4 mixers.", imageUrl: "https://images.unsplash.com/photo-1575444758702-4a6b9222336e?w=800&h=600&fit=crop", accentColor: "#4c1d95", priority: 2, discount: 25, startDate: now, endDate: twoMonths, validDays: ["saturday"], conditions: ["Booking required", "Minimum 4 people"] },
    { id: "seed-promo-mc-student", barId: MIDNIGHT, title: "Student Thursdays — 50% Off Drinks", type: "STUDENT_DISCOUNT", description: "Show your student ID for 50% off all drinks. DJ sets from 9 PM. Best Thursday party in Kamppi.", imageUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=600&fit=crop", accentColor: "#065f46", priority: 2, discount: 50, startDate: now, endDate: new Date(now.getTime() + 86400000 * 90), validDays: ["thursday"], conditions: ["Valid student ID required", "Excludes premium spirits"] },
    // Sky Lounge
    { id: "seed-promo-sl-sunset", barId: SKY_LOUNGE, title: "Sunset Cocktails — 2-for-1", type: "DRINK_SPECIAL", description: "Buy one get one free on all signature cocktails during sunset hours. Enjoy panoramic Helsinki views from the rooftop.", imageUrl: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=800&h=600&fit=crop", accentColor: "#b45309", priority: 3, discount: 50, startDate: now, endDate: nextMonth, validDays: ["monday", "tuesday", "wednesday", "thursday", "friday"], conditions: ["5 PM – 8 PM only", "Equal or lesser value"] },
    { id: "seed-promo-sl-date", barId: SKY_LOUNGE, title: "Date Night — 3-Course + Wine €55/pp", type: "FOOD_SPECIAL", description: "Romantic three-course dinner with paired wines. Rooftop table included. Perfect for a special evening.", imageUrl: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=600&fit=crop", accentColor: "#991b1b", priority: 2, startDate: now, endDate: twoMonths, validDays: ["friday", "saturday"], conditions: ["Reservation required", "48h advance booking"] },
    // Golden Pint
    { id: "seed-promo-gp-happy", barId: GOLDEN_PINT, title: "Happy Hour — €3.50 Pints", type: "HAPPY_HOUR", description: "All Finnish draft beers just €3.50. The best after-work deal in Kallio. Kitchen open until 10 PM.", imageUrl: "https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=800&h=600&fit=crop", accentColor: "#064e3b", priority: 3, discount: 40, startDate: now, endDate: new Date(now.getTime() + 86400000 * 120), validDays: ["monday", "tuesday", "wednesday", "thursday", "friday"], conditions: ["4 PM – 7 PM", "Draft beer only"] },
    { id: "seed-promo-gp-quiz", barId: GOLDEN_PINT, title: "Pub Quiz Tuesdays — Win €100 Tab", type: "GAME_NIGHT", description: "Weekly pub quiz with cash prizes. Teams of 2-6 people. €100 bar tab for 1st place, €50 for 2nd.", imageUrl: "https://images.unsplash.com/photo-1527016021513-b09758b777bd?w=800&h=600&fit=crop", accentColor: "#1e3a5f", priority: 2, startDate: now, endDate: new Date(now.getTime() + 86400000 * 90), validDays: ["tuesday"], conditions: ["Teams of 2-6", "Registration by 7:30 PM"] },
    // Club X
    { id: "seed-promo-cx-dj", barId: CLUB_X, title: "International DJ Series — €10 Entry", type: "LIVE_MUSIC_EVENT", description: "World-class DJs every weekend. This month: house, techno, and progressive. Reduced entry before 11 PM.", imageUrl: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=800&h=600&fit=crop", accentColor: "#7c3aed", priority: 3, startDate: now, endDate: new Date(now.getTime() + 86400000 * 30), validDays: ["friday", "saturday"], conditions: ["€10 before 11 PM", "€15 after"] },
    // Struts
    { id: "seed-promo-st-sunday", barId: STRUTS, title: "Sunday Sessions — Live Acoustic", type: "LIVE_MUSIC_EVENT", description: "Chill Sunday afternoons with live acoustic music. Rotating local artists. Great food and drink specials all day.", imageUrl: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&h=600&fit=crop", accentColor: "#0e7490", priority: 1, startDate: now, endDate: twoMonths, validDays: ["sunday"], conditions: ["Music from 3 PM", "Free entry"] },
    // BrewDog
    { id: "seed-promo-bd-tour", barId: BREWDOG, title: "Brewery Tour + Tasting Flight €20", type: "DRINK_SPECIAL", description: "Behind-the-scenes brewery tour followed by a tasting flight of 6 seasonal brews.", imageUrl: "https://images.unsplash.com/photo-1598621047089-9a5c3c45e2e3?w=800&h=600&fit=crop", accentColor: "#ea580c", priority: 2, discount: 30, startDate: now, endDate: new Date(now.getTime() + 86400000 * 90), validDays: ["saturday", "sunday"], conditions: ["Booking required", "Minimum 4 people"] },
    // O'Malley's
    { id: "seed-promo-om-epl", barId: OMALLEYS, title: "Premier League — All Matches Live", type: "WEEKEND_SPECIAL", description: "Every Premier League match shown live on 12 screens. Match-day food menu and €5 Guinness all day.", imageUrl: "https://images.unsplash.com/photo-1577221084712-45b0445d2b00?w=800&h=600&fit=crop", accentColor: "#15803d", priority: 3, discount: 30, startDate: now, endDate: new Date(now.getTime() + 86400000 * 365), validDays: ["saturday", "sunday"], conditions: ["During live matches"] },
  ];

  for (const promo of promotions) {
    const { id, ...data } = promo;
    await prisma.barPromotion.upsert({
      where: { id },
      update: data,
      create: { id, ...data },
    });
    console.log(`   ✅ ${promo.title}`);
  }

  // ============================================
  // 4. CREATE VIP PASSES
  // ============================================
  console.log("\n🎟️ Creating VIP passes...");

  const passes: Array<{
    id: string; barId: string; name: string; description: string; type: VIPPassType;
    priceCents: number; originalPriceCents: number | null; benefits: string[];
    totalQuantity: number; maxPerUser: number; skipLinePriority: boolean; coverFeeIncluded: boolean;
    validityStart: Date; validityEnd: Date; validDays: string[];
  }> = [
    {
      id: "seed-pass-mc-skip", barId: MIDNIGHT, name: "Midnight Club — Skip Line + Welcome Drink",
      description: "Skip the queue and get a complimentary welcome drink. Priority entry all night.",
      type: "SKIP_LINE", priceCents: 1500, originalPriceCents: 2500,
      benefits: ["Priority skip-the-line entry", "One complimentary welcome drink", "Dedicated entrance"],
      totalQuantity: 100, maxPerUser: 2, skipLinePriority: true, coverFeeIncluded: true,
      validityStart: now, validityEnd: nextMonth, validDays: ["friday", "saturday"],
    },
    {
      id: "seed-pass-mc-vip", barId: MIDNIGHT, name: "Midnight Club — VIP Table Package",
      description: "Reserved VIP table with bottle service for you and your friends. The ultimate Midnight Club experience.",
      type: "PREMIUM_ENTRY", priceCents: 8000, originalPriceCents: 12000,
      benefits: ["Reserved VIP table (up to 6 people)", "One premium bottle + mixers", "Skip-the-line entry", "Personal server", "VIP restroom access"],
      totalQuantity: 20, maxPerUser: 1, skipLinePriority: true, coverFeeIncluded: false,
      validityStart: now, validityEnd: twoMonths, validDays: ["friday", "saturday"],
    },
    {
      id: "seed-pass-mc-cover", barId: MIDNIGHT, name: "Midnight Club — Cover Included Pass",
      description: "Cover fee included for every night. Best value if you're a regular.",
      type: "COVER_INCLUDED", priceCents: 800, originalPriceCents: 1200,
      benefits: ["Cover fee waived every night", "Express entry line"],
      totalQuantity: 200, maxPerUser: 3, skipLinePriority: false, coverFeeIncluded: true,
      validityStart: now, validityEnd: nextMonth, validDays: [],
    },
    {
      id: "seed-pass-cx-skip", barId: CLUB_X, name: "Club X — Weekend Skip-the-Line Pass",
      description: "Skip the line at Club X on Fridays and Saturdays. Helsinki's premier nightclub experience.",
      type: "SKIP_LINE", priceCents: 1200, originalPriceCents: 1800,
      benefits: ["Priority entry weekends", "Skip the queue", "Dedicated guest entrance"],
      totalQuantity: 80, maxPerUser: 2, skipLinePriority: true, coverFeeIncluded: false,
      validityStart: now, validityEnd: nextMonth, validDays: ["friday", "saturday"],
    },
    {
      id: "seed-pass-sl-drinks", barId: SKY_LOUNGE, name: "Sky Lounge — Drink Package (3 Drinks)",
      description: "Three premium drink tokens for the price of two. Valid for cocktails, wine, or premium spirits.",
      type: "DRINK_PACKAGE", priceCents: 2500, originalPriceCents: 3600,
      benefits: ["3 drink tokens", "Valid for premium drinks", "Rooftop access included"],
      totalQuantity: 50, maxPerUser: 2, skipLinePriority: false, coverFeeIncluded: true,
      validityStart: now, validityEnd: twoMonths, validDays: [],
    },
  ];

  for (const pass of passes) {
    const { id, ...data } = pass;
    await prisma.vIPPassEnhanced.upsert({
      where: { id },
      update: data,
      create: {
        id, ...data,
        validHours: undefined,
        coverFeeAmount: 0,
        soldCount: 0,
        isActive: true,
      },
    });
    console.log(`   ✅ ${pass.name} (€${(pass.priceCents / 100).toFixed(2)})`);
  }

  console.log(`\n🎉 Done! ${promotions.length} promos + ${passes.length} passes + ${Object.keys(venueImages).length} cover images + ${scoreUpdates.length} venues scored`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
