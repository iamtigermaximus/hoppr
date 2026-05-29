# Hoppr — Discover. Crawl. Connect.

Finland's drinking establishments, unified. A mobile-first web app for discovering bars, events, promotions, and VIP passes.

## Tech Stack

- **Framework:** Next.js 16 (App Router), React 19, TypeScript
- **Database:** PostgreSQL (Neon) + Prisma 6 ORM
- **Auth:** NextAuth.js v4 (email/password + Google OAuth, JWT strategy)
- **Styling:** Styled Components v6 (Dark & Bold theme)
- **Real-time:** Socket.io (separate server in `socket-server/`)
- **Data Fetching:** TanStack Query v5
- **Icons:** Phosphor Icons

## Features

- **Unified Discover Feed** — Events, promotions, and VIP passes in one scroll with time filters and type-grouped sections
- **Event Management** — Create/edit/delete events, multi-venue bar crawls, cover images, join/leave with attendee photo bubbles
- **Real-time Chat** — Private event chat rooms via Socket.io with live indicators
- **VIP Passes** — Browse, purchase (mock), and redeem with QR codes
- **Venue Discovery** — 15 Helsinki venues with hours, amenities, social links, and open/closed status
- **User Profiles** — Photo uploads, gallery, social links, interests, languages, activity history
- **Notifications** — Real-time badge on bell icon for joins, messages, and reminders
- **Responsive** — Mobile-first with bottom nav, desktop with sidebar

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database (Neon recommended)

### Setup

```bash
git clone https://github.com/iamtigermaximus/hoppr.git
cd hoppr
npm install
```

Copy `.env.example` to `.env` and fill in:

```
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="generate-a-random-string"
NEXTAUTH_URL="http://localhost:3000"
JWT_SECRET="shared-secret-for-socket-auth"
NEXT_PUBLIC_SOCKET_URL="http://localhost:3001"
```

Then:

```bash
npx prisma db push    # Create database tables
npm run db:seed       # Seed with test data
npm run dev           # Start Next.js on port 3000
```

In a separate terminal for chat:

```bash
npm run dev:socket    # Start Socket.io on port 3001
```

Open [http://localhost:3000](http://localhost:3000).

### Test Accounts (after seeding)

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
│   ├── (authenticated)/     # Pages with nav + header
│   │   ├── page.tsx         # Home: trending, promos, events, bars, categories
│   │   ├── discover/        # Unified feed with time filters
│   │   ├── events/          # Create, detail, chat, edit
│   │   ├── venues/          # Rich venue detail pages
│   │   ├── promotions/      # Promotion detail pages
│   │   ├── passes/          # Marketplace, wallet, QR codes
│   │   ├── bars/            # All bars with search + filters
│   │   ├── chat/            # Chat list
│   │   ├── profile/         # Own + public profiles
│   │   ├── notifications/   # Notification center
│   │   └── settings/        # Settings + sign out
│   ├── login/ register/ onboarding/
│   └── api/                 # REST + Socket.io routes
├── components/
│   ├── ui/                  # Design system primitives
│   ├── feed/ home/ events/ chat/ venues/ passes/ profile/ auth/
│   └── contexts/            # Auth, Theme, Socket, Query, Location
├── hooks/                   # Data fetching hooks
├── lib/                     # Prisma, auth, theme, utils, mocks
└── types/                   # TypeScript types
```

## Scripts

| Script | Description |
|---|---|
| `npm run dev` | Next.js development server |
| `npm run build` | Production build |
| `npm run dev:socket` | Socket.io server for real-time chat |
| `npm run db:push` | Push Prisma schema to database |
| `npm run db:seed` | Seed database with test data |
| `npm run db:studio` | Open Prisma Studio |

## Environment Variables

See `.env.example` for the full list. Required:
- `DATABASE_URL` — PostgreSQL connection string
- `NEXTAUTH_SECRET` — Session encryption key
- `JWT_SECRET` — Shared secret for Socket.io auth
- `NEXT_PUBLIC_SOCKET_URL` — Socket.io server URL
