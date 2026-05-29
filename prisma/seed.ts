import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create test users
  const passwordHash = await bcrypt.hash("password123", 12);

  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: "emma@example.com" },
      update: {},
      create: {
        email: "emma@example.com", username: "emma_nights", passwordHash,
        bio: "Helsinki nightlife explorer. Love pub crawls and live music! 🍻",
        avatarUrl: "https://i.pravatar.cc/200?u=emma"
        instagram: "@emmahelsinki", interests: ["pub crawls", "live music", "karaoke"],
        languages: ["Finnish", "English", "Swedish"],
        drinkPrefs: ["PUB", "LIVE_MUSIC", "KARAOKE_BAR"],
        gallery: [],
      },
    }),
    prisma.user.upsert({
      where: { email: "mikko@example.com" },
      update: {},
      create: {
        email: "mikko@example.com", username: "mikko_beers", passwordHash,
        bio: "Craft beer enthusiast. BrewDog regular. Always hunting for the best IPA in Finland.",
        avatarUrl: "https://i.pravatar.cc/200?u=mikko"
        instagram: "@mikkobeers", interests: ["craft beer", "brewery tours", "beer tasting"],
        languages: ["Finnish", "English"],
        drinkPrefs: ["BREWERY_TAPROOM", "PUB"],
        gallery: [],
      },
    }),
    prisma.user.upsert({
      where: { email: "sofia@example.com" },
      update: {},
      create: {
        email: "sofia@example.com", username: "sofia_clubs", passwordHash,
        bio: "DJ and nightlife lover. You'll find me at Club X most weekends.",
        avatarUrl: "https://i.pravatar.cc/200?u=sofia"
        instagram: "@sofiaclubs", interests: ["techno", "house music", "dancing"],
        languages: ["Finnish", "English", "Spanish"],
        drinkPrefs: ["CLUB", "COCKTAIL_LOUNGE"],
        gallery: [],
      },
    }),
    prisma.user.upsert({
      where: { email: "alex@example.com" },
      update: {},
      create: {
        email: "alex@example.com", username: "alex_sports", passwordHash,
        bio: "Sports fanatic. Premier League every weekend at O'Malley's. Game day is sacred.",
        avatarUrl: "https://i.pravatar.cc/200?u=alex"
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
        email: "leena@example.com", username: "leena_wine", passwordHash,
        bio: "Sommelier in training. Love discovering new wines and cozy wine bars.",
        avatarUrl: "https://i.pravatar.cc/200?u=leena"
        instagram: "@leenawine", interests: ["wine tasting", "cheese pairing", "quiet evenings"],
        languages: ["Finnish", "English", "French", "Italian"],
        drinkPrefs: ["WINE_BAR", "COCKTAIL_LOUNGE"],
        gallery: [],
      },
    }),
  ]);

  console.log(`✅ Created ${users.length} users`);

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
        venueId: "v1", venueName: "Bar Loose", venueType: "PUB",
        startTime: new Date(now.getTime() + 6 * 3600000), // 6 hours from now
        endTime: new Date(now.getTime() + 12 * 3600000),
        maxAttendees: 20, isPrivate: false, creatorId: users[0].id,
      },
    }),
    prisma.event.create({
      data: {
        title: "Craft Beer Tasting Night",
        description: "Exploring BrewDog's newest seasonal releases. Limited spots!",
        venueId: "v7", venueName: "BrewDog Helsinki", venueType: "BREWERY_TAPROOM",
        startTime: new Date(tomorrow.getTime() + 18 * 3600000), // tomorrow 6 PM
        maxAttendees: 12, isPrivate: false, creatorId: users[1].id,
      },
    }),
    prisma.event.create({
      data: {
        title: "Club Night w/ DJ Maki",
        description: "Techno all night at Club X. Guest DJ set by Maki. Don't miss out!",
        venueId: "v3", venueName: "Club X", venueType: "CLUB",
        startTime: new Date(saturday.getTime() + 22 * 3600000), // Saturday 10 PM
        endTime: new Date(saturday.getTime() + 28 * 3600000),
        maxAttendees: 50, isPrivate: false, creatorId: users[2].id,
      },
    }),
    prisma.event.create({
      data: {
        title: "After-Work Drinks",
        description: "Casual after-work gathering at The Old Pub. Happy hour prices all evening.",
        venueId: "v8", venueName: "The Old Pub", venueType: "PUB",
        startTime: new Date(tomorrow.getTime() + 16 * 3600000), // tomorrow 4 PM
        maxAttendees: 30, isPrivate: false, creatorId: users[3].id,
      },
    }),
    prisma.event.create({
      data: {
        title: "Wine & Cheese Evening",
        description: "Tasting event at Viiinibaari. 5 wines paired with Finnish cheeses.",
        venueId: "v6", venueName: "Viiinibaari", venueType: "WINE_BAR",
        startTime: new Date(saturday.getTime() + 19 * 3600000), // Saturday 7 PM
        maxAttendees: 15, isPrivate: false, creatorId: users[4].id,
      },
    }),
    prisma.event.create({
      data: {
        title: "Karaoke Showdown",
        description: "Monthly karaoke competition at Karaoke Star. Winner gets a €50 bar tab!",
        venueId: "v5", venueName: "Karaoke Star", venueType: "KARAOKE_BAR",
        startTime: new Date(nextWeek.getTime() + 20 * 3600000),
        maxAttendees: 25, isPrivate: false, creatorId: users[0].id,
      },
    }),
    prisma.event.create({
      data: {
        title: "Sunday Football — Premier League",
        description: "All games on 12 screens. Drink specials during the matches.",
        venueId: "v13", venueName: "O'Malley's", venueType: "SPORTS_BAR",
        startTime: new Date(saturday.getTime() + 14 * 3600000),
        maxAttendees: 40, isPrivate: false, creatorId: users[3].id,
      },
    }),
  ]);

  console.log(`✅ Created ${events.length} events`);

  // Create participants (join users to events)
  const participants = [];
  // Emma joins all events
  for (const event of events) {
    participants.push(
      prisma.eventParticipant.create({ data: { userId: users[0].id, eventId: event.id } })
    );
  }
  // Mikko joins pub crawl, after-work, karaoke, sports
  participants.push(
    prisma.eventParticipant.create({ data: { userId: users[1].id, eventId: events[0].id } }),
    prisma.eventParticipant.create({ data: { userId: users[1].id, eventId: events[3].id } }),
    prisma.eventParticipant.create({ data: { userId: users[1].id, eventId: events[5].id } }),
    prisma.eventParticipant.create({ data: { userId: users[1].id, eventId: events[6].id } }),
  );
  // Sofia joins club night, pub crawl, after-work
  participants.push(
    prisma.eventParticipant.create({ data: { userId: users[2].id, eventId: events[0].id } }),
    prisma.eventParticipant.create({ data: { userId: users[2].id, eventId: events[2].id } }),
    prisma.eventParticipant.create({ data: { userId: users[2].id, eventId: events[3].id } }),
  );
  // Alex joins sports, pub crawl, after-work
  participants.push(
    prisma.eventParticipant.create({ data: { userId: users[3].id, eventId: events[0].id } }),
    prisma.eventParticipant.create({ data: { userId: users[3].id, eventId: events[3].id } }),
    prisma.eventParticipant.create({ data: { userId: users[3].id, eventId: events[6].id } }),
  );
  // Leena joins wine, pub crawl, after-work
  participants.push(
    prisma.eventParticipant.create({ data: { userId: users[4].id, eventId: events[0].id } }),
    prisma.eventParticipant.create({ data: { userId: users[4].id, eventId: events[3].id } }),
    prisma.eventParticipant.create({ data: { userId: users[4].id, eventId: events[4].id } }),
  );

  await Promise.all(participants);

  // Create chat rooms for events with participants
  for (const event of events) {
    await prisma.chatRoom.upsert({
      where: { eventId: event.id },
      update: {},
      create: { eventId: event.id },
    });
  }
  console.log(`✅ Created chat rooms`);

  // Create some pass purchases
  await prisma.passPurchase.create({
    data: {
      passId: "pass1", passTitle: "Skip Line Pass", venueId: "v3", venueName: "Club X",
      price: 10, validUntil: new Date(nextWeek.getTime()), qrCodeSecret: "seed-secret-1",
      userId: users[2].id,
    },
  });
  await prisma.passPurchase.create({
    data: {
      passId: "pass2", passTitle: "VIP Entry + Drink", venueId: "v12", venueName: "Tiger",
      price: 20, validUntil: new Date(nextWeek.getTime()), qrCodeSecret: "seed-secret-2",
      userId: users[0].id,
    },
  });

  console.log(`✅ Created pass purchases`);
  console.log("🎉 Seed complete!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
