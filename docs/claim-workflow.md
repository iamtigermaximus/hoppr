# Venue Claim Workflow — End-to-End Scenario

This document walks through a realistic scenario showing how a venue owner claims their bar on Hoppr and how an admin reviews and approves (or rejects) that claim.

---

## Scenario: "Helsinki Brew House" gets claimed

**Actors:**
- **Mikko** — owns Helsinki Brew House, a craft beer bar in Kallio that's listed on Hoppr but hasn't been claimed yet
- **Ada** — hoppr super admin, reviewing claims in the admin dashboard

---

## Phase 1 — Consumer discovers an unclaimed venue

### Step 1: Mikko opens the venue page

Mikko searches Hoppr and finds his bar. The detail page shows:

- Bar name: **Helsinki Brew House**
- Type badge: **Brewery Taproom**
- **Placeholder hours** are displayed (e.g., "Monday 16:00–02:00") because the bar is not verified yet
- An amber warning banner above the hours:
  > ⚠ This venue hasn't been claimed or verified yet, so opening hours are an estimate and may not be accurate.

- Below the contact/location section, a purple "Own this venue?" card appears with a **"Claim this venue"** button.

### Step 2: Mikko clicks "Claim this venue"

A modal slides in with the title: **"Request to claim Helsinki Brew House"**

Subtitle:
> Leave your details and a hoppr admin will reach out to verify your ownership and help you get set up.

Mikko fills out the form:

| Field | Value |
|---|---|
| Your full name | Mikko Virtanen |
| Contact email | mikko@helsinkibrew.fi |
| Your role | Owner |
| Phone number | +358 40 123 4567 |
| Notes (optional) | I'm the registered owner, happy to provide any docs |

### Step 3: Mikko attaches verification documents

Beneath the notes field, a guidance box explains what to upload:

> **Verification documents (optional but recommended)**
> Uploading proof of ownership or affiliation helps us verify your claim faster. Accepted documents include:
> • Business license or registration certificate
> • Government-issued photo ID
> • Utility bill or lease agreement for the venue
> • Any other document linking you to this business

Below that, a dashed drop zone says:
> 📎 Click to attach documents
> JPEG, PNG, PDF · max 10MB each

Mikko clicks it and selects three files from his computer:
- `business-license.pdf`
- `mikko-id.png`
- `lease-agreement.pdf`

The files appear as purple chips below the drop zone:
> **[business-license.pdf ×] [mikko-id.png ×] [lease-agreement.pdf ×]**

He can remove any file by clicking the ×, or click the drop zone again to add more.

### Step 4: Mikko submits

The button reads **"Submit request"**. He clicks it.

**What happens under the hood:**

1. The three files are uploaded in parallel to `/api/upload` (using `Promise.allSettled`)
2. The button text changes to **"Uploading documents..."** while uploads run
3. Each upload returns a URL (e.g., `https://res.cloudinary.com/hoppr/hoppr/business-license.pdf`)
4. Once all uploads succeed, the button changes to **"Submitting..."**
5. A POST hits `/api/venues/helsinki-brew-house-id/claim` with:

```json
{
  "name": "Mikko Virtanen",
  "email": "mikko@helsinkibrew.fi",
  "role": "Owner",
  "phone": "+358 40 123 4567",
  "notes": "I'm the registered owner, happy to provide any docs",
  "documentUrls": [
    "https://res.cloudinary.com/hoppr/hoppr/business-license.pdf",
    "https://res.cloudinary.com/hoppr/hoppr/mikko-id.png",
    "https://res.cloudinary.com/hoppr/hoppr/lease-agreement.pdf"
  ]
}
```

The API stores the claim in the database:

```sql
INSERT INTO bar_claims (barId, userId, notes, documentUrls, status, ...)
VALUES (
  'helsinki-brew-house-id',
  'mikko-user-id',
  'Contact name: Mikko Virtanen\nEmail: mikko@helsinkibrew.fi\nRole: Owner\nPhone: +358 40 123 4567\nNotes: I''m the registered owner, happy to provide any docs',
  ARRAY['https://res.cloudinary.com/...', ...],
  'CLAIMED'
);
```

**Note on structured notes:** The API builds a parseable format — each field is stored as a labelled line so the admin UI can extract and display them cleanly. If Mikko's account email differs from his typed email, both are stored (the typed one as primary, the account one noted separately).

Mikko sees a success screen:
> ✓ Claim request submitted. A hoppr admin will reach out to verify your ownership.

He can close the modal. The claim button now won't re-appear because a "CLAIMED" record exists for his user ID on this venue (the API returns a friendly "already pending" message if he tries again).

---

## Phase 2 — Admin reviews the claim

### Step 5: Ada opens the admin panel

Ada is a SUPER_ADMIN at Hoppr. She opens the admin dashboard at `/admin`. The top navigation bar shows:

```
Hoppr Admin | Dashboard | Claims [🔴 1] | Outreach | Health | Admins | Bars | Analytics | Revenue
```

The **Claims** nav item has a red notification badge showing "1" — this comes from a 30-second polling loop hitting `/api/auth/admin/claims?status=CLAIMED&limit=1` and reading `pagination.total`.

### Step 6: Ada navigates to Claims

She clicks "Claims" and sees the pending tab active by default. A table shows all CLAIMED claims:

| Bar | Type | City | Claimed By | Date | Notes | Documents | Actions |
|---|---|---|---|---|---|---|---|
| Helsinki Brew House | BREWERY_TAPROOM | Helsinki | **mikko@helsinkibrew.fi** *+358 40 123 4567* | 2026-06-29 | Contact name: Mikko Virtanen Email: mikko@helsinkibrew.fi Role: Owner Phone: +358 40 123 4567 Notes: I'm the registered owner... | **Doc 1** **Doc 2** **Doc 3** | 📄 Docs ✓ Approve ✕ Reject |

What Ada sees in each column:

- **Bar** — venue name, cover image thumbnail, district
- **Claimed By** — user's name, email, and phone number (pulled from the `user` relation + `phoneNumber` field)
- **Notes** — the structured contact fields parsed by `parseContactNotes()`, showing name, email, role, and phone as labelled lines. If more than 4 fields, a "+N more" label appears.
- **Documents** — clickable doc links (Doc 1, Doc 2, Doc 3) that open the uploaded files in new tabs. A "📄 Docs" button also opens all documents at once.
- **Actions** — three buttons: open all docs, approve, or reject

### Step 7: Ada reviews the documents

She clicks **Doc 1** and a new tab opens to Cloudinary showing Mikko's business license PDF. She checks the business name matches "Helsinki Brew House". She opens Doc 2 (photo ID) and Doc 3 (lease agreement) — everything checks out.

### Step 8: Ada approves the claim

She clicks **✓ Approve**. A confirmation modal appears:

> Approve claim from Mikko Virtanen for Helsinki Brew House?
> This will verify the bar and grant Mikko management access.

She confirms. The API at `PATCH /api/auth/admin/claims/{id}` runs a Prisma transaction that does three things atomically:

1. **Updates the claim record:**
   - `status` → `VERIFIED`
   - `reviewedById` → Ada's admin user ID
   - `reviewedAt` → now

2. **Updates the bar record:**
   - `status` → `VERIFIED`
   - `isVerified` → `true`
   - `claimedAt` → now
   - `claimedById` → Mikko's user ID

3. **Creates an audit log entry:**
   - Action: `APPROVE_CLAIM`
   - Details include the claimId, bar name, and status transition

The claim moves from the "Pending" tab to the "Verified" tab. The notification badge on the Claims nav item drops to 0 (or updates on the next 30s poll).

---

## Phase 3 — What changes after verification

### For the consumer (Mikko)

- The venue now shows a **VERIFIED** badge next to the name on the detail page
- The amber hours warning disappears
- The "Claim this venue" card is gone
- Promotions, events, and menu sections are now visible
- Mikko can now manage his bar through the Hoppr Business dashboard

### For end users browsing the venue

- The bar now has a ⭐ VERIFIED badge, signalling trustworthy information
- The hours warning is gone — hours are considered accurate
- Events, promos, and menus are displayed if the owner has added them

### If Ada had rejected instead

- The claim moves to the "Rejected" tab
- The bar remains unverified and unclaimed
- Mikko's documentUrls and contact notes remain stored in the claim record for audit
- A future claim from a different (or same) user can be submitted for the same venue

---

## Flow diagram

```
CONSUMER APP                           BACKEND                        ADMIN APP
───────────                           ───────                        ──────────

Browse venues
    │
    ▼
Venue detail page
(placeholder hours + warning)
    │
    ▼
Click "Claim this venue"
    │
    ▼
Fill claim form:
  • name, email, role, phone
  • notes
  • attach documents ──────────► POST /api/upload ──────► Cloudinary
    (JPEG/PNG/PDF)                   returns URLs
    │                                   │
    ▼                                   ▼
Click "Submit request" ────────► POST /api/venues/:id/claim
                                { documentUrls, ... }
                                     │
                                     ▼
                                INSERT bar_claims
                                (status: CLAIMED)           ──► AdminNavbar polls
                                     │                         GET /api/auth/admin/claims
                                     │                         reads pagination.total
                                     │                              │
                                     │                              ▼
                                     │                         [🔴 badge appears]
                                     │                              │
                                     ▼                              ▼
                                Success response             Admin opens Claims page
                                to consumer                       │
                                                              ▼
                                                         Claims table shows:
                                                           • contact details
                                                           • document links
                                                           • Approve / Reject
                                                              │
                                                              ▼
                                                         Admin approves ───► PATCH /api/auth/admin/claims/:id
                                                              │              (status: VERIFIED)
                                                              │                   │
                                                              │                   ▼
                                                              │              TRANSACTION:
                                                              │                ✓ claim → VERIFIED
                                                              │                ✓ bar → VERIFIED
                                                              │                ✓ audit log
                                                              │
                                                              ▼
                                                         Venue now verified
                                                         Owner gets access
```

---

## Key design decisions

**Structured notes instead of separate DB columns.** Contact details (name, email, role, phone) from the claim form are stored in a single `notes` text field as labelled lines. The admin UI's `parseContactNotes()` helper splits them back out for clean display. This avoids a Prisma migration for four new columns while keeping the data readable for both machines and humans.

**File upload before claim submission.** Documents are uploaded first and their URLs are included in the claim POST body. This means if the claim API call itself fails, the files are already in Cloudinary (orphaned, but harmless). The alternative — uploading after claim creation — would require a two-phase flow that's harder to make atomic.

**30-second polling for the badge.** The notification badge on the Claims nav item polls every 30 seconds rather than using WebSockets. This keeps the implementation simple and avoids infrastructure overhead. The badge count reads from `pagination.total` by querying with `limit=1` (only page 1 with 1 item — just to get the count).

**Placeholder hours for unclaimed venues.** Bars without verified hours data show estimated opening hours (4pm–2am weekdays, 4pm–4am weekends) with a warning banner. Once a bar is claimed and the owner updates the hours in the admin dashboard, the real hours replace the placeholders.
