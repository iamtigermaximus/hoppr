# Bar Creation Platform — Design Spec

**Date:** 2026-06-01
**Status:** Draft
**Scope:** hoppr-business (bar management app), with consumer-side display impacts

## 1. Overview

Hoppr is a two-app system: `hoppr` (consumer discovery) and `hoppr-business` (bar management). Both share a single Prisma database. This spec covers a redesign of the `hoppr-business` creation experience — the tool bars use to post events, promotions, and VIP passes.

### Core Value Proposition

> **Hoppr is the cheapest, fastest, and best-looking way for Finnish bars to market themselves.** One sentence becomes a professional event page, social media post, and measurable marketing channel — in under 60 seconds.

### Goals

1. **Sub-60-second creation** — bar staff create content during a shift break, on their phone
2. **AI-powered, not form-powered** — type a sentence, AI does the rest
3. **Real photos required** — bars already have phone photos; gradients look generic
4. **Invisible compliance** — Finnish alcohol marketing rules checked automatically, only surfaces when there's an issue
5. **Role-based approval** — staff create, owners approve before anything goes live
6. **Multi-channel distribution** — Hoppr app + social cross-posting in one publish action
7. **Closed-loop analytics** — every post reports back views, engagement, and effectiveness
8. **Cheap enough to be a no-brainer** — free tier exists, paid plans are cheaper than any marketing alternative

## 2. User Roles & Permissions

The `BarStaff` model (already in schema) maps to creation permissions:

| Role | Create | Auto-Publish | Approve Others |
|------|--------|-------------|----------------|
| OWNER | Yes | Yes | Yes |
| MANAGER | Yes | Yes | Yes |
| PROMOTIONS_MANAGER | Passes only | No (passes = money) | No |
| STAFF | Yes | No | No |
| VIEWER | No | No | No |

**Approval rule:** Content created by STAFF or PROMOTIONS_MANAGER goes into a "Pending Approval" queue. OWNER and MANAGER get a push notification. They can approve, edit-and-approve, or reject with a note.

## 3. Creation Flow (Mobile-First)

### Step-by-Step

```
┌─────────────────────────────────────────────┐
│  1. CONTENT CALENDAR (home screen)           │
│  ┌─────────────────────────────────────┐     │
│  │     June 2026        Week 23        │     │
│  │  Mon Tue Wed Thu Fri Sat Sun       │     │
│  │   1   2   3   4  [5]  [6]+  7      │     │
│  │                🎧                  │     │
│  │  ─────────────────────────────────  │     │
│  │  Saturday is open. Fill it?         │     │
│  │  [Tap to create]                    │     │
│  └─────────────────────────────────────┘     │
│                                              │
│  2. TYPE ONE SENTENCE (slide-up card)        │
│  ┌─────────────────────────────────────┐     │
│  │  What's happening?                   │     │
│  │  ┌─────────────────────────────────┐ │     │
│  │  │ Saturday salsa night, free      │ │     │
│  │  │ entry before 9pm 💃             │ │     │
│  │  └─────────────────────────────────┘ │     │
│  │  [Event] [Promo] [Pass] [Combo]     │     │
│  │                          [Generate]  │     │
│  └─────────────────────────────────────┘     │
│                                              │
│  3. AI FILLS (3 seconds)                     │
│  • Classifies intent → Event + Promotion     │
│  • Extracts: title, date, time, offer        │
│  • Sets venue from bar context               │
│  • Runs compliance check (silent)            │
│                                              │
│  4. ADD PHOTO                                │
│  ┌─────────────────────────────────────┐     │
│  │  Show us the vibe 📸                 │     │
│  │  ┌──────────┐ ┌──────────┐         │     │
│  │  │  Camera   │ │ Gallery  │         │     │
│  │  └──────────┘ └──────────┘         │     │
│  │  ┌──────────────────────────────┐   │     │
│  │  │ Fri crowd at the bar    [x]  │   │     │
│  │  └──────────────────────────────┘   │     │
│  │  Photos get 3x more engagement      │     │
│  └─────────────────────────────────────┘     │
│                                              │
│  5. REVIEW CARD                              │
│  ┌─────────────────────────────────────┐     │
│  │  🟢 Compliant                        │     │
│  │  ┌─────────────────────────────┐     │     │
│  │  │         💃                   │     │     │
│  │  │    Salsa Saturday             │     │     │
│  │  │    Sat, June 7 · 21:00       │     │     │
│  │  │    Free entry before 9pm     │     │     │
│  │  └─────────────────────────────┘     │     │
│  │  ┌─ Social Preview ─────────────┐    │     │
│  │  │ Instagram story version      │    │     │
│  │  │ Facebook post version        │    │     │
│  │  └──────────────────────────────┘    │     │
│  │  [Edit]              [Publish ✓]     │     │
│  └─────────────────────────────────────┘     │
│                                              │
│  6. CONFIRMATION + ANALYTICS PREVIEW          │
│  ┌─────────────────────────────────────┐     │
│  │  ✓ Live on Hoppr + Social!           │     │
│  │  Track performance → [View Stats]    │     │
│  └─────────────────────────────────────┘     │
└─────────────────────────────────────────────┘
```

### Type Chips (Step 2)

The type chips (Event / Promo / Pass / Combo) are **soft hints**, not required selections. The AI classifies intent from the prompt regardless of which chip is tapped. Tapping a chip biases the AI but doesn't constrain it. The AI can return multiple linked entities (e.g., an Event + a Promotion) from a single sentence.

### Photo Step (Step 4)

- Three sources: camera (instant snap), gallery (choose existing), recent (reuse a photo from the last 30 days)
- Photos are uploaded to Cloudinary (existing integration) with auto-quality/format
- A thumbnail preview shows immediately; upload happens in background while user reviews
- The nudge text ("Photos get 3x more engagement") reinforces without blocking

### Compliance Indicator (Step 5)

| State | Meaning | Action |
|-------|---------|--------|
| 🟢 Green | Fully compliant with Finnish alcohol marketing law | None |
| 🟡 Yellow | Potential issue (e.g., "free" without purchase context) | Warning shown; tap to auto-fix with suggested text; does NOT block publishing |
| 🔴 Red | Clear violation (e.g., underage targeting) | Blocks publishing; requires edit |

The compliance checker (already in the codebase via `ComplianceBar`) runs asynchronously after AI generation. Results are cached so re-checks on edit are instant.

## 4. Approval Flow

```
STAFF creates → Submit for Approval
                    ↓
         OWNER/MANAGER gets push notification
                    ↓
         ┌──────────────────────────┐
         │  "Mikko submitted:        │
         │   Salsa Saturday"         │
         │                           │
         │  [Approve] [Edit] [Reject]│
         └──────────────────────────┘
                    ↓
         APPROVE → Instant publish to Hoppr + Social
         EDIT    → Opens card for changes, then publish
         REJECT  → Goes back to creator with note
```

- The approval queue lives on the bar dashboard and as push notifications
- Approved posts are stamped with `approvedById` and `approvedAt`
- Rejected posts stay in the bar's content library as drafts (not deleted)

## 5. Data Model Additions

### New Fields on Existing Models

**BarPromotion** (already in schema):
- Add `approvedById: String?` — FK to User who approved
- Add `approvedAt: DateTime?`
- Add `submittedById: String?` — FK to User who created (BarStaff)
- Add `status: ContentStatus @default(DRAFT)`

**Event** (already in schema):
- Add `approvedById: String?`
- Add `approvedAt: DateTime?`
- Add `submittedById: String?` — (creatorId already exists, but that's the event creator, not necessarily the bar staff who posted it)
- Add `status: ContentStatus @default(DRAFT)` — note: this is for bar-created events; consumer-created events auto-publish

**VIPPassEnhanced** (already in schema):
- Add `approvedById: String?`
- Add `approvedAt: DateTime?`
- Add `submittedById: String?`
- Add `status: ContentStatus @default(DRAFT)`

### New Enum

```prisma
enum ContentStatus {
  DRAFT        // being created, not yet submitted
  PENDING      // submitted, awaiting approval
  APPROVED     // approved and live
  REJECTED     // rejected, returned to creator
  ARCHIVED     // past end date, no longer displayed
}
```

### New Model: PostAnalytics

```prisma
model PostAnalytics {
  id            String    @id @default(cuid())
  postType      PostType  // EVENT, PROMOTION, PASS
  postId        String    // FK to the event/promotion/pass
  barId         String    // FK to bars
  views         Int       @default(0)
  uniqueViews   Int       @default(0)
  clicks        Int       @default(0)
  redemptions   Int       @default(0)  // for passes: actual scans
  socialClicks  Int       @default(0)  // clicks from social posts
  attendance    Int?      // for events: actual attendees (from check-ins)
  revenue       Int?      // for passes: total revenue in cents
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

enum PostType {
  EVENT
  PROMOTION
  PASS
}
```

## 6. Distribution

### Hoppr Consumer App

Content appears in the consumer app only when:
- `status == APPROVED`
- `complianceStatus == COMPLIANT`
- `isActive == true` (for promos/passes)
- Within valid date range (start/end dates)

### Social Cross-Posting (existing feature)

Already in the codebase from commit `754c289`. The creation flow generates platform-specific versions:

- **Instagram Story:** Square format, photo + overlaid text (title, date, venue), swipe-up link
- **Facebook Post:** Photo + title + description + date + link to Hoppr event page
- **Twitter/X:** Short text + link + photo

The social preview panel (Step 5) shows each version before publishing. Bar owners can toggle which platforms to post to.

## 7. Analytics

### Per-Post Performance Dashboard

Each post in the bar's content calendar shows:
- Views / unique views
- Clicks through to detail page
- For events: attendance rate (confirmed / viewed)
- For promos: redemption rate (used / viewed)
- For passes: purchase count + total revenue
- Social reach: clicks from Instagram vs Facebook vs organic

### Bar-Level Insights (Phase 2 data-gated)

```
"Your Friday posts get 3x more views than Mondays."
"Posts with crowd photos perform 2.5x better."
"Bars in Kallio are seeing high demand for Latin music nights."
"You haven't posted in 5 days — want me to set up something for this weekend?"
```

These insights are only available on Pro (€19/mo) and Super Bar (€39/mo) plans. Free tier and pay-per-post get basic view counts only.

## 8. Pricing & Plans

| Feature | Free | Pay-per-post | Pro (€19/mo) | Super Bar (€39/mo) |
|---------|------|-------------|--------------|---------------------|
| Posts/month | 2 | Unlimited | Unlimited | Unlimited |
| AI generation | ✓ | ✓ | ✓ | ✓ |
| Compliance check | ✓ | ✓ | ✓ | ✓ |
| Hoppr distribution | ✓ | ✓ | ✓ | ✓ |
| Social cross-posting | — | ✓ | ✓ | ✓ |
| Basic analytics | — | — | ✓ | ✓ |
| Priority feed placement | — | — | ✓ | ✓ |
| AI insights (Phase 2) | — | — | — | ✓ |
| Printable posters | — | — | — | ✓ |
| Staff seats | 1 | 1 | 3 | Unlimited |
| Pass sales commission | 12% | 10% | 8% | 5% |
| Price per extra post | — | €3/post | — | — |

Commission on pass sales is secondary revenue — it applies only when bars sell VIP passes through Hoppr. The primary monetization is the creation plans.

## 9. Phase 2: Proactive AI Assistant

Ship criteria: when the platform has collected at least 3 months of post analytics data across 20+ active bars.

Features gated behind Super Bar (€39/mo):

1. **Reminders:** "You usually post a Friday event on Wednesday. Want to set it up now?"
2. **Ecosystem insights:** "Latin music nights in Helsinki are up 40% this month. Want to try one?"
3. **Auto-optimization:** "Your 8pm posts get 2x more engagement than midnight posts. Schedule this for 8pm?"
4. **Habit-based suggestions:** "This Saturday is open on your calendar. Last month's salsa night brought 80 people. Want a repeat?"
5. **Cross-bar intelligence:** Anonymized benchmarks — "Your engagement rate is in the top 20% of Helsinki bars."

The Phase 1 data collection (views, clicks, redemptions, attendance) is what makes this possible. Every post created in Phase 1 trains the system.

## 10. Current State vs Target

| Aspect | Current (hoppr-business) | Target |
|--------|--------------------------|--------|
| Creation UX | CreateHubClient with AIIntentBox + tabs | Calendar-first, single sentence, AI auto-classifies |
| Content types | Event OR Promo OR Pass (one at a time) | AI can create Event + Promo from one sentence |
| Photo | Optional, upload during form | Required, camera/gallery/recent, background upload |
| Compliance | ComplianceBar with SuggestionPanel | Invisible unless yellow/red |
| Approval | None (all content created by seed scripts) | Role-based: staff → owner → publish |
| Distribution | Hoppr only | Hoppr + social cross-posting (per-post or plan) |
| Analytics | None (BarPromotion has counters but no dashboard) | Per-post + bar-level dashboard |
| Pricing | None | 4-tier: Free / Pay-per-post / Pro / Super Bar |
| Mobile UX | Not optimized | Mobile-first, designed for shift-break use |

## 11. Implementation Sequencing

### Milestone 1: Core Creation (2-3 weeks)
- Calendar-first home screen in hoppr-business
- Single-sentence AI creation (enhance existing AIIntentBox)
- Photo required with camera/gallery/recent
- Compliance as invisible indicator
- ContentStatus enum + DRAFT → APPROVED flow

### Milestone 2: Approval + Roles (1 week)
- BarStaff role enforcement
- Pending approval queue
- Push notifications for approval requests
- Owner/manager can approve/edit/reject

### Milestone 3: Distribution + Social (1 week)
- Wire up existing social cross-posting to creation flow
- Social preview panel in review card
- Platform toggle (Hoppr / Instagram / Facebook / Twitter)
- Content visibility gating (APPROVED + COMPLIANT only)

### Milestone 4: Pricing (1 week)
- Plan tiers in database
- Usage tracking (posts/month per bar)
- Pay-per-post billing
- Subscription management (Stripe or Finnish provider)
- Plan enforcement in creation flow

### Milestone 5: Analytics Dashboard (1-2 weeks)
- PostAnalytics model + tracking
- Per-post stats card in calendar
- Bar-level dashboard (views, engagement, best days)
- Social referral tracking

### Milestone 6: Phase 2 AI Assistant (3+ months, data-gated)
- Requires 3 months of analytics data from 20+ bars
- Proactive reminders and suggestions
- Cross-bar anonymized insights
