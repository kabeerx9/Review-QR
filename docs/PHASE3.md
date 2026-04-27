# Phase 3 — Owner Dashboard

Goal: Owner logs in and sees their metrics, negative reviews, and can download their QR code.

Prereq: Phase 2 complete. Owner has a shop.

---

## Step 1 — Install Dependencies

```bash
npm install recharts
npm install date-fns
npx shadcn@latest add tabs separator skeleton
```

---

## Step 2 — Dashboard API `app/api/dashboard/metrics/route.ts` — GET

Requires auth.

Returns:
```typescript
{
  shop: {
    id: string
    name: string
    city: string
    niche: string
    slug: string
    qrCodeUrl: string
    isActive: boolean
    googleReviewUrl: string
  }
  metrics: {
    totalReviewsThisMonth: number
    publicReviewsThisMonth: number      // sent to Google
    privateReviewsThisMonth: number     // intercepted
    averageRatingThisMonth: number      // avg of all reviews
    ratingTrend: Array<{ date: string, avg: number, count: number }>  // last 30 days, grouped by week
  }
  recentNegativeReviews: Array<{
    id: string
    rating1: number
    rating2: number
    rating3: number
    rating4: number
    averageRating: number
    customerPhone: string | null
    createdAt: string
  }>
  subscription: {
    status: string
    plan: string | null
    trialEndsAt: string | null
    daysLeft: number | null   // null if not on trial
  }
}
```

Query logic:
- Get session → ownerId
- Get owner's first shop (Phase 2 only supports 1 shop, but make it work for multi-shop later)
- `startOfMonth = first day of current month`
- Reviews this month: `prisma.review.findMany({ where: { shopId, createdAt: { gte: startOfMonth } } })`
- Compute metrics from the result set (do it in JS, not SQL, for simplicity)
- Recent negative reviews: last 10 reviews where `isPublic = false`, ordered by `createdAt DESC`
- Trial days left: `Math.ceil((trialEndsAt - now) / (1000*60*60*24))`

---

## Step 3 — AI Monthly Insights `app/api/dashboard/insights/route.ts` — GET

Requires auth. Cache this — recompute at most once per day per shop.

Collect last 30 days of reviews. If < 5 reviews, return null (not enough data).

Build a summary for Gemini:
```
Shop: {name} in {city} ({niche})
Period: last 30 days
Total reviews: {n}
Average ratings:
- {cat1}: {avg1}/5
- {cat2}: {avg2}/5
- {cat3}: {cat3}/5
- {cat4}: {avg4}/5
Notable: {cat} had most complaints (lowest avg)

Generate a 2-3 sentence actionable insight in Hinglish for the owner.
Example format: "Is mahine customers ne baar baar [issue] mention kiya. [Recommendation]."
Keep it specific, not generic. Output ONLY the insight text.
```

Cache the result: save to DB or use a simple in-memory cache with a `lastInsightAt` timestamp on Shop model. Add `lastInsightText` and `lastInsightAt` fields to Shop model if not present.

**Add to Prisma schema:**
```prisma
// In Shop model, add:
lastInsightText String?
lastInsightAt   DateTime?
```

Run `prisma db push` after.

---

## Step 4 — Dashboard Page `app/(dashboard)/dashboard/page.tsx`

Server component. Fetches metrics from API (or directly from Prisma — either works, prefer direct Prisma for server components to avoid extra network hop).

Layout:
```
[Header: ReviewQR | Shop name | Logout button]

[Trial banner if on trial: "X din baaki hain - Subscribe karein" with CTA]

[Stats row — 4 cards:]
  Total Reviews | Made it to Google | Intercepted | Avg Rating

[Two column layout on desktop, single on mobile:]
  Left: Rating trend chart (line chart, last 4 weeks)
  Right: AI Monthly Insight card

[Negative Reviews section:]
  Table/list of recent private reviews with:
  - Date
  - Category ratings (4 chips)
  - Overall rating (badge, red)
  - Customer phone (if provided) — show as "Call" link
  - "No negative reviews this month 🎉" if empty

[QR Code section:]
  - Show QR code image
  - "Download QR Code" button
  - "Copy review link" button (copies /r/slug URL)
```

**Trial banner logic:**
- If `status === 'TRIAL'` and `daysLeft <= 5`: show red banner "Sirf {daysLeft} din bache! Aaj hi subscribe karein"
- If `status === 'TRIAL'` and `daysLeft > 5`: show yellow banner "{daysLeft} din baaki hain free trial mein"
- If `status === 'EXPIRED'`: show red banner "Trial khatam! Subscribe karein" (block dashboard with overlay)
- If `status === 'ACTIVE'`: no banner

---

## Step 5 — Dashboard Expired State

When `subscriptionStatus === 'EXPIRED'`, the dashboard page should:
1. Still render (so owner can see the subscribe button)
2. Show a full-page overlay/modal: "Aapka trial khatam ho gaya. Subscribe karein to reactivate."
3. CTA button → `/billing`
4. Blur the content behind the modal

---

## Step 6 — Logout

Create `app/api/auth/logout/route.ts` — POST:
```typescript
export async function POST() {
  const res = NextResponse.json({ success: true })
  res.cookies.delete('rqr_session')
  return res
}
```

Logout button in dashboard header calls this then redirects to `/login`.

---

## Step 7 — Multi-Shop Consideration

Phase 3 only shows one shop. But structure the dashboard so it can show a shop selector dropdown later. Keep `shopId` in the URL or use the owner's first/only shop for now.

---

## Phase 3 Acceptance Criteria

- [ ] `/dashboard` shows 4 metric cards (total, public, private, avg rating)
- [ ] Rating trend chart shows last 4 weeks
- [ ] AI monthly insight shown (or "Not enough data yet" if < 5 reviews)
- [ ] Negative reviews list shows up to 10 most recent private reviews
- [ ] Customer phone shown as tappable "Call" link on mobile
- [ ] QR code displayed and downloadable
- [ ] Trial banner shows with correct days remaining
- [ ] Expired state shows overlay with subscribe CTA
- [ ] Logout works and clears session cookie
- [ ] Dashboard is protected — unauthenticated users redirect to /login
- [ ] Mobile responsive layout
