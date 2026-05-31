import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create test users
  const hashedPassword = await bcrypt.hash("password123", 12);

  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: "emma@example.com" },
      update: {},
      create: {
        email: "emma@example.com", username: "emma_nights", hashedPassword,
        name: "Emma Nights",
        bio: "Helsinki nightlife explorer. Love pub crawls and live music!",
        image: "https://i.pravatar.cc/200?u=emma",
        instagram: "@emmahelsinki",
        interests: ["pub crawls", "live music", "karaoke"],
        languages: ["Finnish", "English", "Swedish"],
        drinkPrefs: ["PUB", "LIVE_MUSIC", "KARAOKE"],
        gallery: [],
      },
    }),
    prisma.user.upsert({
      where: { email: "mikko@example.com" },
      update: {},
      create: {
        email: "mikko@example.com", username: "mikko_beers", hashedPassword,
        name: "Mikko Beers",
        bio: "Craft beer enthusiast. BrewDog regular. Always hunting for the best IPA in Finland.",
        image: "https://i.pravatar.cc/200?u=mikko",
        instagram: "@mikkobeers",
        interests: ["craft beer", "brewery tours", "beer tasting"],
        languages: ["Finnish", "English"],
        drinkPrefs: ["BREWERY_TAPROOM", "PUB"],
        gallery: [],
      },
    }),
    prisma.user.upsert({
      where: { email: "sofia@example.com" },
      update: {},
      create: {
        email: "sofia@example.com", username: "sofia_clubs", hashedPassword,
        name: "Sofia Clubs",
        bio: "DJ and nightlife lover. You'll find me at Club X most weekends.",
        image: "https://i.pravatar.cc/200?u=sofia",
        instagram: "@sofiaclubs",
        interests: ["techno", "house music", "dancing"],
        languages: ["Finnish", "English", "Spanish"],
        drinkPrefs: ["CLUB", "COCKTAIL_LOUNGE"],
        gallery: [],
      },
    }),
    prisma.user.upsert({
      where: { email: "alex@example.com" },
      update: {},
      create: {
        email: "alex@example.com", username: "alex_sports", hashedPassword,
        name: "Alex Sports",
        bio: "Sports fanatic. Premier League every weekend at O'Malley's. Game day is sacred.",
        image: "https://i.pravatar.cc/200?u=alex",
        interests: ["football", "NFL", "darts"],
        languages: ["English", "Finnish"],
        drinkPrefs: ["SPORTS_BAR", "PUB"],
        gallery: [],
      },
    }),
    prisma.user.upsert({
      where: { email: "leena@example.com" },
      update: {},
      create: {
        email: "leena@example.com", username: "leena_wine", hashedPassword,
        name: "Leena Wine",
        bio: "Sommelier in training. Love discovering new wines and cozy wine bars.",
        image: "https://i.pravatar.cc/200?u=leena",
        instagram: "@leenawine",
        interests: ["wine tasting", "cheese pairing", "quiet evenings"],
        languages: ["Finnish", "English", "French", "Italian"],
        drinkPrefs: ["WINE_BAR", "COCKTAIL_LOUNGE"],
        gallery: [],
      },
    }),
  ]);

  console.log(`✅ Created ${users.length} users`);

  // Create test bars (required for event/pass foreign keys)
  const bars = await Promise.all([
    prisma.bar.upsert({
      where: { name: "Bar Loose" },
      update: {},
      create: {
        name: "Bar Loose", address: "Annankatu 21, Helsinki", cityName: "Helsinki",
        district: "Kamppi", type: "PUB", latitude: 60.1675, longitude: 24.9365,
        description: "Legendary rock bar in the heart of Kamppi. Live music every weekend.",
        priceRange: "MODERATE", amenities: ["live music", "dj", "dance floor"],
        imageUrls: [], status: "VERIFIED", isVerified: true,
      },
    }),
    prisma.bar.upsert({
      where: { name: "Club X" },
      update: {},
      create: {
        name: "Club X", address: "Mannerheimintie 12, Helsinki", cityName: "Helsinki",
        district: "City Centre", type: "CLUB", latitude: 60.1710, longitude: 24.9380,
        description: "Helsinki's premier nightclub. International DJs every weekend.",
        priceRange: "PREMIUM", amenities: ["dj", "vip area", "coat check"],
        imageUrls: [], status: "VERIFIED", isVerified: true, vipEnabled: true,
      },
    }),
    prisma.bar.upsert({
      where: { name: "BrewDog Helsinki" },
      update: {},
      create: {
        name: "BrewDog Helsinki", address: "Tarkk'ampujankatu 20, Helsinki", cityName: "Helsinki",
        district: "Punavuori", type: "BREWERY_TAPROOM", latitude: 60.1600, longitude: 24.9410,
        description: "Craft beer paradise with 20 taps. Seasonal brews and tasting flights.",
        priceRange: "MODERATE", amenities: ["outdoor seating", "food", "dog friendly"],
        imageUrls: [], status: "VERIFIED", isVerified: true,
      },
    }),
    prisma.bar.upsert({
      where: { name: "The Old Pub" },
      update: {},
      create: {
        name: "The Old Pub", address: "Bulevardi 10, Helsinki", cityName: "Helsinki",
        district: "Kamppi", type: "PUB", latitude: 60.1650, longitude: 24.9350,
        description: "Cozy traditional pub. Great for after-work drinks.",
        priceRange: "BUDGET", amenities: ["food", "sports screens"],
        imageUrls: [], status: "VERIFIED", isVerified: true,
      },
    }),
    prisma.bar.upsert({
      where: { name: "Karaoke Star" },
      update: {},
      create: {
        name: "Karaoke Star", address: "Yrjönkatu 24, Helsinki", cityName: "Helsinki",
        district: "City Centre", type: "KARAOKE", latitude: 60.1680, longitude: 24.9390,
        description: "Helsinki's favorite karaoke spot. Private rooms available.",
        priceRange: "MODERATE", amenities: ["karaoke", "private rooms", "food"],
        imageUrls: [], status: "VERIFIED", isVerified: true,
      },
    }),
    prisma.bar.upsert({
      where: { name: "Viiinibaari" },
      update: {},
      create: {
        name: "Viiinibaari", address: "Uudenmaankatu 12, Helsinki", cityName: "Helsinki",
        district: "Punavuori", type: "WINE_BAR", latitude: 60.1620, longitude: 24.9430,
        description: "Intimate wine bar specializing in natural wines and Finnish cheese pairings.",
        priceRange: "PREMIUM", amenities: ["food", "outdoor seating"],
        imageUrls: [], status: "VERIFIED", isVerified: true,
      },
    }),
    prisma.bar.upsert({
      where: { name: "O'Malley's" },
      update: {},
      create: {
        name: "O'Malley's", address: "Iso Roobertinkatu 15, Helsinki", cityName: "Helsinki",
        district: "Punavuori", type: "SPORTS_BAR", latitude: 60.1630, longitude: 24.9440,
        description: "Premier sports bar with 12 screens. Premier League, NFL, and more.",
        priceRange: "MODERATE", amenities: ["sports screens", "food", "outdoor seating"],
        imageUrls: [], status: "VERIFIED", isVerified: true,
      },
    }),
  ]);

  const barIds = Object.fromEntries(bars.map(b => [b.name, b.id]));
  console.log(`✅ Created ${bars.length} bars`);

  // Create crowd reports for ~50% of bars
  const twoHours = 2 * 60 * 60 * 1000;
  const crowdReports = await Promise.all([
    prisma.crowdReport.create({
      data: {
        barId: barIds["Bar Loose"],
        level: "PACKED",
        reportedBy: users[0].id,
        reportedAt: new Date(Date.now() - 5 * 60000),
        expiresAt: new Date(Date.now() + twoHours - 5 * 60000),
      },
    }),
    prisma.crowdReport.create({
      data: {
        barId: barIds["Club X"],
        level: "BUSY",
        reportedBy: users[2].id,
        reportedAt: new Date(Date.now() - 15 * 60000),
        expiresAt: new Date(Date.now() + twoHours - 15 * 60000),
      },
    }),
    prisma.crowdReport.create({
      data: {
        barId: barIds["BrewDog Helsinki"],
        level: "GETTING_BUSY",
        reportedBy: users[1].id,
        reportedAt: new Date(Date.now() - 30 * 60000),
        expiresAt: new Date(Date.now() + twoHours - 30 * 60000),
      },
    }),
    prisma.crowdReport.create({
      data: {
        barId: barIds["Karaoke Star"],
        level: "QUIET",
        reportedBy: users[0].id,
        reportedAt: new Date(Date.now() - 2 * 60000),
        expiresAt: new Date(Date.now() + twoHours - 2 * 60000),
      },
    }),
  ]);
  console.log(`✅ Created ${crowdReports.length} crowd reports`);

  // Create sample ad campaigns
  const thirtyDays = 30 * 86400000;
  const adCampaigns = await Promise.all([
    prisma.adCampaign.create({
      data: {
        barId: barIds["Bar Loose"],
        title: "Bar Loose — Helsinki's Best Pub",
        description: "Come experience Helsinki's most authentic pub atmosphere. Great drinks, better company.",
        type: "FEATURED_LISTING",
        status: "ACTIVE",
        budgetCents: 5000,
        spentCents: 1200,
        impressions: 450,
        clicks: 32,
        startDate: new Date(Date.now() - 7 * 86400000),
        endDate: new Date(Date.now() + 23 * 86400000),
        complianceStatus: "COMPLIANT",
      },
    }),
    prisma.adCampaign.create({
      data: {
        barId: barIds["Club X"],
        title: "Club X — Weekend VIP",
        description: "The ultimate nightlife experience in Helsinki. VIP entry, premium drinks.",
        type: "BANNER_AD",
        status: "ACTIVE",
        budgetCents: 8000,
        spentCents: 3200,
        impressions: 820,
        clicks: 67,
        imageUrl: null,
        startDate: new Date(Date.now() - 3 * 86400000),
        endDate: new Date(Date.now() + 27 * 86400000),
        complianceStatus: "COMPLIANT",
      },
    }),
    prisma.adCampaign.create({
      data: {
        barId: barIds["BrewDog Helsinki"],
        title: "Craft Beer Special — Boosted",
        description: "Check out our rotating craft beer selection. New taps every week.",
        type: "BOOSTED_PROMO",
        status: "ACTIVE",
        budgetCents: 3000,
        spentCents: 800,
        impressions: 280,
        clicks: 18,
        startDate: new Date(Date.now() - 5 * 86400000),
        endDate: new Date(Date.now() + 25 * 86400000),
        complianceStatus: "COMPLIANT",
      },
    }),
    prisma.adCampaign.create({
      data: {
        barId: barIds["O'Malley's"],
        title: "O'Malley's Sports Night",
        description: "Watch the game with us! Best sports bar experience in Punavuori.",
        type: "FEATURED_LISTING",
        status: "DRAFT",
        budgetCents: 4000,
        spentCents: 0,
        impressions: 0,
        clicks: 0,
        startDate: new Date(Date.now() + 14 * 86400000),
        endDate: new Date(Date.now() + 44 * 86400000),
        complianceStatus: "PENDING_REVIEW",
      },
    }),
  ]);
  console.log(`✅ Created ${adCampaigns.length} ad campaigns`);

  // Create events
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 86400000);
  const saturday = new Date(now.getTime() + 86400000 * 2);
  const nextWeek = new Date(now.getTime() + 86400000 * 7);

  const events = await Promise.all([
    prisma.event.create({
      data: {
        title: "Friday Night Pub Crawl",
        description: "Starting at Bar Loose, we'll hit 4 pubs in Kamppi. Come join us for a legendary night out! All welcome.",
        venueId: barIds["Bar Loose"], venueName: "Bar Loose", venueType: "PUB",
        startTime: new Date(now.getTime() + 6 * 3600000),
        endTime: new Date(now.getTime() + 12 * 3600000),
        maxAttendees: 20, isPrivate: false, creatorId: users[0].id,
      },
    }),
    prisma.event.create({
      data: {
        title: "Craft Beer Tasting Night",
        description: "Exploring BrewDog's newest seasonal releases. Limited spots!",
        venueId: barIds["BrewDog Helsinki"], venueName: "BrewDog Helsinki", venueType: "BREWERY_TAPROOM",
        startTime: new Date(tomorrow.getTime() + 18 * 3600000),
        maxAttendees: 12, isPrivate: false, creatorId: users[1].id,
      },
    }),
    prisma.event.create({
      data: {
        title: "Club Night w/ DJ Maki",
        description: "Techno all night at Club X. Guest DJ set by Maki. Don't miss out!",
        venueId: barIds["Club X"], venueName: "Club X", venueType: "CLUB",
        startTime: new Date(saturday.getTime() + 22 * 3600000),
        endTime: new Date(saturday.getTime() + 28 * 3600000),
        maxAttendees: 50, isPrivate: false, creatorId: users[2].id,
      },
    }),
    prisma.event.create({
      data: {
        title: "After-Work Drinks",
        description: "Casual after-work gathering at The Old Pub.",
        venueId: barIds["The Old Pub"], venueName: "The Old Pub", venueType: "PUB",
        startTime: new Date(tomorrow.getTime() + 16 * 3600000),
        maxAttendees: 30, isPrivate: false, creatorId: users[3].id,
      },
    }),
    prisma.event.create({
      data: {
        title: "Wine & Cheese Evening",
        description: "Tasting event at Viiinibaari. 5 wines paired with Finnish cheeses.",
        venueId: barIds["Viiinibaari"], venueName: "Viiinibaari", venueType: "WINE_BAR",
        startTime: new Date(saturday.getTime() + 19 * 3600000),
        maxAttendees: 15, isPrivate: false, creatorId: users[4].id,
      },
    }),
    prisma.event.create({
      data: {
        title: "Karaoke Showdown",
        description: "Monthly karaoke competition at Karaoke Star. Winner gets a €50 bar tab!",
        venueId: barIds["Karaoke Star"], venueName: "Karaoke Star", venueType: "KARAOKE",
        startTime: new Date(nextWeek.getTime() + 20 * 3600000),
        maxAttendees: 25, isPrivate: false, creatorId: users[0].id,
      },
    }),
    prisma.event.create({
      data: {
        title: "Sunday Football — Premier League",
        description: "All games on 12 screens. Drink specials during the matches.",
        venueId: barIds["O'Malley's"], venueName: "O'Malley's", venueType: "SPORTS_BAR",
        startTime: new Date(saturday.getTime() + 14 * 3600000),
        maxAttendees: 40, isPrivate: false, creatorId: users[3].id,
      },
    }),
  ]);

  console.log(`✅ Created ${events.length} events`);

  // Join users to events
  const participants = [];
  for (const event of events) {
    participants.push(
      prisma.eventParticipant.create({ data: { userId: users[0].id, eventId: event.id } })
    );
  }
  participants.push(
    prisma.eventParticipant.create({ data: { userId: users[1].id, eventId: events[0].id } }),
    prisma.eventParticipant.create({ data: { userId: users[1].id, eventId: events[3].id } }),
    prisma.eventParticipant.create({ data: { userId: users[1].id, eventId: events[5].id } }),
    prisma.eventParticipant.create({ data: { userId: users[1].id, eventId: events[6].id } }),
  );
  participants.push(
    prisma.eventParticipant.create({ data: { userId: users[2].id, eventId: events[0].id } }),
    prisma.eventParticipant.create({ data: { userId: users[2].id, eventId: events[2].id } }),
    prisma.eventParticipant.create({ data: { userId: users[2].id, eventId: events[3].id } }),
  );
  participants.push(
    prisma.eventParticipant.create({ data: { userId: users[3].id, eventId: events[0].id } }),
    prisma.eventParticipant.create({ data: { userId: users[3].id, eventId: events[3].id } }),
    prisma.eventParticipant.create({ data: { userId: users[3].id, eventId: events[6].id } }),
  );
  participants.push(
    prisma.eventParticipant.create({ data: { userId: users[4].id, eventId: events[0].id } }),
    prisma.eventParticipant.create({ data: { userId: users[4].id, eventId: events[3].id } }),
    prisma.eventParticipant.create({ data: { userId: users[4].id, eventId: events[4].id } }),
  );

  await Promise.all(participants);

  // Create chat rooms for events
  for (const event of events) {
    await prisma.eventChatRoom.upsert({
      where: { eventId: event.id },
      update: {},
      create: { eventId: event.id },
    });
  }
  console.log(`✅ Created chat rooms`);

  // Create VIP pass products and purchases
  const skipLinePass = await prisma.vIPPassEnhanced.upsert({
    where: { id: "seed-clubx-skip" },
    update: {},
    create: {
      id: "seed-clubx-skip",
      name: "Skip Line Pass",
      barId: barIds["Club X"],
      description: "Skip the line at Club X on weekends",
      type: "SKIP_LINE",
      priceCents: 1000,
      totalQuantity: 50,
      maxPerUser: 2,
      validityStart: new Date(),
      validityEnd: new Date(nextWeek.getTime()),
      validDays: [],
      benefits: ["Priority entry", "Skip the queue"],
    },
  });

  await prisma.userVIPPass.upsert({
    where: { qrCode: "seed-qr-clubx-sofia" },
    update: {},
    create: {
      vipPassId: skipLinePass.id,
      barId: barIds["Club X"],
      purchasePriceCents: 1000,
      expiresAt: new Date(nextWeek.getTime()),
      qrCode: "seed-qr-clubx-sofia",
      userId: users[2].id,
    },
  });

  console.log(`✅ Created pass purchases`);
  console.log("🎉 Seed complete!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
