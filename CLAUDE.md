# Hoppr — Discover. Crawl. Connect.

Finland's drinking establishments, unified. A mobile-first web app for discovering bars, events, promotions, and VIP passes.

## Tech Stack

- **Framework:** Next.js 16 (App Router), React 19, TypeScript
- **Database:** PostgreSQL (Neon) + Prisma 6 ORM — **shares the same database** with [hoppr-business](../hoppr-business). Schema changes in either repo affect both apps.
- **Auth:** NextAuth.js v4 (email/password + Google OAuth, JWT strategy)
- **Styling:** Styled Components v6 (Dark & Bold theme)
- **Real-time:** Socket.io (separate server in `socket-server/`)
- **Data Fetching:** TanStack Query v5
- **Icons:** Phosphor Icons

## Getting Started

```bash
npm install
# Copy .env.example to .env and fill in DATABASE_URL, NEXTAUTH_SECRET, JWT_SECRET
npx prisma db push
npm run db:seed    # creates test users + events
npm run dev        # Next.js on :3000
npm run dev:socket # Socket.io on :3001 (in separate terminal)
```

## Test Accounts (after seeding)

| Email | Password | Username |
|---|---|---|
| emma@example.com | password123 | emma_nights |
| mikko@example.com | password123 | mikko_beers |
| sofia@example.com | password123 | sofia_clubs |
| alex@example.com | password123 | alex_sports |
| leena@example.com | password123 | leena_wine |

## Project Structure

```
src/
├── app/
│   ├── layout.tsx              # Root: StyledComponents + AuthProvider + QueryProvider
│   ├── (authenticated)/        # Route group: all pages with BottomNav + AppHeader
│   │   ├── layout.tsx          # ThemeProvider + SocketProvider + AppHeader + BottomNav
│   │   ├── page.tsx            # Home: city/date → trending carousel → promos → events → bars → categories
│   │   ├── discover/page.tsx   # Unified feed with time filters + type-grouped sections
│   │   ├── events/create/      # Create event with multi-venue + image upload
│   │   ├── events/[id]/        # Event detail + chat + edit
│   │   ├── venues/[id]/        # Venue detail (hours, amenities, promos, passes)
│   │   ├── promotions/[id]/    # Promotion detail
│   │   ├── passes/             # Marketplace + detail + wallet + QR
│   │   ├── bars/               # All bars with search, filter, pagination
│   │   ├── chat/               # Chat list
│   │   ├── profile/me/         # Editable profile + activity history
│   │   ├── profile/[id]/       # Public profile
│   │   ├── notifications/      # Notification center
│   │   └── settings/           # Settings + sign out
│   ├── login/                  # Auth pages (outside authenticated group)
│   ├── register/
│   ├── onboarding/
│   └── api/                    # Route handlers (feed, events, chat, passes, venues, users, notifications, auth, upload)
├── components/
│   ├── ui/                     # Design system: Button, Card, Badge, Input, Modal, Avatar, AvatarGroup, BottomNav, Chip, SectionHeader
│   ├── feed/                   # FeedCard, FeedList, TimeFilters
│   ├── home/                   # HomeHeader, TrendingCarousel, PromoSlider, EventList, BarSlider, CategoryGrid
│   ├── events/                 # EventForm, EventDetail, AttendeeList
│   ├── chat/                   # ChatRoom, ChatList, MessageBubble, ChatInput
│   ├── venues/                 # VenueDetail (rich: hours, amenities, social media)
│   ├── passes/                 # PassCard, PassMarketplace, PassWallet, QRCodeView
│   ├── profile/                # ProfileEdit, ProfileView
│   ├── auth/                   # LoginForm, SignupForm, Logo
│   ├── app/                    # AppHeader (global header with logo + bell + avatar)
│   └── contexts/               # AuthContext, ThemeContext, SocketContext, QueryProvider, LocationContext
├── hooks/                      # useFeed, useEvents, useChat, usePasses, useVenues, useProfile, useNotifications, useGeolocation
├── lib/                        # prisma.ts, auth.ts, theme.ts, utils.ts, constants.ts, marketing-api.ts, socket-client.ts
└── types/                      # feed.ts, api.ts, socket.ts
```

## Key Architecture Decisions

- **Dark & Bold theme:** Deep black (#0a0a0a), neon purple (#7c3aed) primary, 4px spacing scale
- **5-tab bottom nav:** Home, Discover, Create (FAB), Chat, Profile — becomes left sidebar on tablet+
- **Unified feed:** Events + promotions + passes mixed in Discover, grouped by type within time sections
- **3 items initially** per type group with "Show all N" expand button
- **Socket.io in separate process** (socket-server/) — must run `npm run dev:socket` for chat
- **Marketing Tool is mocked** — 15 Helsinki venues, 8 promotions, 5 passes in `src/lib/marketing-api.ts`
- **Image uploads** to `public/uploads/` (gitignored)
- **QR codes** use react-qr-code with 60-second refresh
- **Event creators** auto-joined as participants with auto-created chat rooms

## Environment Variables

Required in `.env` (copy from `.env.example`):
- `DATABASE_URL` — Neon PostgreSQL connection string
- `NEXTAUTH_SECRET` — random string for session encryption
- `NEXTAUTH_URL` — `http://localhost:3000`
- `JWT_SECRET` — shared secret between Next.js and socket server
- `NEXT_PUBLIC_SOCKET_URL` — `http://localhost:3001` (or Render URL for production)
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — optional for Google OAuth

## Current State (May 2026)

All core features implemented and working:
- Auth (email + Google), onboarding
- Unified feed with time filters, sort, type-grouped sections
- Event CRUD with multi-venue selection, cover images, join/leave
- Venue detail with hours, amenities, social media, promos, passes
- Promotion + VIP pass detail pages
- Real-time chat via Socket.io (needs `npm run dev:socket`)
- Photo upload for profiles and event covers
- Profile editing with social links, interests, languages, gallery
- Activity history (events created/joined, passes purchased)
- Trending carousel + promotions slider on home page
- Bars listing with search, filters, pagination, open/closed status
- Notification system (bell badge + notification center)
- Settings page with sign-out
- Database seeded with 5 users, 7 events, participants, passes
