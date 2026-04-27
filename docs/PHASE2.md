# Phase 2 — Owner Auth + Onboarding + QR Generation

Goal: Owner signs up with phone OTP, sets up their shop, gets a QR code to download and print.

Prereq: Phase 1 complete.

---

## Step 1 — Install Dependencies

```bash
npm install jose nanoid
npm install -D @types/node
```

For device fingerprinting (client-side):
```bash
npm install @fingerprintjs/fingerprintjs
```

---

## Step 2 — Create `lib/auth.ts`

JWT-based session with `jose`. Cookie name: `rqr_session`.

```typescript
import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET!)

export interface SessionPayload {
  ownerId: string
  phone: string
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
```

---

## Step 3 — Create `middleware.ts` in project root

Protect all routes under `/dashboard` and `/onboarding`. Redirect to `/login` if no valid session.

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'

const PROTECTED = ['/dashboard', '/onboarding']

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  const isProtected = PROTECTED.some((p) => pathname.startsWith(p))
  if (!isProtected) return NextResponse.next()

  const token = req.cookies.get('rqr_session')?.value
  if (!token) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

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

## Step 4 — OTP API Routes

### `app/api/otp/send/route.ts` — POST

Body: `{ phone: string }` (format: `+91XXXXXXXXXX`)

Logic:
1. Validate phone is valid Indian mobile (regex: `/^\+91[6-9]\d{9}$/`)
2. Delete any existing unverified OTP codes for this phone (cleanup)
3. Generate 6-digit OTP: `Math.floor(100000 + Math.random() * 900000).toString()`
4. Save to `OtpCode` table: `{ phone, code, expiresAt: now + 10 minutes, verified: false }`
5. Send via Twilio SMS:
   ```
   client.messages.create({
     from: process.env.TWILIO_PHONE_NUMBER!,
     to: phone,
     body: `Your ReviewQR OTP is: ${code}. Valid for 10 minutes.`
   })
   ```
6. Return `{ success: true }` — do NOT return the OTP in response

Rate limit: check if an OTP was sent in the last 60 seconds for this phone. If so, return 429.

### `app/api/otp/verify/route.ts` — POST

Body: `{ phone: string, code: string, deviceFingerprint?: string }`

Logic:
1. Find latest unverified OTP for this phone where `expiresAt > now`
2. If not found: return 400 `{ error: 'invalid_or_expired' }`
3. If `otpCode.code !== code`: return 400 `{ error: 'incorrect_code' }`
4. Mark OTP as `verified: true`
5. Check if Owner exists for this phone:
   - If yes: update `deviceFingerprint` if provided, return existing owner
   - If no: create Owner `{ phone, name: '', deviceFingerprint, subscriptionStatus: TRIAL }`
     - Note: name is empty string for now — collected in onboarding
6. Create JWT: `createToken({ ownerId: owner.id, phone })`
7. Set cookie: 
   ```typescript
   const res = NextResponse.json({ success: true, isNewOwner: !existingOwner })
   res.cookies.set('rqr_session', token, {
     httpOnly: true,
     sameSite: 'lax',
     secure: process.env.NODE_ENV === 'production',
     maxAge: 60 * 60 * 24 * 30, // 30 days
     path: '/',
   })
   return res
   ```
8. Client redirects to `/onboarding` if `isNewOwner`, else `/dashboard`

---

## Step 5 — Auth Pages

### `app/(auth)/login/page.tsx`

Client component. Two sub-steps:
1. Phone entry step: 
   - Input for phone number (auto-prefix +91, accept 10 digits)
   - "Send OTP" button
   - On submit: POST to `/api/otp/send`
2. OTP verification step (shown after SMS sent):
   - 6-digit OTP input (either single input or 6 separate boxes)
   - "Verify" button
   - Countdown timer "Resend in 55s"
   - On verify: POST to `/api/otp/verify` with phone + code + fingerprint
   - On success: redirect using `router.push`

Device fingerprinting:
```typescript
// Collect fingerprint before calling verify
import FingerprintJS from '@fingerprintjs/fingerprintjs'

const fp = await FingerprintJS.load()
const result = await fp.get()
const visitorId = result.visitorId
```

Include `visitorId` in the verify POST body.

---

## Step 6 — Create `lib/places.ts`

Two strategies, attempt in order:

**Strategy A — Parse place_id from URL:**
Some URLs contain `place_id=` or `!1s` encoded Place ID in the URL path. Try regex: `/!1s(ChIJ[a-zA-Z0-9_-]+)/` and `/place_id=([a-zA-Z0-9_-]+)/`.

**Strategy B — Google Places Text Search:**
```typescript
async function searchPlaceId(query: string): Promise<string | null> {
  const url = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(query)}&inputtype=textquery&fields=place_id&key=${process.env.GOOGLE_PLACES_API_KEY}`
  const res = await fetch(url)
  const data = await res.json()
  return data.candidates?.[0]?.place_id ?? null
}
```

**Strategy C — Manual fallback:**
If both fail, return `null` and let the onboarding form show a manual Place ID input field.

Export:
```typescript
export async function extractPlaceId(mapsUrl: string, shopNameFallback: string): Promise<string | null>
```

---

## Step 7 — Create `lib/qrcode.ts`

```typescript
import QRCode from 'qrcode'

export async function generateQRDataURL(url: string): Promise<string> {
  return QRCode.toDataURL(url, {
    errorCorrectionLevel: 'H',
    margin: 2,
    width: 400,
    color: {
      dark: '#000000',
      light: '#ffffff',
    },
  })
}
```

---

## Step 8 — Shop Creation API `app/api/shop/route.ts` — POST

Requires auth (check session cookie).

Body:
```typescript
{
  name: string
  city: string
  niche: string          // must be a valid Niche enum value
  googleMapsUrl: string
  googleReviewUrl: string
  googlePlaceId?: string // manual override if auto-extraction failed
  deviceFingerprint: string
  ownerName: string      // collected in onboarding form
}
```

Logic:
1. Verify session → get ownerId
2. Check abuse prevention:
   a. Device fingerprint: `prisma.owner.findFirst({ where: { deviceFingerprint, NOT: { id: ownerId } } })` — if found, return 409 `{ error: 'device_already_used' }`
   b. Place ID: determine `finalPlaceId` (try extraction or use manual), then `prisma.shop.findFirst({ where: { googlePlaceId: finalPlaceId } })` — if found, return 409 `{ error: 'shop_already_registered' }`
3. Check owner doesn't already have a shop for Starter plan (enforce plan limits — for Phase 2, allow 1 shop since everyone is on trial)
4. Generate slug: use `nanoid(8)` with custom alphabet `0123456789abcdefghijklmnopqrstuvwxyz`
5. Generate QR data URL: `generateQRDataURL(`${process.env.NEXT_PUBLIC_APP_URL}/r/${slug}`)`
6. Update Owner: `{ name: ownerName, deviceFingerprint, trialStartedAt: now, trialEndsAt: now + 15 days }`
7. Create Shop
8. Return `{ shop: { id, slug, name, qrCodeUrl } }`

---

## Step 9 — Onboarding Pages

### `app/(auth)/onboarding/page.tsx`

Multi-step form (3 steps):

**Step 1 — Your details:**
- Name input (owner's name)
- Continue button

**Step 2 — Shop details:**
- Shop name
- City (text input)
- Niche (dropdown with NICHE_LABELS)
- Continue button

**Step 3 — Google links:**
- Google Maps URL (with helper text: "Go to Google Maps, find your shop, copy the link from the address bar")
- Google Review URL (with helper text: "Go to your Google Business Profile, click 'Get more reviews', copy the link")
- Optional: Google Place ID (shown only if "I can't find my Maps URL" is clicked)
- "Generate My QR Code" button
- On submit: collect device fingerprint + POST to `/api/shop`

### `app/(auth)/onboarding/success/page.tsx`

- "QR Code Ready!" heading
- Show QR code image (from `qrCodeUrl` in response)
- "Download QR Code" button — downloads as PNG
- "Go to Dashboard" button → `/dashboard`

**QR Download logic (client-side):**
```typescript
function downloadQR(dataUrl: string, shopName: string) {
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = `reviewqr-${shopName.replace(/\s+/g, '-').toLowerCase()}.png`
  a.click()
}
```

---

## Step 10 — Update `app/r/[slug]/page.tsx` for Inactive Check

When `shop.isActive === false`, render:

```
"Yeh shop ka review system filhaal active nahi hai.
 Agar aap is shop ke malik hain, subscribe karein: [link]"
```

---

## Phase 2 Acceptance Criteria

- [ ] `/login` lets owner enter phone, receive OTP via SMS, verify
- [ ] New owner gets JWT cookie + redirected to `/onboarding`
- [ ] Existing owner gets JWT cookie + redirected to `/dashboard`
- [ ] Onboarding form collects all shop details
- [ ] Google Place ID extracted automatically from Maps URL (or manual entry works)
- [ ] Device fingerprint abuse check blocks second trial on same device
- [ ] Place ID abuse check blocks same shop registering twice
- [ ] QR code generated and shown on success screen
- [ ] QR code downloads as PNG
- [ ] `/dashboard` and `/onboarding` redirect to `/login` if not authenticated
- [ ] Trial dates set on Owner: `trialStartedAt`, `trialEndsAt` (15 days from signup)
- [ ] QR URL format: `{NEXT_PUBLIC_APP_URL}/r/{slug}` (8-char alphanumeric slug)
