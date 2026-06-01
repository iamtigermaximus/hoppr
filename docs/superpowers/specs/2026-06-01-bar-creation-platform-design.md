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

**The core new feature.** Instead of bar owners navigating to `/bar/[id]/analytics` or `/bar/[id]/intelligence` to find insights, the system proactively reaches out to them.

**How it works:**

1. A conversational assistant that lives on the bar dashboard home screen as an expandable chat panel (think: Intercom widget but for bar insights)
2. It sends push notifications for time-sensitive nudges
3. It uses simple, non-technical language — no charts, no jargon

**Message types:**

| Trigger | Message | Channel |
|---------|---------|---------|
| Empty upcoming weekend | "You haven't posted anything for Friday yet. Your Friday posts usually get 3x more views — want me to set something up?" | Push + home card |
| Post hit a milestone | "Your Salsa Saturday post got 340 views — that's your best this month!" | Push notification |
| Weekly summary | "This week: 1,200 views, 85 clicks. Best day: Friday. Top post: Salsa Saturday." | Home card (Monday AM) |
| Pattern detected | "Posts with crowd photos get 2.5x more clicks. Your last 3 posts used venue photos — try a crowd shot next time?" | Home card |
| Inactivity | "You haven't posted in 8 days. Bars that post weekly get 4x more followers." | Push notification |
| Competitor trend | "Latin music nights in Helsinki are getting 40% more attention. Want to try one?" | Home card |

**Data source:** The existing `AnalyticsEvent` model (17 event types already defined: `PROMO_VIEW`, `PROMO_CLICK`, `EVENT_VIEW`, `EVENT_JOIN`, `PASS_PURCHASE`, `PASS_SCAN`, etc.) already collects interaction data. The `BarPromotion` model already has `views`, `clicks`, `redemptions`, `cardViews` counters. The insights engine reads from these existing sources — no new data model needed for Phase 1.

**Phase 1 (ship now):** Rule-based triggers on existing data
- Empty calendar slot detection (query upcoming events/promos, flag gaps)
- Milestone notifications (post exceeds bar's historical average)
- Weekly summary aggregation (count views/clicks per bar per week)
- Inactivity detection (no posts in 7+ days)

**Phase 2 (3+ months, data-gated):** ML-powered suggestions
- Cross-bar trend detection (anonymized pattern comparison)
- Personalization (learns each bar's posting style and optimal times)
- Predictive ("this type of event typically gets X views in your area")

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
