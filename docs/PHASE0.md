# Phase 0 — Landing Page + Simple Auth + Basic CRUD + QR

Goal: Working product skeleton with zero external service dependencies. Everything here can be built and tested offline. External services (WhatsApp, AI, Razorpay, phone OTP) come in later phases.

No Twilio. No Gemini. No Razorpay. No Google APIs.

---

## What we're building

1. Beautiful marketing landing page
2. Email + password auth (JWT, swap to phone OTP later in Phase 2)
3. Owner onboarding — create a shop (no abuse checks yet)
4. QR code generation (local, no external service)
5. Review page skeleton (no AI yet — just collects ratings)
6. Basic owner dashboard (just shows their shop + QR)

---

## Step 1 — Install Dependencies

```bash
npm install jose bcryptjs nanoid qrcode
npm install -D @types/bcryptjs @types/qrcode tsx

npx shadcn@latest init
# Options: TypeScript, App Router, yes to Tailwind, src/ = no, @/components, @/lib/utils
npx shadcn@latest add button card input label badge separator tabs
```

---

## Step 2 — Update Prisma Schema

Replace `prisma/schema.prisma` with this. This is the full schema for all phases — define it all now so future phases don't need migrations.

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
  email                  String?            @unique   // Phase 0 auth
  passwordHash           String?                      // Phase 0 auth
  phone                  String?            @unique   // Phase 2: swap to phone OTP
  name                   String             @default("")
  deviceFingerprint      String?
  trialStartedAt         DateTime?
  trialEndsAt            DateTime?
  trialWarningSentAt     DateTime?
  subscriptionStatus     SubscriptionStatus @default(TRIAL)
  subscriptionPlan       Plan?
  razorpayCustomerId     String?
  razorpaySubscriptionId String?
  googleAccessToken      String?
  googleRefreshToken     String?
  autoReplyEnabled       Boolean            @default(true)
  shops                  Shop[]
  createdAt              DateTime           @default(now())
  updatedAt              DateTime           @updatedAt
}

model Shop {
  id                   String    @id @default(cuid())
  owner                Owner     @relation(fields: [ownerId], references: [id])
  ownerId              String
  name                 String
  city                 String
  niche                Niche
  googleMapsUrl        String    @default("")
  googleReviewUrl      String    @default("")
  googlePlaceId        String?   @unique
  slug                 String    @unique
  qrCodeUrl            String?
  isActive             Boolean   @default(true)
  lastAutoReplyCheckAt DateTime?
  lastInsightText      String?
  lastInsightAt        DateTime?
  googleAccountId      String?
  googleLocationId     String?
  lat                  Float?
  lng                  Float?
  reviews              Review[]
  createdAt            DateTime  @default(now())
  updatedAt            DateTime  @updatedAt
}

model Review {
  id              String          @id @default(cuid())
  shop            Shop            @relation(fields: [shopId], references: [id])
  shopId          String
  rating1         Int
  rating2         Int
  rating3         Int
  rating4         Int
  averageRating   Float
  generatedReview String?
  customerPhone   String?
  isPublic        Boolean
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

Run:
```bash
npx prisma db push
npx prisma generate
```

---

## Step 3 — Constants

Create `constants/niches.ts`:

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

## Step 4 — Auth (`lib/auth.ts`)

Uses `jose` for JWT, `bcryptjs` for passwords. Cookie name: `rqr_session`.

```typescript
import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET!)

export interface SessionPayload {
  ownerId: string
  email: string
}

export async function createToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(SECRET)
}

export async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET)
    return payload as unknown as SessionPayload
  } catch {
    return null
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('rqr_session')?.value
  if (!token) return null
  return verifyToken(token)
}

export async function getSessionFromRequest(req: NextRequest): Promise<SessionPayload | null> {
  const token = req.cookies.get('rqr_session')?.value
  if (!token) return null
  return verifyToken(token)
}

export function setSessionCookie(res: NextResponse, token: string): void {
  res.cookies.set('rqr_session', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
  })
}
```

---

## Step 5 — `lib/qrcode.ts`

```typescript
import QRCode from 'qrcode'

export async function generateQRDataURL(url: string): Promise<string> {
  return QRCode.toDataURL(url, {
    errorCorrectionLevel: 'H',
    margin: 2,
    width: 400,
    color: { dark: '#000000', light: '#ffffff' },
  })
}
```

---

## Step 6 — `middleware.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'

const PROTECTED = ['/dashboard', '/onboarding']

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const isProtected = PROTECTED.some((p) => pathname.startsWith(p))
  if (!isProtected) return NextResponse.next()

  const token = req.cookies.get('rqr_session')?.value
  if (!token) return NextResponse.redirect(new URL('/login', req.url))

  const session = await verifyToken(token)
  if (!session) {
    const res = NextResponse.redirect(new URL('/login', req.url))
    res.cookies.delete('rqr_session')
    return res
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/onboarding/:path*'],
}
```

---

## Step 7 — Auth API Routes

### `app/api/auth/signup/route.ts` — POST

Body: `{ name, email, password }`

```typescript
import bcrypt from 'bcryptjs'
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { createToken, setSessionCookie } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const { name, email, password } = await req.json()

  if (!email || !password || password.length < 6) {
    return NextResponse.json({ error: 'invalid_input' }, { status: 400 })
  }

  const existing = await prisma.owner.findUnique({ where: { email } })
  if (existing) {
    return NextResponse.json({ error: 'email_taken' }, { status: 409 })
  }

  const passwordHash = await bcrypt.hash(password, 12)
  const owner = await prisma.owner.create({
    data: {
      name,
      email,
      passwordHash,
      trialStartedAt: new Date(),
      trialEndsAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      subscriptionStatus: 'TRIAL',
    },
  })

  const token = await createToken({ ownerId: owner.id, email: owner.email! })
  const res = NextResponse.json({ success: true })
  setSessionCookie(res, token)
  return res
}
```

### `app/api/auth/login/route.ts` — POST

Body: `{ email, password }`

```typescript
import bcrypt from 'bcryptjs'
// ...
const owner = await prisma.owner.findUnique({ where: { email } })
if (!owner || !owner.passwordHash) {
  return NextResponse.json({ error: 'invalid_credentials' }, { status: 401 })
}
const valid = await bcrypt.compare(password, owner.passwordHash)
if (!valid) {
  return NextResponse.json({ error: 'invalid_credentials' }, { status: 401 })
}
const token = await createToken({ ownerId: owner.id, email: owner.email! })
const res = NextResponse.json({ success: true })
setSessionCookie(res, token)
return res
```

### `app/api/auth/logout/route.ts` — POST

```typescript
export async function POST() {
  const res = NextResponse.json({ success: true })
  res.cookies.delete('rqr_session')
  return res
}
```

---

## Step 8 — Landing Page `app/page.tsx`

This is the marketing homepage. Make it beautiful. Server component, fully static.

### Sections (in order):

**Navbar:**
- Logo (left): "ReviewQR" in bold, maybe a small QR icon
- Nav links (center, hidden on mobile): How it Works, Pricing, For Owners
- CTA buttons (right): "Login" (ghost) + "Start Free Trial" (primary)
- Mobile: hamburger → drawer

**Hero:**
- Headline (large, bold): "Turn happy customers into Google reviews. Automatically."
- Subheadline: "Offline shops get a QR code. Customer scans → rates → AI writes a real review → paste on Google. Bad reviews never reach Google."
- Two CTAs: "Get Your QR Code Free" (primary, big) + "See how it works ↓" (text link)
- Visual: mockup of a phone showing the review rating screen (can be a simple illustrated card, not a real screenshot)
- Small trust line: "15-day free trial • No card required • Setup in 2 minutes"

**How It Works (3 steps):**
- Step 1: Customer scans the QR code on the table/counter
- Step 2: Rates the shop in 4 quick taps — no typing
- Step 3: AI writes a real Hinglish review, customer just pastes it on Google

Use icon + heading + 1-line description per step. Clean, minimal.

**Negative Review Interception (the hook feature):**
- Heading: "Bad reviews? We intercept them."
- Explanation: "If a customer is unhappy (rating below 3), their feedback never reaches Google. You get a private WhatsApp alert with the details. Fix the problem before it goes public."
- Small visual: a "fork in the road" flow diagram showing public vs private path

**Who It's For:**
- Grid of niche cards: Restaurant, Salon, Gym, Hotel, Retail, Clinic, Coaching
- Each card: emoji icon + niche name + "4 rating categories"

**Pricing:**
```
Free Trial — 15 days, everything unlocked, no card

[3 plan cards side by side:]
Starter ₹499/mo | Growth ₹999/mo | Agency ₹2999/mo

Starter: 1 shop, all core features
Growth: 3 shops, all features  
Agency: Unlimited shops, white label
```
Highlight the Growth plan as "Most Popular".

**FAQ (5-6 questions):**
- Do customers need to download an app? → No, just a browser link from the QR scan
- What if the customer doesn't post the review? → We send them a WhatsApp reminder after 1 hour (with their review pre-filled)
- How are bad reviews handled? → You get a private WhatsApp alert, the review never reaches Google
- What language are the reviews in? → Hinglish — how Indians actually write on Google
- Can I see what reviews were generated? → Yes, in your dashboard
- Do I need a Google Business account? → Basic features work without one. Auto-reply requires linking your Google account.

Use shadcn `Accordion` for FAQ. Install it: `npx shadcn@latest add accordion`

**Footer:**
- Logo + tagline
- Links: Privacy, Terms, Contact
- "Made for Indian shop owners 🇮🇳"

### Design Language:
- Colors: Warm but clean. Suggest: primary = `#FF6B35` (saffron orange) or a deep indigo. White background.
- Font: System font stack or Inter (already in Next.js default)
- Cards with very subtle shadows
- Rounded corners (rounded-2xl)
- Mobile-first. The hero must look great on a 375px screen.
- Add `npx shadcn@latest add accordion` for FAQ

---

## Step 9 — Auth Pages

### `app/(auth)/login/page.tsx`

Client component. Simple email + password form.

- ReviewQR logo/name at top
- "Welcome back" heading
- Email input + Password input
- "Login" button (full width)
- "Don't have an account? Sign up" link → `/signup`
- On submit: POST to `/api/auth/login`, on success: `router.push('/dashboard')`
- Show inline error if `invalid_credentials`

### `app/(auth)/signup/page.tsx`

- "Create your account" heading  
- Name + Email + Password fields
- "Start Free Trial" button (full width)
- "Already have an account? Login" link
- On submit: POST to `/api/auth/signup`, on success: `router.push('/onboarding')`

Both pages: centered card, max-width 400px, white card on light gray background. Clean, minimal.

---

## Step 10 — Onboarding `app/(auth)/onboarding/page.tsx`

Multi-step client component. No abuse checks in Phase 0 — add those in Phase 2.

**Step 1 — Shop basics:**
- Shop name (text)
- City (text)
- Niche (select dropdown using NICHE_LABELS)
- Continue →

**Step 2 — Google links (optional for now):**
- Google Review URL (text input, optional)
- Helper text: "This is where customers will be sent to post. Find it in your Google Business Profile → Get more reviews."
- Google Maps URL (text input, optional)
- "I'll add this later" link to skip
- Continue →

On final submit: POST to `/api/shop`:
- Body: `{ name, city, niche, googleReviewUrl, googleMapsUrl }`
- On success: redirect to `/onboarding/success?shopId={id}`

### `app/(auth)/onboarding/success/page.tsx`

- "Your QR code is ready! 🎉"
- Show QR code image (fetched from API or returned in shop creation response)
- "Download QR Code" button
- "Go to Dashboard" button

---

## Step 11 — Shop API `app/api/shop/route.ts` — POST

Requires auth (check session).

```typescript
import { nanoid } from 'nanoid'
import { generateQRDataURL } from '@/lib/qrcode'

// In POST handler:
const session = await getSessionFromRequest(req)
if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

const { name, city, niche, googleReviewUrl, googleMapsUrl } = await req.json()

const slug = nanoid(8)  // e.g. "aB3xKp9z"
const qrUrl = `${process.env.NEXT_PUBLIC_APP_URL}/r/${slug}`
const qrCodeUrl = await generateQRDataURL(qrUrl)

const shop = await prisma.shop.create({
  data: {
    ownerId: session.ownerId,
    name,
    city,
    niche,
    googleReviewUrl: googleReviewUrl || '',
    googleMapsUrl: googleMapsUrl || '',
    slug,
    qrCodeUrl,
    isActive: true,
  },
})

return NextResponse.json({ shop })
```

---

## Step 12 — Review Page Skeleton `app/r/[slug]/page.tsx`

**Server component** — fetches shop by slug.

If not found: `notFound()`
If not active: render inactive message

Render `<ReviewForm>` client component with: `{ shopId, shopName, city, niche, googleReviewUrl }`

**`ReviewForm` client component:**

State: `ratings: [0,0,0,0]`, `phone: string`, `step: 'rating' | 'submitting' | 'done_public' | 'done_private'`

Render:
- Shop name + city as header
- 4 `<StarRating>` rows with category labels from `NICHE_CATEGORIES[niche]`
- Optional phone input
- Submit button (disabled until all 4 rated)
- On submit: POST to `/api/review`
- `done_public`: show "Shukriya! 🙏" + the generated review text (placeholder for now) + "Copy & Open Google" button
- `done_private`: show "Shukriya for your feedback! We'll improve."

**Note:** In Phase 0, the review API just saves ratings and returns a dummy "review" string. AI generation comes in Phase 1.

---

## Step 13 — Review API `app/api/review/route.ts` — POST (Phase 0 version)

Simplified — no AI, no WhatsApp.

```typescript
// Body: { shopId, ratings: [r1,r2,r3,r4], customerPhone? }
const avg = (r1+r2+r3+r4) / 4
const isPublic = avg >= 3

await prisma.review.create({
  data: {
    shopId,
    rating1: r1, rating2: r2, rating3: r3, rating4: r4,
    averageRating: avg,
    isPublic,
    customerPhone: customerPhone || null,
    generatedReview: isPublic
      ? `Great experience at ${shop.name} in ${shop.city}! Really enjoyed the visit. Would definitely recommend! 👍`
      : null,
  },
})

return NextResponse.json({
  status: isPublic ? 'public' : 'private',
  review: isPublic ? generatedReview : null,
  googleReviewUrl: shop.googleReviewUrl || null,
})
```

---

## Step 14 — Basic Dashboard `app/(dashboard)/dashboard/page.tsx`

Server component. No charts yet (Phase 3).

Fetch from Prisma directly:
- Owner's shop(s)
- Review count (total)
- Last 5 reviews

Show:
- "Welcome, {name}!"
- Trial banner: "{N} days left in your free trial"
- Shop card: name, city, niche, QR code, "Download QR" button, "Copy review link" button
- Review count badge: "X reviews collected"
- Simple table of last 5 reviews: date, avg rating, public/private badge
- "No shop yet? Set one up →" if no shops

Keep it functional, not fancy. Fancy UI comes in Phase 3.

---

## Step 15 — `components/StarRating.tsx`

Client component. Touch-friendly.

Props: `{ value: number, onChange: (v: number) => void, label: string, disabled?: boolean }`

- Render label above 5 stars
- Clicking a star sets value
- Hover preview (on desktop)
- Each star: min 44px width, use filled/empty SVG or emoji ⭐
- Selected stars: gold/amber color
- Unselected: gray

---

## Step 16 — Environment Variables

Add to `.env.local`:
```
JWT_SECRET=your-random-32-char-string-here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Generate JWT_SECRET: `openssl rand -base64 32`

---

## Step 17 — Seed Script for Development

Create `prisma/seed.ts` with a test shop so review page works without going through onboarding:

```typescript
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
const prisma = new PrismaClient()

async function main() {
  const passwordHash = await bcrypt.hash('password123', 12)
  
  const owner = await prisma.owner.upsert({
    where: { email: 'test@reviewqr.app' },
    update: {},
    create: {
      email: 'test@reviewqr.app',
      passwordHash,
      name: 'Test Owner',
      subscriptionStatus: 'TRIAL',
      trialStartedAt: new Date(),
      trialEndsAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
    },
  })

  await prisma.shop.upsert({
    where: { slug: 'testshop1' },
    update: {},
    create: {
      ownerId: owner.id,
      name: 'Sharma Ji Ka Dhaba',
      city: 'Dehradun',
      niche: 'RESTAURANT',
      googleMapsUrl: 'https://maps.google.com',
      googleReviewUrl: 'https://g.page/r/PLACEHOLDER/review',
      slug: 'testshop1',
      isActive: true,
    },
  })

  console.log('✓ Seeded. Login: test@reviewqr.app / password123')
  console.log('✓ Review page: http://localhost:3000/r/testshop1')
}

main().catch(console.error).finally(() => prisma.$disconnect())
```

Add to `package.json`:
```json
"prisma": {
  "seed": "tsx prisma/seed.ts"
}
```

Run: `npx prisma db seed`

---

## Phase 0 Acceptance Criteria

- [ ] Landing page renders at `/` with all sections (Navbar, Hero, How It Works, Interception, Niches, Pricing, FAQ, Footer)
- [ ] Landing page looks great on mobile (375px) and desktop
- [ ] `/signup` creates owner + sets JWT cookie + redirects to `/onboarding`
- [ ] `/login` authenticates owner + sets JWT cookie + redirects to `/dashboard`
- [ ] `/onboarding` collects shop details, creates shop, shows QR code on success
- [ ] QR code downloads as PNG
- [ ] QR URL points to `/r/{slug}`
- [ ] `/r/testshop1` shows review form with 4 star categories (Restaurant niche)
- [ ] Submitting ratings saves to DB, returns public/private status
- [ ] avg >= 3 → done_public screen with dummy review text + "Copy & Open Google" button
- [ ] avg < 3 → done_private thank you screen
- [ ] `/dashboard` shows shop info + QR + recent reviews (protected by JWT middleware)
- [ ] Logout clears cookie + redirects to `/login`
- [ ] All routes protected correctly (unauthenticated → redirect to `/login`)
- [ ] No external service calls anywhere in Phase 0

---

## What This Phase Does NOT Have (comes later)

| Feature | Phase |
|---|---|
| Phone OTP login | Phase 2 |
| WhatsApp alerts | Phase 1 |
| AI review generation | Phase 1 |
| Google Place ID extraction | Phase 2 |
| Device fingerprint abuse check | Phase 2 |
| Razorpay payments | Phase 4 |
| Dashboard charts/insights | Phase 3 |
| Trial expiry cron | Phase 4 |
| Recovery flow | Phase 5 |
| Google auto-reply | Phase 5 |
