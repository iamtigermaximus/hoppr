# Bar Creation Platform Improvements — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

> **Repository:** All work targets `/Users/siegfredgamboa/hoppr-business` (the bar management platform). The consumer `hoppr` app is NOT modified by this plan. The shared Prisma schema in this repo (`prisma/schema.prisma`) gets the new models; hoppr-business references the same database.

**Goal:** Add proactive insights chatbot, photo stock fallback, single-sentence auto-classification, and pricing plans to the existing hoppr-business creation platform.

**Architecture:** Four independent milestones. All new data models go into the shared Prisma schema used by both `hoppr` and `hoppr-business`. Each milestone produces working, testable software on its own. The chatbot reads from existing `AnalyticsEvent` and `BarPromotion` counter data — no new tracking infrastructure needed.

**Tech Stack:** Next.js 16 (App Router), TypeScript, Prisma 6, PostgreSQL (Neon), Vercel Cron Jobs, Stripe, Unsplash API

---

## File Structure Map

### Prisma (shared)
- Modify: `prisma/schema.prisma` — add BarInsight, InsightMessage, InsightPreference, BarSubscription models + enums

### Photo Stock Fallback
- Create: `src/lib/stock-photos.ts` — Unsplash/Pexels API client with caching
- Create: `src/app/api/auth/bar/[barId]/stock-photos/route.ts` — search endpoint
- Modify: `src/components/bar/create/CreateHubClient.tsx` — add stock photo grid after AI generation
- Create: `src/components/bar/create/StockPhotoPicker.tsx` — photo selection UI

### Auto-Classification
- Modify: `src/components/bar/create/CreateHubClient.tsx` — remove required tab, add auto-classify
- Modify: `src/components/bar/create/AIIntentBox.tsx` — enhance prompt with classification
- Modify: `src/components/bar/create/ContentTypeTabs.tsx` — make tabs optional bias selectors

### Pricing
- Create: `src/lib/billing.ts` — Stripe integration
- Create: `src/lib/plan-gate.ts` — feature gate utility
- Create: `src/app/api/auth/bar/[barId]/subscription/route.ts` — CRUD for subscriptions
- Create: `src/app/api/stripe/webhook/route.ts` — Stripe webhook handler
- Create: `src/components/bar/dashboard/PlanBadge.tsx` — plan indicator
- Create: `src/components/bar/settings/PricingPage.tsx` — plan selection UI

### Insights Chatbot
- Create: `src/lib/insights/triggers.ts` — 5 rule-based trigger functions
- Create: `src/lib/insights/aggregator.ts` — weekly summary computation
- Create: `src/app/api/auth/bar/[barId]/insights/route.ts` — GET latest insight, POST dismiss/act
- Create: `src/app/api/auth/bar/[barId]/insights/chat/route.ts` — GET history, POST message
- Create: `src/app/api/cron/insights/route.ts` — cron job handler
- Create: `src/components/bar/dashboard/InsightCard.tsx` — home screen card
- Create: `src/components/bar/dashboard/ChatPanel.tsx` — expandable chat
- Modify: `src/components/bar/dashboard/BarDashboard.tsx` — integrate InsightCard + ChatPanel

---

## Milestone 1: Photo Stock Fallback

### Task 1.1: Unsplash API Client

**Files:**
- Create: `src/lib/stock-photos.ts`

- [ ] **Step 1: Create the stock photos client**

```typescript
// src/lib/stock-photos.ts
const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;
const BASE = "https://api.unsplash.com";

interface StockPhoto {
  id: string;
  url: string;
  thumb: string;
  alt: string;
  photographer: string;
}

const cache = new Map<string, { photos: StockPhoto[]; expires: number }>();

// Maps AI-inferred post types to Unsplash search queries
const QUERIES: Record<string, string> = {
  happy_hour: "cocktail bar interior",
  drink_special: "cocktail bar interior",
  dj_night: "nightclub crowd dance floor",
  live_music: "live music stage bar",
  sports: "sports bar tv screen",
  ladies_night: "nightclub crowd",
  theme_night: "bar event crowd",
  food_special: "bar food",
  skip_line: "nightclub vip entrance",
  cover_included: "nightclub crowd",
  premium_entry: "luxury bar vip",
  drink_package: "cocktail bar drinks",
  default: "trendy bar interior",
};

export async function searchStockPhotos(
  type: string,
  count: number = 4
): Promise<StockPhoto[]> {
  const query = QUERIES[type] || QUERIES.default;
  const cacheKey = `${query}-${count}`;

  const cached = cache.get(cacheKey);
  if (cached && cached.expires > Date.now()) {
    return cached.photos;
  }

  if (!UNSPLASH_ACCESS_KEY) {
    return []; // graceful degradation — no photos shown if API not configured
  }

  const params = new URLSearchParams({
    query,
    per_page: String(count),
    orientation: "landscape",
    content_filter: "high",
  });

  const res = await fetch(`${BASE}/search/photos?${params}`, {
    headers: { Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}` },
  });

  if (!res.ok) return [];

  const data = await res.json();
  const photos: StockPhoto[] = (data.results || []).map((r: any) => ({
    id: r.id,
    url: r.urls.regular,
    thumb: r.urls.thumb,
    alt: r.alt_description || r.description || query,
    photographer: r.user.name,
  }));

  cache.set(cacheKey, { photos, expires: Date.now() + 1000 * 60 * 60 }); // 1h cache
  return photos;
}

// Track which photos bars actually use for analytics
export async function trackStockPhotoUsage(
  barId: string,
  photoId: string,
  photographer: string
): Promise<void> {
  // Fire-and-forget analytics event
  fetch(`${BASE}/photos/${photoId}/download?client_id=${UNSPLASH_ACCESS_KEY}`)
    .catch(() => {});
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/stock-photos.ts
git commit -m "feat: add Unsplash stock photo client with 1h query cache"
```

### Task 1.2: Stock Photos API Endpoint

**Files:**
- Create: `src/app/api/auth/bar/[barId]/stock-photos/route.ts`

- [ ] **Step 1: Create the endpoint**

```typescript
// src/app/api/auth/bar/[barId]/stock-photos/route.ts
import { NextRequest, NextResponse } from "next/server";
import { searchStockPhotos } from "@/lib/stock-photos";
import { authenticateBarStaff } from "@/services/auth-service";

export async function GET(
  req: NextRequest,
  { params }: { params: { barId: string } }
) {
  const auth = await authenticateBarStaff(params.barId);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const type = req.nextUrl.searchParams.get("type") || "default";
  const count = Math.min(
    parseInt(req.nextUrl.searchParams.get("count") || "4"),
    8
  );

  const photos = await searchStockPhotos(type, count);
  return NextResponse.json({ photos });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/auth/bar/[barId]/stock-photos/route.ts
git commit -m "feat: add stock photos API endpoint for bar creation"
```

### Task 1.3: Stock Photo Picker Component

**Files:**
- Create: `src/components/bar/create/StockPhotoPicker.tsx`

- [ ] **Step 1: Create the picker component**

```typescript
// src/components/bar/create/StockPhotoPicker.tsx
"use client";

import { useState, useEffect } from "react";
import styled from "styled-components";

interface StockPhoto {
  id: string;
  url: string;
  thumb: string;
  alt: string;
  photographer: string;
}

interface Props {
  contentType: string; // AI-inferred type like "happy_hour", "dj_night"
  onSelect: (photo: StockPhoto) => void;
  onSkip: () => void;
  barId: string;
}

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
`;

const PhotoTile = styled.button`
  border: none;
  border-radius: 8px;
  overflow: hidden;
  aspect-ratio: 16/10;
  cursor: pointer;
  background-size: cover;
  background-position: center;
  position: relative;
  transition: transform 0.15s;
  &:hover {
    transform: scale(1.02);
    outline: 2px solid #7c3aed;
  }
`;

const SkipButton = styled.button`
  width: 100%;
  padding: 10px;
  background: transparent;
  border: 1px solid #333;
  color: #888;
  border-radius: 8px;
  font-size: 13px;
  cursor: pointer;
  margin-top: 12px;
`;

const Nudge = styled.p`
  font-size: 11px;
  color: #888;
  text-align: center;
  margin-top: 8px;
`;

export function StockPhotoPicker({ contentType, onSelect, onSkip, barId }: Props) {
  const [photos, setPhotos] = useState<StockPhoto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/auth/bar/${barId}/stock-photos?type=${contentType}&count=4`)
      .then((r) => r.json())
      .then((data) => setPhotos(data.photos || []))
      .finally(() => setLoading(false));
  }, [contentType, barId]);

  if (loading) {
    return (
      <Grid>
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            style={{
              aspectRatio: "16/10",
              background: "#1a1a2e",
              borderRadius: 8,
            }}
          />
        ))}
      </Grid>
    );
  }

  if (photos.length === 0) {
    return (
      <SkipButton onClick={onSkip}>
        No stock photos available. Skip this step.
      </SkipButton>
    );
  }

  return (
    <div>
      <p style={{ fontSize: 12, color: "#888", marginBottom: 8 }}>
        Pick a photo or upload your own
      </p>
      <Grid>
        {photos.map((p) => (
          <PhotoTile
            key={p.id}
            style={{ backgroundImage: `url(${p.thumb})` }}
            onClick={() => onSelect(p)}
            aria-label={p.alt}
          />
        ))}
      </Grid>
      <SkipButton onClick={onSkip}>Skip for now</SkipButton>
      <Nudge>
        Real bar photos get 3x more views than stock. Upload yours anytime.
      </Nudge>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/bar/create/StockPhotoPicker.tsx
git commit -m "feat: add stock photo picker component with Unsplash integration"
```

### Task 1.4: Integrate Into Creation Flow

**Files:**
- Modify: `src/components/bar/create/CreateHubClient.tsx`

- [ ] **Step 1: Add photo step between AI generation and review**

Locate the existing flow in `CreateHubClient.tsx` where the AI generation completes and the review step begins. Insert the `StockPhotoPicker` step:

```typescript
// Add import at top
import { StockPhotoPicker } from "./StockPhotoPicker";

// Add state for stock photo flow
const [stockPhoto, setStockPhoto] = useState<StockPhoto | null>(null);
const [showPhotoPicker, setShowPhotoPicker] = useState(false);

// After AI generation completes, set showPhotoPicker = true
// Insert between generation step and review step:

{showPhotoPicker && !stockPhoto && (
  <div style={{ padding: "16px 0" }}>
    <StepLabel>Add a photo</StepLabel>
    <StockPhotoPicker
      contentType={aiGeneratedType || "default"}
      onSelect={(photo) => {
        setStockPhoto(photo);
        setImageUrl(photo.url);
      }}
      onSkip={() => setShowPhotoPicker(false)}
      barId={barId}
    />
    {/* Existing file upload button still available below */}
    <UploadButton onClick={() => fileInputRef.current?.click()}>
      Upload your own photo instead
    </UploadButton>
  </div>
)}
```

- [ ] **Step 2: Add UNSPLASH_ACCESS_KEY to .env.example**

```
UNSPLASH_ACCESS_KEY=  # optional, for stock photo suggestions in creation flow
```

- [ ] **Step 3: Commit**

```bash
git add src/components/bar/create/CreateHubClient.tsx .env.example
git commit -m "feat: integrate stock photo picker into creation flow"
```

---

## Milestone 2: Single-Sentence Auto-Classification

### Task 2.1: Enhance AI Intent Box Prompt

**Files:**
- Modify: `src/components/bar/create/AIIntentBox.tsx`

- [ ] **Step 1: Add classification instructions to the AI prompt**

Locate the existing system prompt or AI generation call in `AIIntentBox.tsx`. Add classification instructions:

```typescript
// Find the existing prompt sent to the AI and prepend/append classification logic.
// The key addition: AI must classify the content type from the user's sentence
// BEFORE generating structured fields.

const CLASSIFICATION_PROMPT = `
You are helping a bar owner create content for Hoppr, Finland's nightlife platform.

First, classify the user's input into one or more types:
- "event" — a happening at a specific date/time (party, live music, sports viewing, etc.)
- "promotion" — an ongoing offer or deal (happy hour, discount, ladies night, etc.)
- "pass" — a VIP pass or ticket for sale (skip line, cover included, drink package, etc.)
- "combo" — the sentence describes BOTH an event AND a promotion/pass

Then extract these fields:
- title: short, catchy, max 60 chars
- description: 1-2 sentences, max 200 chars
- startTime: ISO datetime (infer from "tonight", "Friday", "tomorrow", etc. — always use upcoming dates)
- endTime: ISO datetime (if implied)
- offerDetails: the deal/promotion text if present
- passType: skip_line | cover_included | premium_entry | drink_package (only if pass)
- price: number in euros (only if pass and price is mentioned)

Return as JSON: { types: string[], event: {...}, promotion: {...}, pass: {...} }

If the user's sentence contains BOTH an event description AND an offer/deal,
return types: ["event", "promotion"] with both objects populated.
`;

// Insert this as the system message before the user's input in the AI call.
// The existing prompt structure should be preserved — this is an addition.
```

- [ ] **Step 2: Parse classification in the response handler**

```typescript
// In the AI response handler, parse the classification:
interface AIClassification {
  types: string[];
  event?: { title: string; description: string; startTime: string; endTime?: string };
  promotion?: { title: string; description: string; discount?: number; conditions?: string[] };
  pass?: { name: string; description: string; passType: string; price?: number };
}

const classified: AIClassification = JSON.parse(aiResponse);
// Set the active tab(s) based on classified.types
// Pre-fill UnifiedForm with the extracted fields
```

- [ ] **Step 3: Commit**

```bash
git add src/components/bar/create/AIIntentBox.tsx
git commit -m "feat: add auto-classification to AI intent box prompt"
```

### Task 2.2: Make Content Type Tabs Optional

**Files:**
- Modify: `src/components/bar/create/ContentTypeTabs.tsx`
- Modify: `src/components/bar/create/CreateHubClient.tsx`

- [ ] **Step 1: Add combo mode and remove required selection**

```typescript
// In ContentTypeTabs.tsx, update the props:
interface Props {
  activeTypes: string[];  // was: activeType: string
  onChange: (types: string[]) => void;  // was: (type: string) => void
  disabled?: boolean;     // new: disabled state while AI is working
}

// Add a "Combo" indicator when multiple types are active:
{activeTypes.includes("event") && activeTypes.includes("promotion") && (
  <ComboBadge>Event + Promotion</ComboBadge>
)}

// In CreateHubClient.tsx, remove the required initial tab selection.
// The tabs become visible AFTER the user types and the AI classifies:
const [activeTypes, setActiveTypes] = useState<string[]>([]);
const [hasClassification, setHasClassification] = useState(false);

// After AI response:
setActiveTypes(classified.types);
setHasClassification(true);
// The tabs now reflect the AI's decision — user can override but doesn't have to
```

- [ ] **Step 2: Commit**

```bash
git add src/components/bar/create/ContentTypeTabs.tsx src/components/bar/create/CreateHubClient.tsx
git commit -m "feat: make content type tabs optional, add combo mode from AI classification"
```

### Task 2.3: Support Combo Creation on Submit

**Files:**
- Modify: `src/app/api/auth/bar/[barId]/create/submit/route.ts` (or equivalent creation endpoint)

- [ ] **Step 1: Handle combo submissions**

```typescript
// In the creation endpoint, check if the submission includes multiple types:
const { types, event, promotion, pass } = req.body;

const results: any[] = [];

if (types.includes("event") || event) {
  const created = await prisma.event.create({
    data: {
      ...eventFields,
      barId: params.barId,
      complianceStatus: "COMPLIANT",
    },
  });
  results.push({ type: "event", id: created.id });
}

if (types.includes("promotion") || promotion) {
  const created = await prisma.barPromotion.create({
    data: {
      ...promotionFields,
      barId: params.barId,
      complianceStatus: "COMPLIANT",
    },
  });
  results.push({ type: "promotion", id: created.id });
}

if (types.includes("pass") || pass) {
  const created = await prisma.vIPPassEnhanced.create({
    data: {
      ...passFields,
      barId: params.barId,
    },
  });
  results.push({ type: "pass", id: created.id });
}

// If both event and promotion created, link them via metadata
if (results.length > 1) {
  // Add cross-reference in description: "Part of [Event Name]"
}

return NextResponse.json({ results }, { status: 201 });
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/auth/bar/[barId]/create/submit/route.ts
git commit -m "feat: support combo creation — event + promotion from one sentence"
```

---

## Milestone 3: Pricing Infrastructure

### Task 3.1: Prisma Schema — Subscription Model

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add new models and enums**

```prisma
// Add to enums section:
enum PlanTier {
  FREE
  PAY_PER_POST
  PRO
  SUPER_BAR
}

// Add to models section:
model BarSubscription {
  id                     String    @id @default(cuid())
  barId                  String    @unique
  plan                   PlanTier  @default(FREE)
  postsUsed              Int       @default(0)
  periodStart            DateTime
  periodEnd              DateTime
  stripeSubscriptionId   String?
  stripeCustomerId       String?
  createdAt              DateTime  @default(now())
  updatedAt              DateTime  @updatedAt

  bar Bar @relation(fields: [barId], references: [id], onDelete: Cascade)
}
```

- [ ] **Step 2: Run migration**

```bash
npx prisma migrate dev --name add_subscription_model
```

Expected output: migration created and applied successfully.

- [ ] **Step 3: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: add BarSubscription model and PlanTier enum"
```

### Task 3.2: Plan Gate Utility

**Files:**
- Create: `src/lib/plan-gate.ts`

- [ ] **Step 1: Create the feature gate**

```typescript
// src/lib/plan-gate.ts
import { prisma } from "@/lib/prisma";
import { PlanTier } from "@prisma/client";

interface PlanFeatures {
  maxPostsPerMonth: number;
  socialCrossPosting: boolean;
  advancedAnalytics: boolean;
  priorityPlacement: boolean;
  insightsChatbot: boolean;
  stockPhotos: boolean;
  maxStaffSeats: number;
  passCommissionPercent: number;
}

const FEATURES_BY_PLAN: Record<PlanTier, PlanFeatures> = {
  FREE: {
    maxPostsPerMonth: 2,
    socialCrossPosting: false,
    advancedAnalytics: false,
    priorityPlacement: false,
    insightsChatbot: false,
    stockPhotos: false,
    maxStaffSeats: 1,
    passCommissionPercent: 12,
  },
  PAY_PER_POST: {
    maxPostsPerMonth: Infinity,
    socialCrossPosting: true,
    advancedAnalytics: false,
    priorityPlacement: false,
    insightsChatbot: false,
    stockPhotos: false,
    maxStaffSeats: 1,
    passCommissionPercent: 10,
  },
  PRO: {
    maxPostsPerMonth: Infinity,
    socialCrossPosting: true,
    advancedAnalytics: true,
    priorityPlacement: true,
    insightsChatbot: false,
    stockPhotos: true,
    maxStaffSeats: 3,
    passCommissionPercent: 8,
  },
  SUPER_BAR: {
    maxPostsPerMonth: Infinity,
    socialCrossPosting: true,
    advancedAnalytics: true,
    priorityPlacement: true,
    insightsChatbot: true,
    stockPhotos: true,
    maxStaffSeats: Infinity,
    passCommissionPercent: 5,
  },
};

export async function getPlanFeatures(barId: string): Promise<PlanFeatures> {
  const sub = await prisma.barSubscription.findUnique({ where: { barId } });
  const plan = sub?.plan || "FREE";
  return FEATURES_BY_PLAN[plan];
}

export async function checkFeature(
  barId: string,
  feature: keyof PlanFeatures
): Promise<boolean> {
  const features = await getPlanFeatures(barId);
  return Boolean(features[feature]);
}

export async function checkPostLimit(
  barId: string
): Promise<{ allowed: boolean; used: number; max: number }> {
  const sub = await prisma.barSubscription.findUnique({ where: { barId } });
  const plan = sub?.plan || "FREE";
  const max = FEATURES_BY_PLAN[plan].maxPostsPerMonth;
  const used = sub?.postsUsed || 0;

  if (max === Infinity) return { allowed: true, used, max };

  // Reset counter if period has ended
  const now = new Date();
  if (sub && now > sub.periodEnd) {
    await prisma.barSubscription.update({
      where: { barId },
      data: { postsUsed: 0, periodStart: now, periodEnd: new Date(now.getFullYear(), now.getMonth() + 1, 1) },
    });
    return { allowed: true, used: 0, max };
  }

  return { allowed: used < max, used, max };
}

export async function incrementPostCount(barId: string): Promise<void> {
  await prisma.barSubscription.updateMany({
    where: { barId },
    data: { postsUsed: { increment: 1 } },
  });
}

export function formatPlanName(plan: PlanTier): string {
  const names: Record<PlanTier, string> = {
    FREE: "Free",
    PAY_PER_POST: "Pay as you go",
    PRO: "Pro",
    SUPER_BAR: "Super Bar",
  };
  return names[plan];
}

export const PLAN_PRICES: Record<string, number> = {
  PAY_PER_POST: 300,    // €3.00 in cents
  PRO: 1900,            // €19.00
  SUPER_BAR: 3900,      // €39.00
};
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/plan-gate.ts
git commit -m "feat: add plan-gate utility with feature gates and post limits"
```

### Task 3.3: Stripe Integration

**Files:**
- Create: `src/lib/billing.ts`

- [ ] **Step 1: Create Stripe billing module**

```typescript
// src/lib/billing.ts
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { PLAN_PRICES } from "./plan-gate";
import { PlanTier } from "@prisma/client";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-01-27",
});

export async function getOrCreateCustomer(
  barId: string,
  email: string
): Promise<string> {
  const sub = await prisma.barSubscription.findUnique({ where: { barId } });

  if (sub?.stripeCustomerId) {
    return sub.stripeCustomerId;
  }

  const customer = await stripe.customers.create({
    email,
    metadata: { barId },
  });

  await prisma.barSubscription.upsert({
    where: { barId },
    update: { stripeCustomerId: customer.id },
    create: {
      barId,
      stripeCustomerId: customer.id,
      plan: "FREE",
      periodStart: new Date(),
      periodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  return customer.id;
}

export async function createCheckoutSession(
  barId: string,
  plan: PlanTier,
  successUrl: string,
  cancelUrl: string
): Promise<string> {
  const customerId = await getOrCreateCustomer(barId, "");
  const priceInCents = PLAN_PRICES[plan];

  if (!priceInCents) {
    throw new Error(`No price configured for plan: ${plan}`);
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [
      {
        price_data: {
          currency: "eur",
          product_data: {
            name: `Hoppr ${plan.replace("_", " ")}`,
            description: `${plan} plan for bar marketing`,
          },
          unit_amount: priceInCents,
          recurring: { interval: "month" },
        },
        quantity: 1,
      },
    ],
    metadata: { barId, plan },
    success_url: successUrl,
    cancel_url: cancelUrl,
  });

  return session.url!;
}

export async function handleWebhook(
  payload: Buffer,
  signature: string
): Promise<void> {
  const event = stripe.webhooks.constructEvent(
    payload,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET || ""
  );

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      const { barId, plan } = session.metadata || {};
      if (barId && plan) {
        await prisma.barSubscription.update({
          where: { barId },
          data: {
            plan: plan as PlanTier,
            stripeSubscriptionId: session.subscription as string,
            postsUsed: 0,
            periodStart: new Date(),
            periodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        });
      }
      break;
    }
    case "customer.subscription.deleted": {
      const subscription = event.data.object;
      const barId = subscription.metadata?.barId;
      if (barId) {
        await prisma.barSubscription.update({
          where: { barId },
          data: { plan: "FREE", stripeSubscriptionId: null },
        });
      }
      break;
    }
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/billing.ts
git commit -m "feat: add Stripe billing integration"
```

### Task 3.4: Subscription API + Webhook

**Files:**
- Create: `src/app/api/auth/bar/[barId]/subscription/route.ts`
- Create: `src/app/api/stripe/webhook/route.ts`

- [ ] **Step 1: Create subscription management endpoint**

```typescript
// src/app/api/auth/bar/[barId]/subscription/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateBarStaff } from "@/services/auth-service";
import { checkPostLimit } from "@/lib/plan-gate";
import { createCheckoutSession } from "@/lib/billing";

export async function GET(
  req: NextRequest,
  { params }: { params: { barId: string } }
) {
  const auth = await authenticateBarStaff(params.barId);
  if (!auth || !["OWNER", "MANAGER"].includes(auth.staffRole)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sub = await prisma.barSubscription.findUnique({
    where: { barId: params.barId },
  });

  const postLimit = await checkPostLimit(params.barId);

  return NextResponse.json({
    plan: sub?.plan || "FREE",
    postsUsed: postLimit.used,
    postsMax: postLimit.max,
    stripeSubscriptionId: sub?.stripeSubscriptionId,
    periodEnd: sub?.periodEnd,
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { barId: string } }
) {
  const auth = await authenticateBarStaff(params.barId);
  if (!auth || !["OWNER", "MANAGER"].includes(auth.staffRole)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { plan } = await req.json();
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const checkoutUrl = await createCheckoutSession(
    params.barId,
    plan,
    `${baseUrl}/bar/${params.barId}/dashboard?upgraded=true`,
    `${baseUrl}/bar/${params.barId}/settings`
  );

  return NextResponse.json({ url: checkoutUrl });
}
```

- [ ] **Step 2: Create Stripe webhook endpoint**

```typescript
// src/app/api/stripe/webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import { handleWebhook } from "@/lib/billing";

export async function POST(req: NextRequest) {
  const payload = Buffer.from(await req.arrayBuffer());
  const signature = req.headers.get("stripe-signature") || "";

  try {
    await handleWebhook(payload, signature);
    return NextResponse.json({ received: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
```

- [ ] **Step 3: Add env vars to .env.example**

```
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
```

- [ ] **Step 4: Commit**

```bash
git add src/app/api/auth/bar/[barId]/subscription/route.ts src/app/api/stripe/webhook/route.ts .env.example
git commit -m "feat: add subscription API and Stripe webhook endpoints"
```

### Task 3.5: Plan Gating in Creation Flow

**Files:**
- Modify: `src/app/api/auth/bar/[barId]/create/submit/route.ts`
- Modify: `src/components/bar/create/CreateHubClient.tsx`

- [ ] **Step 1: Enforce post limits at the API level**

```typescript
// In the creation API, before creating content:
import { checkPostLimit, incrementPostCount } from "@/lib/plan-gate";

const { allowed, used, max } = await checkPostLimit(params.barId);
if (!allowed) {
  return NextResponse.json(
    { error: `Post limit reached (${used}/${max}). Upgrade to post more.` },
    { status: 402 } // Payment Required
  );
}

// After successful creation:
await incrementPostCount(params.barId);
```

- [ ] **Step 2: Show plan status on create button**

```typescript
// In CreateHubClient.tsx, add a plan indicator before the submit button:
import { formatPlanName } from "@/lib/plan-gate";

const [postLimit, setPostLimit] = useState<{ used: number; max: number } | null>(null);

useEffect(() => {
  fetch(`/api/auth/bar/${barId}/subscription`)
    .then(r => r.json())
    .then(d => setPostLimit({ used: d.postsUsed, max: d.postsMax }));
}, [barId]);

// Before submit button:
{postLimit && postLimit.max !== Infinity && (
  <PlanStatus>
    {postLimit.used}/{postLimit.max} posts this month ·{" "}
    <UpgradeLink>Upgrade</UpgradeLink>
  </PlanStatus>
)}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/auth/bar/[barId]/create/submit/route.ts src/components/bar/create/CreateHubClient.tsx
git commit -m "feat: enforce plan limits in creation flow"
```

---

## Milestone 4: Proactive Insights Chatbot

### Task 4.1: Prisma Schema — Insights Models

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add insight models and enums**

```prisma
// Add to enums:
enum InsightType {
  GAP_DETECTION
  MILESTONE
  WEEKLY_SUMMARY
  INACTIVITY
  PATTERN
}

enum SenderType {
  ASSISTANT
  USER
}

enum InsightChannel {
  PUSH
  HOME_CARD
  CHAT
}

// Add to NotificationType enum:
// ... existing types ...
  INSIGHT

// Add to models section:
model BarInsight {
  id           String      @id @default(cuid())
  barId        String
  type         InsightType
  title        String
  body         String
  actionLabel  String?
  actionRoute  String?
  dismissed    Boolean     @default(false)
  actedUpon    Boolean     @default(false)
  createdAt    DateTime    @default(now())

  bar      Bar              @relation(fields: [barId], references: [id], onDelete: Cascade)
  messages InsightMessage[]

  @@index([barId, createdAt])
}

model InsightMessage {
  id           String       @id @default(cuid())
  barId        String
  insightId    String?
  senderType   SenderType
  content      String
  actionTaken  String?
  createdAt    DateTime     @default(now())

  bar     Bar         @relation(fields: [barId], references: [id], onDelete: Cascade)
  insight BarInsight? @relation(fields: [insightId], references: [id], onDelete: SetNull)

  @@index([barId, createdAt])
}

model InsightPreference {
  id              String          @id @default(cuid())
  barId           String
  channel         InsightChannel
  type            InsightType?
  enabled         Boolean         @default(true)

  @@unique([barId, channel, type])
}
```

- [ ] **Step 2: Run migration**

```bash
npx prisma migrate dev --name add_insights_models
```

- [ ] **Step 3: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: add BarInsight, InsightMessage, InsightPreference models"
```

### Task 4.2: Trigger Engine

**Files:**
- Create: `src/lib/insights/triggers.ts`
- Create: `src/lib/insights/aggregator.ts`

- [ ] **Step 1: Create the trigger functions**

```typescript
// src/lib/insights/triggers.ts
import { prisma } from "@/lib/prisma";
import { InsightType } from "@prisma/client";

interface InsightPayload {
  type: InsightType;
  title: string;
  body: string;
  actionLabel?: string;
  actionRoute?: string;
}

// Rule 1: Gap Detection — upcoming weekend has no events
export async function checkGapDetection(
  barId: string
): Promise<InsightPayload | null> {
  const now = new Date();
  const threeDaysOut = new Date(now.getTime() + 72 * 60 * 60 * 1000);

  const upcomingEvents = await prisma.event.count({
    where: {
      venueId: barId,
      startTime: { gte: now, lte: threeDaysOut },
      complianceStatus: "COMPLIANT",
    },
  });

  if (upcomingEvents > 0) return null;

  // Check which day is the gap (Friday or Saturday = high value)
  const dayOfWeek = now.getDay();
  if (dayOfWeek >= 3) {
    // Wednesday or later — warn about upcoming weekend
    const targetDay = dayOfWeek === 3 ? "Friday" : "this weekend";

    // Calculate bar's historical Friday avg
    const pastFridayEvents = await prisma.event.count({
      where: {
        venueId: barId,
        startTime: {
          gte: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
          lt: now,
        },
        complianceStatus: "COMPLIANT",
      },
    });

    const avgViews = await getBarAverageViews(barId, "EVENT_VIEW");

    return {
      type: "GAP_DETECTION",
      title: `${targetDay} is open`,
      body:
        pastFridayEvents > 0
          ? `Your ${targetDay.toLowerCase()} posts usually get ${avgViews > 0 ? Math.round(avgViews) + " views" : "good engagement"}. Want to set something up?`
          : `${targetDay} is a big night out. Want to set up your first ${targetDay.toLowerCase()} event?`,
      actionLabel: `Set up ${targetDay}`,
      actionRoute: `/bar/${barId}/create?day=${targetDay.toLowerCase()}`,
    };
  }

  return null;
}

// Rule 2: Post Milestone — a post exceeded the bar's average
export async function checkMilestone(
  barId: string,
  postId: string,
  postType: string
): Promise<InsightPayload | null> {
  const eventType =
    postType === "event" ? "EVENT_VIEW" : postType === "promotion" ? "PROMO_VIEW" : "PASS_VIEW";

  const postViews = await prisma.analyticsEvent.count({
    where: {
      barId,
      type: eventType as any,
      createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    },
  });

  const barAvg = await getBarAverageViews(barId, eventType);

  if (barAvg > 0 && postViews > barAvg * 1.5) {
    // 50% above average
    const post = await getPostTitle(postId, postType);
    return {
      type: "MILESTONE",
      title: "Post milestone!",
      body: `${post || "Your post"} got ${postViews} views — that's ${Math.round((postViews / barAvg - 1) * 100)}% above your average.`,
    };
  }

  return null;
}

// Rule 4: Inactivity — no posts in 7+ days
export async function checkInactivity(
  barId: string
): Promise<InsightPayload | null> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [lastEvent, lastPromo, lastPass] = await Promise.all([
    prisma.event.findFirst({
      where: { venueId: barId, createdAt: { gte: sevenDaysAgo } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.barPromotion.findFirst({
      where: { barId, createdAt: { gte: sevenDaysAgo } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.vIPPassEnhanced.findFirst({
      where: { barId, createdAt: { gte: sevenDaysAgo } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  if (lastEvent || lastPromo || lastPass) return null;

  return {
    type: "INACTIVITY",
    title: "You've been quiet",
    body: "You haven't posted in 8 days. Bars that post weekly get 4x more followers.",
    actionLabel: "Create a post",
    actionRoute: `/bar/${barId}/create`,
  };
}

// Rule 5: Pattern Detection
export async function checkPatterns(
  barId: string
): Promise<InsightPayload | null> {
  // Compare photo vs no-photo engagement
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const eventsWithPhotos = await prisma.event.count({
    where: {
      venueId: barId,
      startTime: { gte: thirtyDaysAgo },
      imageUrl: { not: null },
      complianceStatus: "COMPLIANT",
    },
  });

  const eventsWithoutPhotos = await prisma.event.count({
    where: {
      venueId: barId,
      startTime: { gte: thirtyDaysAgo },
      imageUrl: null,
      complianceStatus: "COMPLIANT",
    },
  });

  if (eventsWithPhotos === 0 && eventsWithoutPhotos === 0) return null;

  // Simple heuristic: photos boost engagement
  if (eventsWithoutPhotos >= 3 && eventsWithPhotos <= 1) {
    return {
      type: "PATTERN",
      title: "Photos boost engagement",
      body: "Posts with photos get 2-3x more views. Your last 3 posts didn't have one — try adding a photo next time.",
    };
  }

  return null;
}

// Helper: get bar's average views for an event type
async function getBarAverageViews(
  barId: string,
  eventType: string
): Promise<number> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const result = await prisma.analyticsEvent.groupBy({
    by: ["barId"],
    where: {
      barId,
      type: eventType as any,
      createdAt: { gte: thirtyDaysAgo },
    },
    _count: { id: true },
  });

  return result.length > 0 ? result[0]._count.id / 30 : 0; // daily average
}

// Helper: get post title by type
async function getPostTitle(
  postId: string,
  type: string
): Promise<string | null> {
  if (type === "event") {
    const e = await prisma.event.findUnique({ where: { id: postId } });
    return e?.title || null;
  }
  if (type === "promotion") {
    const p = await prisma.barPromotion.findUnique({ where: { id: postId } });
    return p?.title || null;
  }
  return null;
}
```

- [ ] **Step 2: Create the weekly aggregator**

```typescript
// src/lib/insights/aggregator.ts
import { prisma } from "@/lib/prisma";

interface WeeklySummary {
  totalViews: number;
  totalClicks: number;
  bestDay: string;
  bestDayCount: number;
  topPost: { title: string; type: string; views: number } | null;
  comparisonToLastWeek: { viewsChange: number; percentChange: number };
}

export async function computeWeeklySummary(
  barId: string
): Promise<WeeklySummary> {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  // This week
  const thisWeek = await prisma.analyticsEvent.groupBy({
    by: ["type"],
    where: {
      barId,
      createdAt: { gte: weekAgo, lte: now },
    },
    _count: { id: true },
  });

  // Last week
  const lastWeek = await prisma.analyticsEvent.groupBy({
    by: ["type"],
    where: {
      barId,
      createdAt: { gte: twoWeeksAgo, lt: weekAgo },
    },
    _count: { id: true },
  });

  const totalViews = thisWeek.reduce((s, r) => s + r._count.id, 0);
  const lastWeekTotal = lastWeek.reduce((s, r) => s + r._count.id, 0);
  const viewsChange = totalViews - lastWeekTotal;
  const percentChange =
    lastWeekTotal > 0 ? Math.round((viewsChange / lastWeekTotal) * 100) : 0;

  // Best day — aggregate by date
  const byDate = await prisma.$queryRaw<{ date: string; count: bigint }[]>`
    SELECT DATE("createdAt") as date, COUNT(*) as count
    FROM "analytics_events"
    WHERE "barId" = ${barId}
      AND "createdAt" >= ${weekAgo}
      AND "createdAt" <= ${now}
    GROUP BY DATE("createdAt")
    ORDER BY count DESC
    LIMIT 1
  `;

  const bestDay =
    byDate.length > 0
      ? new Date(byDate[0].date).toLocaleDateString("en-US", {
          weekday: "long",
        })
      : "N/A";
  const bestDayCount = byDate.length > 0 ? Number(byDate[0].count) : 0;

  return {
    totalViews,
    totalClicks: 0, // computed from PROMO_CLICK + EVENT_JOIN counts if needed
    bestDay,
    bestDayCount,
    topPost: null, // can be expanded to query specific post performance
    comparisonToLastWeek: { viewsChange, percentChange },
  };
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/insights/triggers.ts src/lib/insights/aggregator.ts
git commit -m "feat: add insights trigger engine and weekly aggregator"
```

### Task 4.3: Cron Job Handler

**Files:**
- Create: `src/app/api/cron/insights/route.ts`

- [ ] **Step 1: Create the cron endpoint**

```typescript
// src/app/api/cron/insights/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  checkGapDetection,
  checkInactivity,
  checkPatterns,
} from "@/lib/insights/triggers";
import { computeWeeklySummary } from "@/lib/insights/aggregator";

// Called by Vercel Cron every 3 hours
// vercel.json: { "crons": [{ "path": "/api/cron/insights", "schedule": "0 */3 * * *" }] }
export async function POST(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const bars = await prisma.bar.findMany({
    where: { status: { in: ["CLAIMED", "VERIFIED"] } },
    select: { id: true },
  });

  let insightsCreated = 0;

  for (const bar of bars) {
    const checks = await Promise.all([
      checkGapDetection(bar.id),
      checkInactivity(bar.id),
      checkPatterns(bar.id),
    ]);

    for (const insight of checks) {
      if (!insight) continue;

      // Don't create duplicate insights of same type in 24h
      const existing = await prisma.barInsight.findFirst({
        where: {
          barId: bar.id,
          type: insight.type,
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
          dismissed: false,
        },
      });

      if (existing) continue;

      await prisma.barInsight.create({
        data: {
          barId: bar.id,
          type: insight.type,
          title: insight.title,
          body: insight.body,
          actionLabel: insight.actionLabel,
          actionRoute: insight.actionRoute,
        },
      });

      // Create notification for bar staff
      const staff = await prisma.barStaff.findMany({
        where: {
          barId: bar.id,
          role: { in: ["OWNER", "MANAGER"] },
        },
        select: { userId: true },
      });

      for (const s of staff) {
        if (s.userId) {
          await prisma.notification.create({
            data: {
              userId: s.userId,
              type: "INSIGHT",
              title: insight.title,
              body: insight.body,
              data: {
                barId: bar.id,
                insightType: insight.type,
                actionRoute: insight.actionRoute,
              },
            },
          });
        }
      }

      insightsCreated++;
    }
  }

  // Monday 9am: generate weekly summaries
  const now = new Date();
  if (now.getDay() === 1 && now.getHours() >= 9 && now.getHours() < 12) {
    for (const bar of bars) {
      const summary = await computeWeeklySummary(bar.id);

      if (summary.totalViews === 0) continue;

      const comparison =
        summary.comparisonToLastWeek.percentChange > 0
          ? `up ${summary.comparisonToLastWeek.percentChange}%`
          : summary.comparisonToLastWeek.percentChange < 0
            ? `down ${Math.abs(summary.comparisonToLastWeek.percentChange)}%`
            : "about the same";

      const body = `${summary.totalViews} views · ${summary.totalClicks} clicks · Best day: ${summary.bestDay}. ${comparison} from last week.`;

      await prisma.barInsight.create({
        data: {
          barId: bar.id,
          type: "WEEKLY_SUMMARY",
          title: "Your week in review",
          body,
        },
      });
    }
  }

  return NextResponse.json({ barsChecked: bars.length, insightsCreated });
}
```

- [ ] **Step 2: Add CRON_SECRET to .env.example**

```
CRON_SECRET=  # random string for securing cron endpoints
```

- [ ] **Step 3: Add cron config to vercel.json**

```json
{
  "crons": [
    {
      "path": "/api/cron/insights",
      "schedule": "0 */3 * * *"
    }
  ]
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/api/cron/insights/route.ts vercel.json .env.example
git commit -m "feat: add cron job handler for insight generation"
```

### Task 4.4: Insights API Endpoints

**Files:**
- Create: `src/app/api/auth/bar/[barId]/insights/route.ts`
- Create: `src/app/api/auth/bar/[barId]/insights/chat/route.ts`

- [ ] **Step 1: Create insights API**

```typescript
// src/app/api/auth/bar/[barId]/insights/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateBarStaff } from "@/services/auth-service";
import { checkFeature } from "@/lib/plan-gate";

export async function GET(
  req: NextRequest,
  { params }: { params: { barId: string } }
) {
  const auth = await authenticateBarStaff(params.barId);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check plan gate — insights chatbot is Super Bar only
  const hasAccess = await checkFeature(params.barId, "insightsChatbot");
  if (!hasAccess) {
    return NextResponse.json({
      planGated: true,
      message: "Upgrade to Super Bar for AI-powered insights.",
    });
  }

  const insights = await prisma.barInsight.findMany({
    where: {
      barId: params.barId,
      dismissed: false,
      createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  const latest = insights[0] || null;

  return NextResponse.json({ latest, recent: insights });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { barId: string } }
) {
  const auth = await authenticateBarStaff(params.barId);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { insightId, action } = await req.json();

  if (action === "dismiss") {
    await prisma.barInsight.update({
      where: { id: insightId },
      data: { dismissed: true },
    });
  } else if (action === "act") {
    await prisma.barInsight.update({
      where: { id: insightId },
      data: { actedUpon: true },
    });
  }

  return NextResponse.json({ success: true });
}
```

- [ ] **Step 2: Create chat API**

```typescript
// src/app/api/auth/bar/[barId]/insights/chat/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateBarStaff } from "@/services/auth-service";
import { checkFeature } from "@/lib/plan-gate";

export async function GET(
  req: NextRequest,
  { params }: { params: { barId: string } }
) {
  const auth = await authenticateBarStaff(params.barId);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const messages = await prisma.insightMessage.findMany({
    where: { barId: params.barId },
    orderBy: { createdAt: "asc" },
    take: 50,
  });

  return NextResponse.json({ messages });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { barId: string } }
) {
  const auth = await authenticateBarStaff(params.barId);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const hasAccess = await checkFeature(params.barId, "insightsChatbot");
  if (!hasAccess) {
    return NextResponse.json({ error: "Upgrade required" }, { status: 402 });
  }

  const { content, insightId } = await req.json();

  // Store user message
  await prisma.insightMessage.create({
    data: {
      barId: params.barId,
      insightId,
      senderType: "USER",
      content,
    },
  });

  // Generate assistant response
  // Phase 1: simple pattern-matched responses
  let response = "I can help you set up events, check your performance, or suggest ideas. What would you like to do?";

  if (content.toLowerCase().includes("what worked") || content.toLowerCase().includes("best")) {
    const recentHighPerformer = await prisma.barInsight.findFirst({
      where: { barId: params.barId, type: "MILESTONE" },
      orderBy: { createdAt: "desc" },
    });
    if (recentHighPerformer) {
      response = recentHighPerformer.body;
    }
  }

  if (content.toLowerCase().includes("set up") || content.toLowerCase().includes("create")) {
    response = `Sure! Head to the create page and I'll help you fill it out: /bar/${params.barId}/create`;
  }

  // Store assistant response
  const msg = await prisma.insightMessage.create({
    data: {
      barId: params.barId,
      insightId,
      senderType: "ASSISTANT",
      content: response,
    },
  });

  return NextResponse.json({ message: msg }, { status: 201 });
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/auth/bar/[barId]/insights/route.ts src/app/api/auth/bar/[barId]/insights/chat/route.ts
git commit -m "feat: add insights and chat API endpoints"
```

### Task 4.5: Insight Card + Chat Panel Components

**Files:**
- Create: `src/components/bar/dashboard/InsightCard.tsx`
- Create: `src/components/bar/dashboard/ChatPanel.tsx`

- [ ] **Step 1: Create InsightCard component**

```typescript
// src/components/bar/dashboard/InsightCard.tsx
"use client";

import { useState } from "react";
import styled from "styled-components";

interface Insight {
  id: string;
  type: string;
  title: string;
  body: string;
  actionLabel?: string | null;
  actionRoute?: string | null;
  createdAt: string;
}

interface Props {
  insight: Insight | null;
  planGated: boolean;
  onDismiss: (id: string) => void;
  onAct: (id: string, route?: string) => void;
  onExpand: () => void;
}

const Card = styled.div`
  background: linear-gradient(135deg, #1a1a2e, #1e1030);
  border-radius: 12px;
  padding: 14px;
  border: 1px solid #7c3aed33;
  margin-bottom: 16px;
`;

const Title = styled.p`
  margin: 0;
  font-size: 11px;
  color: #a78bfa;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const Body = styled.p`
  margin: 6px 0 0;
  font-size: 13px;
  color: #e0e0e0;
  line-height: 1.5;
`;

const Actions = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 10px;
`;

const PrimaryButton = styled.button`
  font-size: 11px;
  padding: 8px 14px;
  background: #7c3aed;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
`;

const SecondaryButton = styled.button`
  font-size: 11px;
  padding: 8px 14px;
  background: transparent;
  color: #888;
  border: 1px solid #333;
  border-radius: 6px;
  cursor: pointer;
`;

const PlanGateCard = styled(Card)`
  border-color: #f9731633;
  background: linear-gradient(135deg, #1a1a2e, #1e1a10);
`;

export function InsightCard({
  insight,
  planGated,
  onDismiss,
  onAct,
  onExpand,
}: Props) {
  if (planGated) {
    return (
      <PlanGateCard>
        <Title>Hoppr Insights</Title>
        <Body>
          Upgrade to Super Bar to get AI-powered insights, strategy suggestions,
          and a personal marketing assistant for your bar.
        </Body>
        <Actions>
          <PrimaryButton
            onClick={() =>
              onAct("", `/bar/settings?tab=pricing`)
            }
          >
            See plans →
          </PrimaryButton>
        </Actions>
      </PlanGateCard>
    );
  }

  if (!insight) {
    return (
      <Card>
        <Title>All caught up</Title>
        <Body>
          No new insights right now. We'll let you know when there's something
          to check.
        </Body>
      </Card>
    );
  }

  return (
    <Card>
      <Title>Hoppr Insight</Title>
      <Body>{insight.body}</Body>
      <Actions>
        {insight.actionLabel && (
          <PrimaryButton
            onClick={() => onAct(insight.id, insight.actionRoute || undefined)}
          >
            {insight.actionLabel} →
          </PrimaryButton>
        )}
        <SecondaryButton onClick={() => onDismiss(insight.id)}>
          Dismiss
        </SecondaryButton>
        <SecondaryButton onClick={onExpand}>Chat</SecondaryButton>
      </Actions>
    </Card>
  );
}
```

- [ ] **Step 2: Create ChatPanel component**

```typescript
// src/components/bar/dashboard/ChatPanel.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import styled from "styled-components";

interface Message {
  id: string;
  senderType: "ASSISTANT" | "USER";
  content: string;
  createdAt: string;
}

interface Props {
  barId: string;
  isOpen: boolean;
  onClose: () => void;
}

const Panel = styled.div<{ $open: boolean }>`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: ${(p) => (p.$open ? "60vh" : "0")};
  background: #0a0a0a;
  border-top: 1px solid #1a1a2e;
  border-radius: 16px 16px 0 0;
  transition: height 0.3s ease;
  overflow: hidden;
  z-index: 100;
  display: flex;
  flex-direction: column;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #1a1a2e;
`;

const Messages = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const Bubble = styled.div<{ $isUser: boolean }>`
  max-width: 85%;
  padding: 10px 14px;
  border-radius: ${(p) =>
    p.$isUser ? "14px 4px 14px 14px" : "4px 14px 14px 14px"};
  background: ${(p) => (p.$isUser ? "#7c3aed" : "#1a1a2e")};
  color: ${(p) => (p.$isUser ? "#fff" : "#e0e0e0")};
  align-self: ${(p) => (p.$isUser ? "flex-end" : "flex-start")};
  font-size: 12px;
  line-height: 1.4;
`;

const InputBar = styled.form`
  display: flex;
  gap: 8px;
  padding: 10px 16px;
  border-top: 1px solid #1a1a2e;
`;

const TextInput = styled.input`
  flex: 1;
  background: #1a1a2e;
  border: 1px solid #333;
  border-radius: 8px;
  padding: 10px 12px;
  color: #fff;
  font-size: 13px;
  outline: none;
  &:focus {
    border-color: #7c3aed;
  }
`;

const SendButton = styled.button`
  padding: 10px 16px;
  background: #7c3aed;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  &:disabled {
    opacity: 0.4;
  }
`;

export function ChatPanel({ barId, isOpen, onClose }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      fetch(`/api/auth/bar/${barId}/insights/chat`)
        .then((r) => r.json())
        .then((d) => setMessages(d.messages || []));
    }
  }, [isOpen, barId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    if (!input.trim()) return;
    const content = input.trim();
    setInput("");
    setLoading(true);

    // Optimistic user message
    setMessages((prev) => [
      ...prev,
      {
        id: `temp-${Date.now()}`,
        senderType: "USER",
        content,
        createdAt: new Date().toISOString(),
      },
    ]);

    const res = await fetch(`/api/auth/bar/${barId}/insights/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });

    const data = await res.json();
    setMessages((prev) => [...prev, data.message]);
    setLoading(false);
  };

  return (
    <Panel $open={isOpen}>
      <Header>
        <span
          style={{ fontSize: 14, fontWeight: 700, color: "#e0e0e0" }}
        >
          Hoppr Assistant
        </span>
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            color: "#888",
            fontSize: 20,
            cursor: "pointer",
          }}
        >
          ×
        </button>
      </Header>
      <Messages>
        {messages.map((m) => (
          <Bubble key={m.id} $isUser={m.senderType === "USER"}>
            {m.content}
          </Bubble>
        ))}
        <div ref={bottomRef} />
      </Messages>
      <InputBar onSubmit={(e) => { e.preventDefault(); send(); }}>
        <TextInput
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about your bar's performance..."
          disabled={loading}
        />
        <SendButton type="submit" disabled={!input.trim() || loading}>
          Send
        </SendButton>
      </InputBar>
    </Panel>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/bar/dashboard/InsightCard.tsx src/components/bar/dashboard/ChatPanel.tsx
git commit -m "feat: add InsightCard and ChatPanel components"
```

### Task 4.6: Integrate Into Bar Dashboard

**Files:**
- Modify: `src/components/bar/dashboard/BarDashboard.tsx`
- Modify: `src/app/bar/[id]/dashboard/page.tsx`

- [ ] **Step 1: Add InsightCard and ChatPanel to dashboard**

```typescript
// In BarDashboard.tsx, add below the stats row:

import { InsightCard } from "./InsightCard";
import { ChatPanel } from "./ChatPanel";
import { useRouter } from "next/navigation";

const [latestInsight, setLatestInsight] = useState<any>(null);
const [planGated, setPlanGated] = useState(false);
const [chatOpen, setChatOpen] = useState(false);
const router = useRouter();

useEffect(() => {
  fetch(`/api/auth/bar/${barId}/insights`)
    .then((r) => r.json())
    .then((d) => {
      setPlanGated(d.planGated || false);
      setLatestInsight(d.latest);
    });
}, [barId]);

const handleDismiss = async (insightId: string) => {
  await fetch(`/api/auth/bar/${barId}/insights`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ insightId, action: "dismiss" }),
  });
  setLatestInsight(null); // refresh
};

const handleAct = async (insightId: string, route?: string) => {
  if (insightId) {
    await fetch(`/api/auth/bar/${barId}/insights`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ insightId, action: "act" }),
    });
  }
  if (route) {
    router.push(route);
  }
};

// After the stats grid, before recent posts:
<InsightCard
  insight={latestInsight}
  planGated={planGated}
  onDismiss={handleDismiss}
  onAct={handleAct}
  onExpand={() => setChatOpen(true)}
/>

<ChatPanel
  barId={barId}
  isOpen={chatOpen}
  onClose={() => setChatOpen(false)}
/>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/bar/dashboard/BarDashboard.tsx src/app/bar/[id]/dashboard/page.tsx
git commit -m "feat: integrate InsightCard and ChatPanel into bar dashboard"
```

---

## Verification Checklist

After all milestones are complete, verify:

- [ ] Stock photo picker appears in creation flow when no image uploaded
- [ ] AI classifies "DJ night Friday, free entry" as event + promotion combo
- [ ] Free plan bars are blocked after 2 posts/month
- [ ] Stripe checkout redirects to correct plan upgrade
- [ ] Cron job creates gap detection insight when Friday is empty
- [ ] Insight card shows on bar dashboard with action button
- [ ] Chat panel opens, accepts messages, returns responses
- [ ] Push notifications fire for milestone and inactivity triggers
- [ ] Weekly summary appears on Monday mornings
- [ ] Plan-gated features show upgrade prompt for lower-tier bars
