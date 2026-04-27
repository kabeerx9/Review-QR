# Phase 5 — Premium Features

Goal: Google auto-reply, customer recovery flow, competitor benchmarking.

Prereq: Phase 4 complete. Only for owners with ACTIVE subscription.

---

## Feature A — Google Business OAuth + Auto-Reply

### Step A1 — Google Cloud Setup (Manual — Do Once)

1. Go to Google Cloud Console → Create project "ReviewQR"
2. Enable: **Google Business Profile API**
3. Create OAuth 2.0 credentials (Web application)
4. Authorized redirect URIs: `{APP_URL}/api/auth/google-business/callback`
5. Add to `.env.local`:
   ```
   GOOGLE_CLIENT_ID=
   GOOGLE_CLIENT_SECRET=
   ```
6. Note: Google Business Profile API requires manual approval from Google for production use. Apply for access at: https://developers.google.com/my-business/content/prereqs

### Step A2 — OAuth Flow

`app/api/auth/google-business/route.ts` — GET (initiates OAuth):
```typescript
const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` + new URLSearchParams({
  client_id: process.env.GOOGLE_CLIENT_ID!,
  redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google-business/callback`,
  response_type: 'code',
  scope: 'https://www.googleapis.com/auth/business.manage',
  access_type: 'offline',
  prompt: 'consent',
  state: ownerId,  // pass ownerId through state param
})
return NextResponse.redirect(authUrl)
```

`app/api/auth/google-business/callback/route.ts` — GET:
1. Extract `code` and `state` (ownerId) from query params
2. Exchange code for tokens:
   ```typescript
   const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
     method: 'POST',
     body: new URLSearchParams({
       code,
       client_id: process.env.GOOGLE_CLIENT_ID!,
       client_secret: process.env.GOOGLE_CLIENT_SECRET!,
       redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google-business/callback`,
       grant_type: 'authorization_code',
     }),
   })
   const { access_token, refresh_token } = await tokenRes.json()
   ```
3. **Encrypt tokens before storing** using AES-256-GCM:
   ```typescript
   // lib/crypto.ts
   import crypto from 'crypto'
   const KEY = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex') // 32 bytes
   
   export function encrypt(text: string): string {
     const iv = crypto.randomBytes(12)
     const cipher = crypto.createCipheriv('aes-256-gcm', KEY, iv)
     const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()])
     const tag = cipher.getAuthTag()
     return Buffer.concat([iv, tag, encrypted]).toString('base64')
   }
   
   export function decrypt(data: string): string {
     const buf = Buffer.from(data, 'base64')
     const iv = buf.slice(0, 12)
     const tag = buf.slice(12, 28)
     const encrypted = buf.slice(28)
     const decipher = crypto.createDecipheriv('aes-256-gcm', KEY, iv)
     decipher.setAuthTag(tag)
     return decipher.update(encrypted) + decipher.final('utf8')
   }
   ```
   Add `ENCRYPTION_KEY` to env (32-byte hex: `openssl rand -hex 32`).
4. Save encrypted tokens to Owner: `googleAccessToken`, `googleRefreshToken`
5. Redirect to `/dashboard?google=connected`

### Step A3 — Create `lib/google-business.ts`

```typescript
// Refresh access token when needed
async function getAccessToken(owner: Owner): Promise<string> {
  const accessToken = decrypt(owner.googleAccessToken!)
  // Optionally check expiry — Google tokens last 1hr
  // For simplicity: always refresh using refresh token
  const refreshToken = decrypt(owner.googleRefreshToken!)
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  })
  const { access_token } = await res.json()
  return access_token
}

// Get all accounts for this user
export async function getAccounts(owner: Owner) {
  const token = await getAccessToken(owner)
  const res = await fetch('https://mybusinessaccountmanagement.googleapis.com/v1/accounts', {
    headers: { Authorization: `Bearer ${token}` },
  })
  return res.json()
}

// Get reviews for a location (uses googlePlaceId → need to map to accountId/locationId)
export async function getReviews(owner: Owner, accountId: string, locationId: string) {
  const token = await getAccessToken(owner)
  const res = await fetch(
    `https://mybusiness.googleapis.com/v4/${accountId}/${locationId}/reviews`,
    { headers: { Authorization: `Bearer ${token}` } }
  )
  return res.json()
}

// Reply to a review
export async function replyToReview(
  owner: Owner,
  accountId: string,
  locationId: string,
  reviewId: string,
  replyText: string
) {
  const token = await getAccessToken(owner)
  await fetch(
    `https://mybusiness.googleapis.com/v4/${accountId}/${locationId}/reviews/${reviewId}/reply`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ comment: replyText }),
    }
  )
}
```

### Step A4 — Auto-Reply Cron `app/api/cron/auto-reply/route.ts`

Add to `vercel.json`:
```json
{ "path": "/api/cron/auto-reply", "schedule": "0 */6 * * *" }
```
(Every 6 hours — Vercel paid plan needed for sub-daily crons)

Logic:
1. Fetch all owners where `googleAccessToken IS NOT NULL` and `subscriptionStatus = ACTIVE`
2. For each owner:
   a. Get their shops
   b. Call `getReviews` for each shop's Google location
   c. Filter reviews that don't have a reply yet (`review.reviewReply` is null)
   d. For each unanswered review:
      - Generate reply using Gemini:
        ```
        You are a warm, professional Indian business owner replying to a customer review in Hinglish.
        
        Shop: {shopName} in {city}
        Review: "{reviewText}"
        Star rating: {starRating}/5
        
        Write a genuine, warm reply in Hinglish (100 words max).
        - Thank them if it's positive
        - Apologize and promise improvement if negative
        - Sound human, not scripted
        - 1 emoji max
        Output ONLY the reply text.
        ```
      - Call `replyToReview`
      - Add `lastAutoRepliedAt` tracking to avoid re-processing

**Track processed reviews:** Store processed `reviewId`s in a `ProcessedReview` table or use a timestamp-based approach (only process reviews newer than `lastAutoReplyCheckAt` on Shop).

Add to Shop model:
```prisma
lastAutoReplyCheckAt DateTime?
googleAccountId      String?
googleLocationId     String?
```

---

## Feature B — Customer Recovery Flow

### Step B1 — Recovery Cron `app/api/cron/recovery/route.ts`

Add to `vercel.json`:
```json
{ "path": "/api/cron/recovery", "schedule": "0 */2 * * *" }
```
(Every 2 hours)

Logic:
1. Find reviews where:
   - `isPublic = true` (good reviews, went to Google)
   - `customerPhone IS NOT NULL`
   - `createdAt < now - 1 hour`
   - `createdAt > now - 24 hours` (don't send old ones)
   - No recovery token exists for this review yet (`RecoveryToken` table empty for this reviewId)
2. For each:
   a. Create `RecoveryToken`: `{ reviewId, expiresAt: now + 48hr }`
   b. Send WhatsApp to customer with recovery link
3. Log count of sent messages

### Step B2 — Recovery Page `app/r/[slug]/recover/[token]/page.tsx`

Server component:
1. Find `RecoveryToken` where `token = params.token`
2. If not found or expired: show "Yeh link expire ho gaya hai"
3. If `usedAt` is set: show "Aapka review already post ho chuka hai! 🎉"
4. Mark token as used: `{ usedAt: new Date() }`
5. Fetch the review's `generatedReview` and shop's `googleReviewUrl`
6. Render a page that:
   - Auto-copies review to clipboard on load
   - Auto-redirects to Google Reviews after 2 seconds
   - Shows countdown: "Google Reviews par redirect ho raha hai... 2s"
   - Manual button if auto-redirect blocked

---

## Feature C — Competitor Benchmarking

### Step C1 — Benchmark API `app/api/dashboard/benchmarks/route.ts` — GET

Requires auth + ACTIVE subscription.

Logic:
1. Get owner's shop: city, niche, googlePlaceId
2. Call Google Places API — Nearby Search:
   ```
   GET https://maps.googleapis.com/maps/api/place/nearbysearch/json
   ?location={shopLat},{shopLng}
   &radius=5000
   &type={placeType}    // map niche to Google place type
   &key={GOOGLE_PLACES_API_KEY}
   ```
   
   Niche → Google Places type mapping:
   ```typescript
   const NICHE_TO_PLACE_TYPE: Record<string, string> = {
     RESTAURANT: 'restaurant',
     SALON: 'beauty_salon',
     GYM: 'gym',
     HOTEL: 'lodging',
     RETAIL: 'store',
     CLINIC: 'doctor',
     COACHING: 'school',
   }
   ```
3. Filter top 5 competitors by `rating` (descending)
4. Also fetch own shop's Google rating via Places Details API:
   ```
   GET https://maps.googleapis.com/maps/api/place/details/json
   ?place_id={googlePlaceId}
   &fields=rating,user_ratings_total
   &key={GOOGLE_PLACES_API_KEY}
   ```
   Note: need shop's lat/lng for nearby search. Fetch from Places Details API using own Place ID.
5. Return:
   ```typescript
   {
     myShop: { name, rating, reviewCount }
     topCompetitor: { name, rating, reviewCount }
     cityAverage: number  // avg of top 5 competitors
     percentile: string   // "Top 20% in Dehradun" etc.
   }
   ```

### Step C2 — Benchmark Card in Dashboard

Add a new section to the dashboard page:

```
[Competitor Benchmarking]
Your rating: 4.2 ⭐ (38 reviews)
City average: 4.0 ⭐
Top in city: Sharma Dhaba — 4.8 ⭐

[Progress bar visual comparing your rating vs city average vs top]
```

Only show this section if `subscriptionStatus === 'ACTIVE'`. Show "Upgrade to see benchmarks" otherwise.

---

## Step 2 — Add Dashboard Connect Button

In `app/(dashboard)/dashboard/page.tsx`, add a "Connect Google Business" section:

- If `owner.googleAccessToken` is null: show connect button → `/api/auth/google-business`
- If connected: show "Google Business Connected ✓" with green badge
- Show auto-reply toggle (store preference in Owner: `autoReplyEnabled Boolean @default(true)`)

---

## Phase 5 Acceptance Criteria

- [ ] "Connect Google Business" button appears in dashboard
- [ ] OAuth flow works, tokens stored encrypted
- [ ] Auto-reply cron generates and posts Hinglish replies to unanswered reviews
- [ ] Same review not replied to twice
- [ ] Recovery WhatsApp sent to customers 1hr after review (if phone provided)
- [ ] Recovery link pre-fills and auto-redirects to Google
- [ ] Expired recovery tokens show correct message
- [ ] Competitor benchmarking shows own rating vs city competitors
- [ ] Benchmarking only visible on ACTIVE subscription
- [ ] Google tokens refreshed automatically on expiry

---

## Notes for Phase 5

- Google Business Profile API requires approval. Apply early — it takes weeks.
- In the meantime, implement the UI and mock the API responses for testing.
- Token encryption key must be 32 bytes (64 hex chars): `openssl rand -hex 32`
- For competitor benchmarking lat/lng: cache it after first fetch. Add `lat Float?` and `lng Float?` to Shop model.
