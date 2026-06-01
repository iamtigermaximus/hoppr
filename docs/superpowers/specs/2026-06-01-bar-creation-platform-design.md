# Bar Creation Platform — Improvement Spec

**Date:** 2026-06-01
**Status:** Draft
**Scope:** Targeted improvements to `hoppr-business`, building on existing features

## 1. What Already Exists

The `hoppr-business` app already has significant infrastructure. This spec does NOT rebuild these — it enhances them.

| Existing Feature | Location | Status |
|---|---|---|
| AI-powered creation hub | `/bar/[id]/create` with `CreateHubClient`, `AIIntentBox`, `ComplianceBar`, `ContentTypeTabs`, `UnifiedForm`, `ConsumerPreviewPanel` | Working |
| Bar dashboard | `/bar/[id]/dashboard` — stats (profile views, pass sales, revenue, clicks) | Working |
| Promotions wizard | `/bar/[id]/promotions` with `PromotionsWizard` | Working |
| Events manager | `/bar/[id]/events` with `EventsManager` | Working |
| Pass manager | `/bar/[id]/passes` with `PassManager` | Working |
| Content calendar | `/bar/[id]/calendar` | Working |
| Analytics page | `/bar/[id]/analytics` | Working |
| Bar intelligence hub | `/bar/[id]/intelligence` | Working |
| Approval queue | `/bar/[id]/approvals` | Working |
| Staff management | `/bar/[id]/users` — `BarStaff` model with OWNER/MANAGER/PROMOTIONS_MANAGER/STAFF/VIEWER roles | Working |
| Social cross-posting | Commit `754c289` — Instagram/Facebook/Twitter | Working |
| QR pass scanner | `/bar/[id]/scanner` | Working |
| Compliance checking | `ComplianceBar` + `ComplianceCheck` model + `SuggestionPanel` | Working |
| Duplicate detection | `/api/events/check-duplicates`, `/api/promotions/check-duplicates` — Jaccard similarity via `findDuplicates()` | Working |

## 2. What We're Adding (The Delta)

### Priority 1: Proactive Insights Chatbot

**The core new feature.** Instead of bar owners navigating to `/bar/[id]/analytics` or `/bar/[id]/intelligence` to find insights, the system proactively reaches out through three channels: home screen cards, push notifications, and an expandable chat panel.

#### Data Sources (no new tracking needed)

The insights engine reads exclusively from existing data:

| Source | What it provides |
|--------|-----------------|
| `AnalyticsEvent` (17 event types) | Raw interaction stream: views, clicks, joins, purchases, scans, follows per bar |
| `BarPromotion.views/clicks/redemptions/cardViews` | Per-promotion performance counters |
| `Event` + `EventParticipant` | Scheduled events and attendance |
| `VIPPassEnhanced.soldCount/totalQuantity` | Pass sales and inventory |
| `Bar` + `BarFollow` | Bar metadata and follower counts |
| `Notification` model | Existing push delivery infrastructure |
| `BarStaff` | Who to notify (OWNER, MANAGER roles) |

#### Trigger Engine (Rule-Based, Phase 1)

A cron job (Vercel Cron, every ~3 hours) evaluates 5 rules per active bar. Additional on-demand checks fire immediately after a post is published.

**Rule 1: Gap Detection**
```
Query: Events WHERE barId = X AND startTime BETWEEN now AND now+72h
If: count = 0 AND upcoming day is Fri/Sat → trigger
Message: "Friday is open. Your Friday posts get 3x more views. Fill it?"
Channel: Push notification + home card
```

**Rule 2: Post Milestone**
```
Trigger: on publish + 24h after publish
Query: AnalyticsEvent WHERE barId = X AND type IN (EVENT_VIEW, PROMO_VIEW)
       AND createdAt > 24h ago
If: count > bar's historical average (rolling 30-day mean) → trigger
Message: "Salsa Saturday hit 340 views — your best post this month!"
Channel: Push notification
```

**Rule 3: Weekly Summary**
```
Trigger: Monday 9am local time
Query: Aggregate all AnalyticsEvents for bar, last 7 days, grouped by type
Compute: total views, clicks, top post, best day, comparison to prior week
Message: "1,200 views, 85 clicks. Best day: Friday. Top post: Salsa Saturday.
         Tip: Posts with crowd photos got 2.5x more clicks."
Channel: Home screen card
```

**Rule 4: Inactivity Detection**
```
Trigger: daily check
Query: Most recent Event/Promotion/Pass WHERE barId = X
If: newest.createdAt > 7 days ago → trigger
Message: "You haven't posted in 8 days. Bars that post weekly get 4x more followers."
Channel: Push notification
```

**Rule 5: Pattern Detection**
```
Trigger: weekly (included in Monday summary)
Compare: posts with photo=true vs false (view/click ratio)
Compare: posts by day-of-week (engagement per day)
Compare: posts by type (event vs promo vs pass performance)
Surface the single biggest actionable gap
Message: "Crowd photos get 2.5x more clicks. Your last 3 used venue shots."
Channel: Home card (embedded in weekly summary)
```

#### Delivery Architecture

Three channels, one engine:

| Channel | When | Example | Tech |
|---------|------|---------|------|
| **Home screen card** | Always visible on bar dashboard | Collapsed insight card below stats row, tap to expand into chat | `GET /api/bar/[id]/insights/latest` → rendered as `InsightCard` component |
| **Push notification** | Time-sensitive nudges | Lock screen notification for milestones, gaps, inactivity | Uses existing `Notification` model, new type: `INSIGHT` |
| **Chat panel** | Interactive follow-up | Expanded from home card, bar owner can reply, ask questions | `InsightMessage` model stores conversation history |

Each bar can mute specific channels or insight types via `InsightPreference` (e.g., "no push notifications on weekends").

#### New Data Models

```prisma
model BarInsight {
  id          String    @id @default(cuid())
  barId       String
  type        InsightType
  title       String
  body        String
  actionLabel String?   // e.g. "Set up Friday"
  actionRoute String?   // e.g. "/bar/[id]/create?day=friday"
  dismissed   Boolean   @default(false)
  actedUpon   Boolean   @default(false)
  createdAt   DateTime  @default(now())
}

enum InsightType {
  GAP_DETECTION
  MILESTONE
  WEEKLY_SUMMARY
  INACTIVITY
  PATTERN
}

model InsightMessage {
  id          String       @id @default(cuid())
  barId       String
  insightId   String?      // links to parent insight if part of a thread
  senderType  SenderType
  content     String
  actionTaken String?      // e.g. "created_event", "dismissed", "upgraded"
  createdAt   DateTime     @default(now())
}

enum SenderType {
  ASSISTANT
  USER
}

model InsightPreference {
  id      String        @id @default(cuid())
  barId   String
  channel InsightChannel  // PUSH, HOME_CARD, CHAT
  type    InsightType?
  enabled Boolean        @default(true)

  @@unique([barId, channel, type])
}

enum InsightChannel {
  PUSH
  HOME_CARD
  CHAT
}
```

#### Example Flow: Empty Friday Detection

1. **Cron runs (Wed 6pm):** Queries all bars for events in next 72 hours
2. **Club X:** 0 events for Friday → triggers `GAP_DETECTION` rule
3. **Create `BarInsight`:** "Friday is open. Your Friday posts get 3x more views."
4. **Create `Notification`:** type=`INSIGHT`, sent to all OWNER/MANAGER staff of Club X
5. **Push delivered to phones.** Bar owner taps → opens dashboard → insight card is expanded
6. **Taps "Set up Friday"** → navigates to create flow with Friday date pre-selected
7. **Insight marked `actedUpon: true`.** System learns this bar responds to gap alerts

#### Chat Panel Interaction

When the bar owner taps the insight card or the chat icon, it expands into a conversation:

```
ASSISTANT: "Hey! Friday is open. Your last 3 Fridays averaged 340 views.
            Want me to set something up?"

USER:      "Yeah, what should I do?"

ASSISTANT: "Your salsa night last month brought 80 people. Latin music events
            in Helsinki are trending up 40%. Want to copy last month's post?

            [Yes, copy last one]  [Something new]"
```

The chat panel is a client component on the bar dashboard, expandable from the home card. Messages are stored in `InsightMessage` for conversation continuity.

#### Phase 2 (3+ months, data-gated)

When 20+ bars have 3+ months of analytics data:
- Cross-bar trend detection (anonymized pattern comparison)
- Personalization (learns each bar's posting style and optimal timing)
- Predictive scoring ("this type of event typically gets X views in your area")
- Auto-generated post drafts based on bar history and trends

### Priority 2: Photo Stock Fallback

**Problem:** The current creation flow accepts gradients/emojis as image fallbacks. This looks generic and hurts the app's visual quality.

**Solution:** When a bar skips uploading a photo, show 3-4 real stock photos based on the AI-inferred post type:
- Happy hour → cocktail/bar interior photos
- DJ night → crowd/dance floor photos
- Live music → stage/musician photos
- Sports viewing → sports bar/tv screen photos

The bar owner taps one or chooses "skip." The photo preview shows immediately. A subtle nudge: "Real bar photos get 3x more views than stock. Upload your own anytime."

**Implementation:** Use a free stock photo API (Unsplash, Pexels) keyed by the AI-classified post type. Cache results per type to avoid redundant API calls.

### Priority 3: Single-Sentence Auto-Classification

**Problem:** The current `CreateHubClient` has `ContentTypeTabs` — the bar owner must choose Event, Promotion, or Pass BEFORE typing anything. This adds cognitive load and forces categorization upfront.

**Solution:** Remove the required tab selection. The bar owner types one sentence. The AI:
1. Classifies the intent (event, promotion, pass, or combo)
2. Extracts structured fields (title, date, time, offer details)
3. Pre-fills the form with the correct type already selected
4. If the sentence describes both an event AND a promotion ("Salsa night + free entry before 9pm"), both are created as linked entities

The existing type tabs remain as optional filters/bias selectors, but they're not required.

### Priority 4: Pricing & Plans

**Problem:** No monetization exists. All features are free.

**Solution:** 4-tier pricing integrated into the bar dashboard:

| Feature | Free | Pay-per-post | Pro (€19/mo) | Super Bar (€39/mo) |
|---------|------|-------------|--------------|---------------------|
| Posts/month | 2 | Unlimited | Unlimited | Unlimited |
| AI generation | ✓ | ✓ | ✓ | ✓ |
| Compliance check | ✓ | ✓ | ✓ | ✓ |
| Hoppr distribution | ✓ | ✓ | ✓ | ✓ |
| Social cross-posting | — | ✓ | ✓ | ✓ |
| Advanced analytics | — | — | ✓ | ✓ |
| Priority feed placement | — | — | ✓ | ✓ |
| Proactive insights chatbot | — | — | — | ✓ |
| Stock photo library | — | — | ✓ | ✓ |
| Staff seats | 1 | 1 | 3 | Unlimited |
| Pass sales commission | 12% | 10% | 8% | 5% |

**New data model:**

```prisma
model BarSubscription {
  id        String   @id @default(cuid())
  barId     String   @unique
  plan      PlanTier @default(FREE)
  postsUsed Int      @default(0)
  periodStart DateTime
  periodEnd   DateTime
  stripeSubscriptionId String?
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
}

enum PlanTier {
  FREE
  PAY_PER_POST
  PRO
  SUPER_BAR
}
```

Commission on pass sales is deferred — it only activates when pass purchasing goes live with real payments.

## 3. What We're NOT Changing

These existing features work well and are left as-is:

- **ComplianceBar** — Already does invisible checking with suggestions. Keep.
- **Approval queue** — `/bar/[id]/approvals` already handles staff → owner workflow. Keep.
- **Social cross-posting** — Already implemented. Just needs wiring into the creation preview.
- **Calendar** — `/bar/[id]/calendar` exists. Enhance with performance dots (green/gray per day).
- **Analytics page** — `/bar/[id]/analytics` exists. The chatbot complements it; it doesn't replace it.
- **Staff management** — `BarStaff` model and roles are solid. Keep.

## 4. Implementation Plan

### Milestone 1: Photo Stock Fallback (3-5 days)
- Integrate Unsplash or Pexels API for stock photo search
- Add stock photo picker to creation flow (3-4 suggestions based on AI-inferred type)
- Wire into existing Cloudinary upload pipeline (cache stock photos)
- Add nudge text for real photos

### Milestone 2: Single-Sentence Auto-Classify (3-5 days)
- Enhance AIIntentBox prompt to classify intent (event/promo/pass/combo)
- Remove required ContentTypeTabs selection
- Auto-fill type field based on AI classification
- Support combo creation (event + promotion from one sentence)

### Milestone 3: Pricing Infrastructure (1 week)
- Add `BarSubscription` model to Prisma schema
- Create plan enforcement middleware/utility
- Integrate Stripe for subscription management
- Add plan-aware UI (feature gates, upgrade prompts)
- Usage tracking (posts per month per bar)

### Milestone 4: Proactive Insights Chatbot (2-3 weeks)
- Build rule-based trigger engine (empty calendar, milestones, inactivity, weekly summary)
- Add chat panel component to bar dashboard home screen
- Wire push notifications for time-sensitive triggers
- Integrate with existing `AnalyticsEvent` data and `BarPromotion` counters
- Add weekly summary aggregation job (cron — could use Vercel Cron Jobs)
- Phase 2 ML features deferred until sufficient data exists

## 5. Success Metrics

- **Bar activation rate:** % of claimed bars that create at least 1 post in first week
- **Weekly active bars:** bars posting at least once per week
- **Insight engagement:** % of push notifications that result in app open
- **Post completion rate:** % of started posts that get published
- **Subscription conversion:** % of free bars that upgrade to paid
- **Retention:** % of bars still posting after 30/60/90 days
