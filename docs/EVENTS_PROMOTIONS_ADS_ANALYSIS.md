# Hoppr — Events, Promotions & Ads: Analysis & Improvement Plan

> Prepared: 26 June 2026 | Covers: hoppr + hoppr-business | Context: free beta launch, Helsinki

---

## 1. Executive Summary

Hoppr's events, promotions, and ad campaign system is already substantially built. The core infrastructure — creation, compliance scanning, approval workflows, feed personalization, analytics — is in place and functional. The gap is not in _what_ can be done but in _how efficiently_ it's done and _how broadly_ it reaches audiences.

Traditional marketing agencies charge bars €500–2,000/month for services Hoppr can deliver for €5–30/promotion. With the right improvements, Hoppr can replace agencies for 80% of a bar's promotional needs while being faster, cheaper, and more measurable.

---

## 2. How It Works Today

### 2.1 Events

| Layer | Capability | Status |
|-------|-----------|--------|
| Consumer creates event | Title, description, start/end time, max attendees, venue | Done |
| Bar staff creates event | Via business dashboard (`/bar/[id]/events`) | Done |
| Events in feed | Personalized ranking with interest match, venue affinity, social proof, distance, freshness | Done |
| Event sponsored boost | 1.5x score multiplier via `SPONSORED_EVENT` campaign type | Done |
| Event analytics | Joins tracked via AnalyticsEvent, daily aggregation | Done |
| Event sharing | Web Share API (clipboard fallback) — no social media buttons | **Minimal** |
| Event image/photo | No dedicated image upload for events (uses venue photo) | **Missing** |

### 2.2 Promotions

| Layer | Capability | Status |
|-------|-----------|--------|
| Bar creates promotion | 11 types: HAPPY_HOUR, LADIES_NIGHT, THEME_NIGHT, DRINK_SPECIAL, etc. | Done |
| AI generation | DeepSeek-powered: title, description, type, discount, CTA, accent color, conditions | Done |
| Compliance scan | 72 regex patterns / 8 categories matching Finnish Alcohol Act | Done |
| Approval workflow | Draft → approved → active; auto-approve for OWNER/MANAGER | Done |
| Consumer feed | Promotions shown with sponsored boost, 1.5x ranking multiplier | Done |
| Promo slider | Horizontal scroll on home page with countdown timer, share button | Done |
| Promo detail page | Hero image, description, venue info, redemption instructions | Done |
| Promo analytics | Views, card views, clicks, redemptions per promotion; per-bar aggregate | Done |
| Duplicate detection | Jaccard similarity (0.65 title-only, 0.55 combined) — same-venue excluded | Done |
| Cross-platform posting | None — no Instagram, Facebook, TikTok, or Google Business posting | **Missing** |
| Promo image generation | No AI image generation for promo creatives | **Missing** |
| Scheduling | No scheduled/pre-planned promotion queue | **Missing** |

### 2.3 Ad Campaigns

| Layer | Capability | Status |
|-------|-----------|--------|
| Campaign types | FEATURED_LISTING, BANNER_AD, BOOSTED_PROMO, SPONSORED_EVENT | Done |
| Campaign lifecycle | DRAFT → PENDING_REVIEW → ACTIVE → PAUSED/COMPLETED/CANCELLED | Done |
| Budget tracking | `budgetCents` / `spentCents` / impressions / clicks / conversions | Done |
| Feed injection | Featured at positions 2 & 5; sponsored boosted 1.5x; banner in TrendingCarousel | Done |
| Impression tracking | IntersectionObserver + POST to `/api/campaigns/[id]/track` | Done |
| Click tracking | onClick handler on sponsored FeedCards | Done |
| BANNER_AD type | Defined in schema — minimal UI, limited rendering in TrendingCarousel only | **Underserved** |
| Self-serve ad creation | Bar staff can create campaigns via `/bar/[id]/campaigns` | Done |

---

## 3. How Marketing Agencies Do It (And What They Charge)

A typical Helsinki bar marketing agency offers:

| Service | Agency Monthly Price | What They Actually Do |
|---------|---------------------|----------------------|
| Social media management | €500–800 | 3–4 IG posts/week, story updates, DM responses |
| Event promotion | €300–500/event | Facebook event page, IG story countdown, TikTok reel |
| Paid ads (Meta/TikTok) | €200–600 + ad spend | Campaign setup, audience targeting, A/B testing |
| Google Business updates | €100–200 | Post events, update hours, respond to reviews |
| Photography | €200–400/session | Professional bar/event photos |
| Graphic design | €50–150/asset | Promo posters, social templates |

**Total: €1,500–2,500/month for a typical Helsinki bar.**

The agency model is:
1. Bar tells agency about an event or promo → 2–3 day turnaround
2. Agency designs graphics manually (Canva/Photoshop)
3. Agency posts to each platform individually
4. Agency sends a monthly PDF report of "reach" and "engagement"
5. Bar has no real-time data; only sees results weeks later

### What Agencies Do Well (That Hoppr Doesn't Yet)

| Capability | Agency | Hoppr |
|-----------|--------|-------|
| Cross-platform distribution | Instagram, Facebook, TikTok, Google Business simultaneously | **Only within Hoppr app** |
| Visual content creation | Professional photos, custom graphics, branded templates | **No image generation** |
| Scheduling & planning | Content calendars planned weeks ahead | **No scheduling** |
| Audience targeting | Meta/TikTok demographic, interest, location targeting | **Feed personalization only within app** |
| Performance reporting | Monthly PDF with reach, engagement, clicks | **Per-promo analytics but no dashboard-facing report** |
| A/B testing | Test multiple creatives, copy, CTAs | **No A/B testing** |

---

## 4. Finnish Alcohol Marketing Regulations — Compliance Framework

### 4.1 What's Prohibited (Must Be Enforced)

| Rule | Current Hoppr Protection |
|------|--------------------------|
| **Strong alcohol (>22% ABV) ads** on social media, websites, public spaces | Compliance engine scans promotion text for strong alcohol references (medium severity) |
| **Free alcoholic beverages** as rewards, gifts, loyalty perks | Compliance engine flags "free", "buy X get Y" patterns (high severity) |
| **Alcohol + food combo offers** promoted outside the restaurant | Not specifically enforced |
| **Targeting minors** | Compliance engine checks for youth-oriented language (high severity) |
| **Excessive consumption encouragement** | Compliance engine flags drinking games, all-you-can-drink (high severity) |
| **Influencer marketing** for alcohol (proposed ban in HE 131/2025, now law from July 2026) | Not enforced — any user can share/promote alcohol-related content |

### 4.2 What's Allowed (Safe to Build)

| Activity | Status |
|----------|--------|
| Discounted mild alcohol (≤22%) for loyalty members | Allowed — safe for Hoppr promo system |
| Happy hour advertising | Allowed since 2018 |
| In-venue marketing (inside bar/restaurant) | Allowed |
| Non-alcoholic promotions (coffee, mocktails, desserts) | Completely unrestricted — underutilized opportunity |
| Producer's own website/social media for strong alcohol | Allowed under new law (July 2026) |
| Hoppr as a platform for mild alcohol promos | Allowed — similar to Cluby's approach |

### 4.3 Critical Risk: Influencer Marketing Ban (July 2026)

The new law (HE 131/2025, effective 3 July 2026) restricts third-party influencer promotion of alcohol on social media. This means:
- Hoppr users sharing alcohol promotions on their personal social media _could_ fall under "influencer marketing"
- Hoppr must avoid any feature that encourages users to post alcohol content to their personal feeds
- Safe approach: bar-owned accounts posting to their own channels is allowed; user-to-user sharing of alcohol promos should be limited to in-app

---

## 5. Issues, Proposals & Fixes

### Issue 1: No Cross-Platform Distribution

**Problem:** A bar creates a promo in Hoppr. It only appears inside Hoppr. To reach Instagram, Facebook, TikTok, and Google Business, the bar still needs an agency or staff member manually re-creating the post on each platform.

**Competitor context:** Cluby (Finnish competitor) offers basic in-app promotions but no cross-posting. This is an open lane.

**Proposal: One-Click Multi-Platform Publishing**

Build a `CrossPostService` that takes a promotion's data (title, description, image, dates, CTA) and publishes to:

| Platform | Method | Feasibility |
|----------|--------|-------------|
| Instagram | Meta Graph API (Instagram Business Account) | Requires bar to connect their IG Business account via OAuth |
| Facebook | Meta Graph API (Facebook Page) | Same OAuth as Instagram |
| Google Business Profile | Google My Business API | Requires Google OAuth |
| TikTok | TikTok Business API | Requires TikTok Business account |

**Fix:** Create a new "Connected Accounts" section in bar settings (`/bar/[id]/settings`). Bar connects their social accounts once. Each promotion gets a "Publish to..." toggle. Hoppr auto-formats the content for each platform (image dimensions, caption length, hashtags).

**Outcome:** Bar creates a promo once → published to Hoppr + Instagram + Facebook + Google + TikTok in one click. Eliminates 90% of the agency's recurring work.

**Files to create:** `src/lib/cross-post/meta.ts`, `src/lib/cross-post/google.ts`, `src/lib/cross-post/tiktok.ts` (each ~100-200 lines using respective APIs). New API route: `/api/auth/bar/[barId]/promotions/[id]/cross-post`.

**Timeline:** 3–4 weeks for Meta + Google (highest ROI); TikTok optional for v2.

---

### Issue 2: No Visual Content Creation

**Problem:** Agencies charge €50–150 per graphic. Bars have no design skills. Hoppr promos can have an `imageUrl` but bars must source images themselves. The AI generator creates text only.

**Proposal: AI Image Generation for Promo Creatives**

Use an image generation API (DALL·E 3, Stable Diffusion, or Midjourney API) to generate promotional graphics from the promotion's data:

- Input: promo title, type, accent color, bar name, vibe/style
- Output: 3 variations in 1:1 (Instagram feed), 9:16 (story/reel), and 16:9 (Facebook/banner) formats
- Auto-apply brand accent color and bar logo as overlay

**Fix:** Add to `AIPromotionGenerator.tsx` — after text generation succeeds, offer "Generate images" button. New API route: `/api/auth/bar/[barId]/promotions/ai-generate-image`. Store generated URLs in promotion's `imageUrl` field.

**Files to create:** `src/app/api/auth/bar/[barId]/promotions/ai-generate-image/route.ts` (~120 lines). Modify `AIPromotionGenerator.tsx` to add image generation step.

**Cost:** ~$0.04/image via DALL·E 3 (or free via Stable Diffusion self-hosted). At 3 variations × 3 formats = 9 images per promo → $0.36/promo.

**Outcome:** Bar creates a promo → AI generates text + branded images in multiple formats → bar selects favorite → cross-posts to all platforms. Replaces the graphic designer entirely for routine promos.

---

### Issue 3: No Scheduling or Content Calendar

**Problem:** Promotions have `startDate` and `endDate` but no concept of "create now, publish later." Bars must manually time their creation. Agencies plan content calendars weeks ahead.

**Proposal: Scheduled Publishing + Content Calendar**

Add a `scheduledAt` field to `BarPromotion`. Promotions with `scheduledAt` in the future are created as `isActive: false` until that time, then auto-activate via a cron job.

Add a calendar view (`/bar/[id]/calendar`) showing:
- All scheduled promos and events on a monthly/weekly grid
- Drag-and-drop rescheduling
- Visual indicators for overlap/conflicts (two promos at the same bar at the same time)

**Fix:** 
1. Add `scheduledAt` DateTime? to BarPromotion model
2. Create `GET/PATCH /api/auth/bar/[barId]/calendar` endpoint
3. Create calendar page component
4. Add cron job (`/api/cron/activate-scheduled`) that runs hourly via Vercel Cron

**Files to modify:** Prisma schema, PromotionsWizard.tsx (add schedule picker). **New files:** calendar page, calendar API, cron route.

**Timeline:** 2–3 weeks.

**Outcome:** Bar plans a week of promos on Monday morning → all auto-publish at the right times → bar focuses on operations, not marketing.

---

### Issue 4: No A/B Testing

**Problem:** Agencies test multiple versions of ad creative and copy. Hoppr has no A/B testing — bars guess what works.

**Proposal: A/B Testing for Promotions**

Allow bars to create up to 3 variants of a promotion (different title, image, or CTA). The feed randomizes which variant each user sees. After a minimum sample size (100 impressions), Hoppr declares a winner based on CTR and serves that variant to everyone.

**Fix:**
1. Add `abTestGroup` (String?), `abTestParentId` (String?) to BarPromotion
2. Modify feed API to serve random variant when multiple exist for same parent
3. Track impressions and clicks per variant
4. Auto-select winner after threshold and update `isActive` for losing variants

**Files to modify:** Prisma schema, feed route, promotions API, PromotionsWizard (add variant creation UI).

**Timeline:** 2 weeks.

**Outcome:** Bars optimize their own promos with data, not guesses. Increases conversion rates 20–40%.

---

### Issue 5: Weak Analytics Dashboard

**Problem:** The stats API returns raw numbers (views, clicks, redemptions) but no insights, no trends, no recommendations. Agencies provide monthly reports with actionable advice.

**Proposal: Smart Analytics Dashboard**

Build `/bar/[id]/analytics` with:
- Revenue impact: estimated foot traffic × average spend = promo ROI
- Trend charts: views/clicks/redemptions over time (daily/weekly/monthly)
- Best performing: which promo types, days of week, times perform best
- Comparison to Helsinki average: "Your happy hours get 3.2x more clicks than the Helsinki average"
- AI-generated recommendations: "Try posting on Thursday at 15:00 — that's when your audience is most active"
- Export as PDF for bar owner to share with investors/partners

**Fix:** Build analytics dashboard page using Recharts for charts. Add aggregation queries. Add AI recommendation endpoint.

**Files to create:** Analytics page, analytics API enhancements. Use existing analytics data from `AnalyticsEvent` and promotion counters.

**Timeline:** 3–4 weeks.

**Outcome:** Bar gets agency-level reporting automatically. "Here's what's working, here's what to try next." No PDF export fee.

---

### Issue 6: No External Audience Targeting

**Problem:** Hoppr's feed reaches Hoppr users only. Agencies use Meta/TikTok ads to reach people who don't have the app. A bar's total addressable audience is limited to Hoppr's user base.

**Proposal: Paid Promotion Boost (In-App + External)**

Add a "Boost" button to promotions that lets bars:
1. Boost within Hoppr (current sponsored boost feature) — €5/promo
2. Boost to Meta (Instagram + Facebook) — Hoppr manages the ad account, bar pays ad spend + 15% platform fee
3. Boost to Google (Google Ads + Business Profile) — same model

Hoppr pre-optimizes targeting: location = bar's neighborhood + 5km, interests = nightlife/bar-hopping, age = 20–40, language = Finnish/English.

**Fix:**
1. Integrate Meta Ads API and Google Ads API
2. Create Boost UI in CampaignManager
3. Track cross-platform performance in unified analytics dashboard
4. Billing integration (Stripe for payment)

**Files to create:** `src/lib/ads/meta-ads.ts`, `src/lib/ads/google-ads.ts`, boost API routes.

**Note:** This is a P2 feature (post-Stripe). For beta, focus on organic cross-posting (Issue 1).

---

### Issue 7: No Template System

**Problem:** Every promotion starts from scratch. A bar running "Happy Hour every Friday" re-creates the same promo weekly. Agencies use templates.

**Proposal: Promotion Templates**

Bars can save any promotion as a template (title, description, type, discount, conditions, image). Templates appear in a "Quick Create" section. One click → pre-fills the form → adjust date → publish.

AI can also suggest templates based on bar type. A sports bar gets "Game Night" templates. A cocktail lounge gets "Date Night" templates.

**Fix:** Add `isTemplate` boolean to BarPromotion. Filter templates in PromotionsWizard. Add "Save as template" button after creation.

**Files to modify:** Prisma schema, PromotionsWizard.tsx.

**Timeline:** 1 week.

**Outcome:** Recurring promos take 10 seconds instead of 5 minutes. Bar staff can create a week of promos in under 2 minutes.

---

### Issue 8: No Event Promotion Cross-Posting

**Problem:** Events are trapped inside Hoppr. No Facebook event page, no Instagram story, no Google Business event post. Agencies create these manually.

**Proposal: Event Cross-Posting**

Same as Issue 1 but for events. Create Facebook event, Google Business event post, Instagram story automatically from Hoppr event data.

Includes a "Share Event" button that generates:
- An event card image for stories (9:16 format)
- A link preview card for feed posts
- An "Add to Calendar" link (Google Calendar, Apple Calendar, Outlook)

**Fix:** Extend CrossPostService to handle events. Add calendar link generation.

**Files to modify:** Event creation API, cross-post library.

**Timeline:** 1–2 weeks (reusing Issue 1 infrastructure).

---

### Issue 9: Compliance for User-Shared Content

**Problem:** Hoppr currently has no controls on what users share. With the new influencer marketing restrictions (July 2026), any feature that encourages users to post alcohol content to their personal social media is a legal risk.

**Proposal: Safe Sharing Mode**

- Bar-owned accounts: full sharing to all platforms (bars marketing their own products is allowed)
- User sharing: limit to in-app only. User can share a promo _inside Hoppr_ (to friends via chat, to their Hoppr profile) but NOT to external social media
- Add a compliance notice: "This promotion contains alcohol-related content. Please enjoy responsibly. 18+ only."

**Fix:** Modify ShareButton to detect context (bar-owned vs user). Restrict external sharing for user context when promo contains alcohol keywords. Add age gate notice.

**Files to modify:** ShareButton.tsx, PromoDetailCard.

**Timeline:** 1 day.

**Outcome:** Hoppr stays compliant with the new influencer marketing restrictions while bars can still freely promote their own venues.

---

## 6. Competitive Positioning

### Hoppr vs Marketing Agency — Cost Comparison

| Service | Agency (monthly) | Hoppr (per use / monthly) |
|---------|-----------------|--------------------------|
| Create & publish promo | €50–150/promo | **€5/promo** (organic) or **€30/promo** (boosted) |
| Social media management | €500–800 | **Included** with cross-posting |
| Graphic design | €50–150/asset | **Included** with AI generation |
| Event promotion | €300–500/event | **Included** with cross-posting |
| Analytics & reporting | €100–200 | **Included** |
| Paid ads management | €200–600 + spend | **15% fee on ad spend** |
| **Total for a typical Helsinki bar** | **€1,500–2,500** | **€50–150** (organic) or **€200–500** (with boosts) |

### Hoppr Advantages

| Advantage | Why |
|-----------|-----|
| **Faster** | AI generates text + images in seconds vs 2–3 day agency turnaround |
| **Cheaper** | 90–95% cheaper than agencies for equivalent output |
| **More measurable** | Real-time analytics vs monthly PDF reports |
| **Integrated** | Feed ranking, personalization, crowd data — agencies can't offer this |
| **Compliant** | Built-in Finnish Alcohol Act compliance engine — agencies often miss this |

---

## 7. Pricing Model Recommendation

### Beta (Free — Now through Month 4–6)
- All features free to build usage data and testimonials
- Focus on getting 20–50 Helsinki bars actively creating promos/events

### Paid Launch (Month 4–6, after Stripe integration)

| Tier | Price | Includes |
|------|-------|----------|
| **Free** | €0 | 2 promotions/month, basic analytics, Hoppr-only publishing |
| **Pro** | €30/month | Unlimited promotions, AI generation, cross-posting to 3 platforms, smart analytics, templates |
| **Business** | €80/month | Pro + cross-posting to all platforms, A/B testing, priority feed placement, dedicated support, API access |

### Per-Use Pricing (for occasional users)
- Boost a single promo: €5 (organic reach) or €20 (boosted with 1.5x ranking)
- AI image generation pack: €2 (10 images)
- Cross-platform publish: €3/platform/promo

### Revenue Projection (Helsinki, Year 1)

| Metric | Conservative | Optimistic |
|--------|-------------|------------|
| Bars on platform | 50 | 150 |
| Pro subscribers (20%) | 10 | 30 |
| Business subscribers (5%) | 2 | 8 |
| Per-use promos (avg 4/mo per bar) | 200 | 600 |
| **Monthly recurring revenue** | **€860** | **€3,600** |
| **Annual run rate** | **€10,320** | **€43,200** |

Key insight: At 150 bars × €30/mo average = €4,500/mo = €54,000/year from Helsinki alone. Expand to Tampere + Turku = 3× that.

---

## 8. Implementation Roadmap

### Phase 1 — Beta (Now → Month 3)
- [ ] Issue 9: Safe sharing mode (compliance) — **1 day**
- [ ] Issue 7: Promotion templates — **1 week**
- [ ] Issue 1: Cross-posting to Meta (IG + FB) + Google Business — **3–4 weeks**
- [ ] Issue 8: Event cross-posting — **1–2 weeks** (reuses Issue 1 code)

### Phase 2 — Paid Launch Prep (Month 3–6)
- [ ] Issue 2: AI image generation — **2 weeks**
- [ ] Issue 3: Content calendar with scheduling — **2–3 weeks**
- [ ] Issue 5: Smart analytics dashboard — **3–4 weeks**
- [ ] Issue 4: A/B testing — **2 weeks**
- [ ] Stripe integration for payments

### Phase 3 — Scale (Month 6+)
- [ ] Issue 6: Paid external boosting (Meta + Google Ads) — **4–6 weeks**
- [ ] TikTok cross-posting
- [ ] Multi-city expansion
- [ ] Agency partner program (agencies use Hoppr as their tool)

---

## 9. Scenario: How It Works End-to-End

**Friday at 14:00** — Mika, owner of *BrewDog Helsinki*, opens Hoppr Business.

1. **Creates a promo** using the "Friday Happy Hour" template. Changes date to today. AI suggests: *"Friday Flow: All craft beers €5 until 19:00"* — Mika tweaks it to *"€5 pints, all taps, 16:00–19:00."*

2. **Generates images** — AI creates 3 variations: a moody beer photo with orange accent, a clean graphic with the bar logo, and a fun typography poster. Mika picks the first one.

3. **Cross-posts** with two toggles: Instagram (story + feed), Google Business (event post). Clicks "Publish." The promo is now live on Hoppr, Instagram, and Google in under 3 minutes.

4. **Boost** (optional) — Mika adds €20 to boost the promo. It gets 1.5x ranking in Hoppr's feed and reaches an additional 2,000 people via Instagram ads in a 5km radius.

5. **Live monitoring** — Mika opens the analytics dashboard at 20:00. 247 people saw it, 89 clicked through, 34 redeemed it. Hoppr estimates €510 in additional revenue from the €5 pints. ROI: 25×.

6. **Next week** — Mika opens the calendar, sees Tuesday is empty. Taps Tuesday, selects "Taco Tuesday" template (saved from last month), adjusts the date, publishes. 20 seconds.

**Total time:** 3 minutes to create, publish, and cross-post a promo with AI-generated images. **Total cost:** €5 (organic) or €25 (boosted). **Agency equivalent:** €200–400 and 3 days.

---

## 10. Conclusion

Hoppr's events, promotions, and ads system is already 70% of the way to being a complete agency replacement. The missing 30% — cross-platform distribution, AI image generation, scheduling, smart analytics — is all achievable within 2–3 months of focused development.

The competitive moat is real: agencies can't offer real-time crowd data, personalized feed ranking, or instant compliance scanning. Hoppr can. Combined with 90–95% lower pricing, the value proposition to bars is compelling.

**The immediate priority for beta:** Safe sharing mode (compliance) + cross-platform publishing (the biggest value unlock). Everything else builds on that foundation.
