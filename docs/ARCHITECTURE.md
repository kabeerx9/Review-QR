# ReviewQR — Architecture & Tech Decisions

## Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 16 App Router | Already set up |
| Database | Supabase PostgreSQL via Prisma | Already set up |
| Auth | Custom JWT with `jose` | No NextAuth overhead, works on Edge, full control |
| OTP | Twilio SMS | One provider for SMS + WhatsApp, easier creds management |
| WhatsApp | Twilio WhatsApp API | Same Twilio account, sandbox for dev |
| AI | Gemini 2.0 Flash via `@google/generative-ai` | As per brief |
| Payments | Razorpay | Best for Indian INR subscriptions, UPI support |
| QR Code | `qrcode` npm package | Server-side generation, no external service |
| Device Fingerprint | `@fingerprintjs/fingerprintjs` | Client-side, free, no backend required |
| Google Places | Google Places API (Text Search) | Extract Place ID from Maps URL |
| Storage | Supabase Storage | QR code image storage (same Supabase project) |
| Deployment | Vercel | Native Next.js, free Cron Jobs |
| UI Components | shadcn/ui + Tailwind v4 | Already has Tailwind, great mobile UI |

---

## Environment Variables

```env
# Already set
DATABASE_URL=
DIRECT_URL=

# Twilio (OTP + WhatsApp)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=        # e.g. +15XXXXXXXXX (for SMS OTP)
TWILIO_WHATSAPP_FROM=       # e.g. whatsapp:+14155238886 (Twilio sandbox)

# AI
GOOGLE_AI_API_KEY=          # Gemini 2.0 Flash

# Google Places (Place ID extraction)
GOOGLE_PLACES_API_KEY=

# Auth
JWT_SECRET=                 # random 32+ char string

# Payments
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
RAZORPAY_PLAN_STARTER=      # plan_XXXXXX (create in Razorpay dashboard)
RAZORPAY_PLAN_GROWTH=
RAZORPAY_PLAN_AGENCY=

# App
NEXT_PUBLIC_APP_URL=        # https://reviewqr.app (or localhost:3000)
OWNER_WHATSAPP_DEFAULT=     # fallback WhatsApp for testing e.g. whatsapp:+91XXXXXXXXXX

# Cron security
CRON_SECRET=                # random string, passed as Authorization header
```

---

## Database Schema (Full — all phases)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

enum SubscriptionStatus {
  TRIAL
  ACTIVE
  EXPIRED
  CANCELLED
}

enum Plan {
  STARTER
  GROWTH
  AGENCY
}

enum Niche {
  RESTAURANT
  SALON
  GYM
  HOTEL
  RETAIL
  CLINIC
  COACHING
}

model Owner {
  id                     String             @id @default(cuid())
  phone                  String             @unique
  name                   String
  deviceFingerprint      String?
  trialStartedAt         DateTime?
  trialEndsAt            DateTime?
  subscriptionStatus     SubscriptionStatus @default(TRIAL)
  subscriptionPlan       Plan?
  razorpayCustomerId     String?
  razorpaySubscriptionId String?
  googleAccessToken      String?            // encrypted
  googleRefreshToken     String?            // encrypted
  shops                  Shop[]
  createdAt              DateTime           @default(now())
  updatedAt              DateTime           @updatedAt
}

model Shop {
  id              String   @id @default(cuid())
  owner           Owner    @relation(fields: [ownerId], references: [id])
  ownerId         String
  name            String
  city            String
  niche           Niche
  googleMapsUrl   String
  googleReviewUrl String
  googlePlaceId   String   @unique      // abuse prevention: one trial per location
  slug            String   @unique      // 8-char random: used in QR URL /r/{slug}
  qrCodeUrl       String?              // Supabase Storage URL or data URL
  isActive        Boolean  @default(true)
  reviews         Review[]
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model Review {
  id              String          @id @default(cuid())
  shop            Shop            @relation(fields: [shopId], references: [id])
  shopId          String
  rating1         Int             // category 1 (1-5)
  rating2         Int             // category 2 (1-5)
  rating3         Int             // category 3 (1-5)
  rating4         Int             // category 4 (1-5)
  averageRating   Float
  generatedReview String?         // null for bad reviews (avg < 3)
  customerPhone   String?
  isPublic        Boolean         // true if avg >= 3
  recoveryTokens  RecoveryToken[]
  createdAt       DateTime        @default(now())
}

model RecoveryToken {
  id        String    @id @default(cuid())
  review    Review    @relation(fields: [reviewId], references: [id])
  reviewId  String
  token     String    @unique @default(cuid())
  expiresAt DateTime
  usedAt    DateTime?
  createdAt DateTime  @default(now())
}

model OtpCode {
  id        String   @id @default(cuid())
  phone     String
  code      String
  expiresAt DateTime
  verified  Boolean  @default(false)
  createdAt DateTime @default(now())

  @@index([phone])
}
```

---

## Folder Structure

```
app/
  (auth)/
    login/page.tsx              — phone number input
    verify/page.tsx             — OTP input
    onboarding/page.tsx         — shop setup form
    onboarding/success/page.tsx — show QR code + download
  (dashboard)/
    dashboard/page.tsx          — owner dashboard
    billing/page.tsx            — subscription management
  r/
    [slug]/page.tsx             — public review page (customer-facing)
    [slug]/recover/[token]/
      page.tsx                  — recovery link (pre-fills + redirects)
  api/
    review/route.ts             — POST: submit rating → AI or intercept
    otp/
      send/route.ts             — POST: generate + send OTP
      verify/route.ts           — POST: verify OTP + issue JWT
    shop/route.ts               — POST: create shop (onboarding)
    shop/[id]/route.ts          — GET: fetch shop details
    qr/[shopId]/route.ts        — GET: return QR code for shop
    dashboard/metrics/route.ts  — GET: authed, return stats
    subscription/
      create/route.ts           — POST: create Razorpay subscription
    webhooks/
      razorpay/route.ts         — POST: handle Razorpay events
    cron/
      trial-expiry/route.ts     — GET: expire trials, send alerts (Vercel Cron)
      auto-reply/route.ts       — GET: poll Google reviews, post AI replies
      recovery/route.ts         — GET: send recovery WhatsApp to customers

lib/
  prisma.ts         — singleton Prisma client (already exists)
  auth.ts           — createToken, verifyToken, getSession
  twilio.ts         — Twilio client singleton
  gemini.ts         — generateHinglishReview(input)
  razorpay.ts       — Razorpay client singleton
  places.ts         — extractPlaceId(googleMapsUrl)
  qrcode.ts         — generateQRDataURL(url)
  whatsapp.ts       — WhatsApp message template functions

constants/
  niches.ts         — NICHE_CATEGORIES, NICHE_LABELS

components/
  StarRating.tsx    — interactive 1-5 star component (client)
  QRDownload.tsx    — QR image with download button

middleware.ts       — protect /dashboard routes, check JWT cookie
```

---

## Key Architectural Decisions & Rationale

### 1. No NextAuth
Custom JWT with `jose`. Reason: NextAuth adds complexity for a phone-OTP only flow with no social login needed in MVP. `jose` is edge-compatible, tiny, and gives full control over cookie shape.

Cookie: `httpOnly`, `sameSite: lax`, `secure` in prod. Payload: `{ ownerId, phone, iat, exp }`. Expiry: 30 days.

### 2. Twilio for both SMS + WhatsApp
One set of credentials. In dev: use Twilio sandbox for WhatsApp (free, no approval needed). In prod: get Twilio WhatsApp Business sender approved.

### 3. Google Place ID Extraction
Accept a Google Maps URL from owner. Call Google Places API Text Search with the URL's embedded place name, or use the `place_id` query param if present in the URL.

URL patterns to handle:
- `https://maps.google.com/?cid=XXXXX` — CID, needs Places API lookup
- `https://www.google.com/maps/place/ShopName/@lat,lng/data=...` — parse place name + coords
- `https://goo.gl/maps/XXXXX` — short URL, follow redirect then parse

Simplest approach: tell owner to paste the URL, call `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input={encoded url}&inputtype=textquery&fields=place_id` — OR — just ask owner to also paste their Place ID (show them how to find it). **For MVP, show instructions to find Place ID directly** in the onboarding form. No URL parsing needed. Parse the Maps URL only for convenience, fallback to manual entry.

### 4. QR Code Generation
Use `qrcode` to generate a data URL server-side in the API route. Store the data URL in the DB `qrCodeUrl` field. For download, serve as PNG from canvas on client. No Supabase Storage needed for MVP.

### 5. Razorpay Subscriptions
Create subscription plans in Razorpay dashboard (one-time). Store plan IDs in env. On payment: create a Razorpay subscription, redirect owner to Razorpay hosted checkout. On success webhook: update `subscriptionStatus = ACTIVE`, `subscriptionPlan = plan`, set `isActive = true` on all their shops.

### 6. Vercel Cron Jobs
Free tier allows 1 cron per day. Use two crons:
- Daily at 9am IST: trial expiry check + Day 13 warning
- Hourly (paid) or daily (free): auto-reply + recovery WhatsApp

For MVP, daily is fine.

### 7. Abuse Prevention
Three checks on signup:
1. Phone OTP → one Owner per phone (unique constraint in DB)
2. Google Place ID → `@unique` in Shop model
3. Device fingerprint → check `Owner.deviceFingerprint` before creating trial

### 8. Negative Review Threshold
`averageRating < 3` → private. The brief says this. Keep it simple, no rounding tricks.

### 9. AI Prompt Strategy
Vary structure by randomly choosing from prompt templates (3-4 variants). Pass variant index as part of the prompt to force variety. This ensures reviews don't look identical.

---

## Pricing Plans (Razorpay)

| Plan | Price | Shops | Notes |
|---|---|---|---|
| Starter | ₹499/month | 1 | |
| Growth | ₹999/month | 3 | |
| Agency | ₹2999/month | unlimited | White label (Phase 5) |

---

## WhatsApp Message Templates

All messages must be approved by WhatsApp Business for production. For dev, use Twilio sandbox.

**Bad review alert to owner:**
```
⚠️ New private feedback for *{shopName}*

{cat1}: {r1}/5
{cat2}: {r2}/5
{cat3}: {r3}/5
{cat4}: {r4}/5

Overall: {avg}/5
Received: {time}
{customerPhone ? `Customer: ${customerPhone}` : ''}

This was intercepted before reaching Google. Reach out and fix it! 💪
```

**Day 13 trial warning:**
```
⏳ *ReviewQR* — Sirf 2 din bache!

{shopName} ka free trial 2 din mein khatam ho raha hai.

Abhi subscribe karein taaki aapke Google reviews band na hon:
👉 {appUrl}/billing

— ReviewQR Team
```

**Trial expired:**
```
🔴 *ReviewQR* — Trial Khatam Ho Gaya

{shopName} ka QR code deactivate ho gaya hai.

Customers scan kar rahe hain par reviews nahi ja rahe.

Abhi subscribe karein:
👉 {appUrl}/billing
```

**Recovery message to customer:**
```
👋 Hi! Aapne haal hi mein *{shopName}* ko rate kiya tha.

Aapka Google review ready hai — sirf 10 second lagenge! 🙏

Yahan click karein:
👉 {appUrl}/r/{slug}/recover/{token}
```

---

## Gemini Prompt Template

```
You are a real Indian customer writing a genuine Google review in Hinglish (mixed Hindi and English, casual, like how Indians actually text each other).

Shop Details:
- Name: {shopName}
- City: {city}
- Type: {niche}

My Ratings:
- {category1}: {rating1}/5
- {category2}: {rating2}/5  
- {category3}: {rating3}/5
- {category4}: {rating4}/5

Write a natural Hinglish review following these rules:
- 100-150 words exactly
- Sound like a genuine customer, NOT corporate or formal
- Use 1-2 emojis max
- Structure variant #{variant} (1-4) — vary the opening and structure each time
- Highlight things rated 4 or 5 specifically
- Don't mention or hint at things rated below 4
- End with a recommendation if overall experience was positive
- DO NOT use hashtags
- DO NOT start with "I visited" or "Maine visit kiya" — vary the opening

Output ONLY the review text. No quotes, no explanation.
```

---

## Niche Categories

```typescript
export const NICHE_CATEGORIES: Record<string, [string, string, string, string]> = {
  RESTAURANT: ['Food', 'Cleanliness', 'Service', 'Ambience'],
  SALON:      ['Staff Behaviour', 'Cleanliness', 'Value for Money', 'Experience'],
  GYM:        ['Equipment', 'Cleanliness', 'Trainers', 'Atmosphere'],
  HOTEL:      ['Room Quality', 'Cleanliness', 'Staff', 'Value for Money'],
  RETAIL:     ['Product Quality', 'Staff Behaviour', 'Cleanliness', 'Value for Money'],
  CLINIC:     ['Doctor Behaviour', 'Cleanliness', 'Wait Time', 'Staff'],
  COACHING:   ['Teaching Quality', 'Study Material', 'Cleanliness', 'Value for Money'],
}

export const NICHE_LABELS: Record<string, string> = {
  RESTAURANT: 'Restaurant / Dhaba / Cafe',
  SALON:      'Salon / Parlour',
  GYM:        'Gym / Fitness Centre',
  HOTEL:      'Hotel / Guest House',
  RETAIL:     'Retail Shop / Showroom',
  CLINIC:     'Clinic / Medical',
  COACHING:   'Coaching / Classes',
}
```

---

## Phase Build Order

1. **Phase 1** — Review page + AI generation + WhatsApp intercept (no auth)
2. **Phase 2** — Owner auth + onboarding + QR generation
3. **Phase 3** — Owner dashboard
4. **Phase 4** — Payments + trial expiry
5. **Phase 5** — Google auto-reply + recovery flow + competitor benchmarking

Each phase has its own todo file in `docs/`.
