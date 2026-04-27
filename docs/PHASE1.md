# Phase 1 — AI Review Generation + WhatsApp Interception

Goal: Upgrade the Phase 0 review flow. Replace the dummy review text with real Gemini AI generation. Add WhatsApp alerts to the owner when a bad review is intercepted.

Prereq: Phase 0 complete. DB schema, auth, shop CRUD, and review skeleton are all done.

---

## Step 1 — Install Dependencies

```bash
npm install @google/generative-ai twilio
```

---

## Step 2 — Add Env Vars to `.env.local`

```
GOOGLE_AI_API_KEY=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
```

For Twilio WhatsApp in dev: join the sandbox by sending "join &lt;keyword&gt;" to +14155238886 on WhatsApp. The keyword is in your Twilio console.

---

## Step 3 — Create Constants File (if not done in Phase 0)

`constants/niches.ts` should already exist from Phase 0. Skip if it does.

---

## Step 4 — Create `lib/gemini.ts` (new file)

```typescript
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!)
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

interface ReviewInput {
  shopName: string
  city: string
  niche: string
  categories: [string, string, string, string]
  ratings: [number, number, number, number]
}

export async function generateHinglishReview(input: ReviewInput): Promise<string> {
  const variant = Math.floor(Math.random() * 4) + 1
  const ratingsText = input.categories
    .map((cat, i) => `- ${cat}: ${input.ratings[i]}/5`)
    .join('\n')

  const prompt = `You are a real Indian customer writing a genuine Google review in Hinglish (mixed Hindi and English, casual, like how Indians actually text each other).

Shop Details:
- Name: ${input.shopName}
- City: ${input.city}
- Type: ${input.niche}

My Ratings:
${ratingsText}

Write a natural Hinglish review following these rules:
- 100-150 words exactly
- Sound like a genuine customer, NOT corporate or formal
- Use 1-2 emojis max
- This is structure variant #${variant} — vary the opening and flow
- Highlight things rated 4 or 5 specifically  
- Do NOT mention or hint at anything rated below 4
- End with a recommendation
- Do NOT use hashtags
- Do NOT start with "I visited" — vary the opening

Output ONLY the review text. No quotes, no explanation, no preamble.`

  const result = await model.generateContent(prompt)
  return result.response.text().trim()
}
```

---

## Step 5 — Create `lib/twilio.ts`

```typescript
import twilio from 'twilio'

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
)

export default client
```

---

## Step 6 — Create `lib/whatsapp.ts`

```typescript
import client from './twilio'
import { NICHE_CATEGORIES } from '@/constants/niches'

interface BadReviewAlertInput {
  ownerPhone: string     // e.g. "whatsapp:+919876543210"
  shopName: string
  niche: string
  ratings: [number, number, number, number]
  averageRating: number
  customerPhone?: string
  timestamp: Date
}

export async function sendBadReviewAlert(input: BadReviewAlertInput) {
  const categories = NICHE_CATEGORIES[input.niche]
  const ratingsText = categories
    .map((cat, i) => `${cat}: ${input.ratings[i]}/5`)
    .join('\n')

  const time = input.timestamp.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'medium',
    timeStyle: 'short',
  })

  const body = `⚠️ New private feedback for *${input.shopName}*

${ratingsText}

Overall: ${input.averageRating.toFixed(1)}/5
Received: ${time}${input.customerPhone ? `\nCustomer: ${input.customerPhone}` : ''}

This was intercepted before reaching Google. Reach out and fix it! 💪`

  await client.messages.create({
    from: process.env.TWILIO_WHATSAPP_FROM!,
    to: `whatsapp:${input.ownerPhone}`,
    body,
  })
}
```

---

## Step 7 — Create `app/api/review/route.ts`

POST handler. Accepts: `{ shopId, ratings: [r1, r2, r3, r4], customerPhone? }`

Logic:
1. Fetch shop by `shopId` from DB (include owner)
2. Validate: shop exists, isActive, all ratings are 1-5 integers
3. Calculate `averageRating = (r1+r2+r3+r4) / 4`
4. If shop is not active: return 403 `{ error: 'shop_inactive' }`
5. If `averageRating < 3`:
   - Save Review to DB: `isPublic: false`, `generatedReview: null`
   - Call `sendBadReviewAlert` with owner's phone from DB
   - Return `{ status: 'private' }`
6. If `averageRating >= 3`:
   - Call `generateHinglishReview` with shop details
   - Save Review to DB: `isPublic: true`, `generatedReview: aiReview`
   - Return `{ status: 'public', review: aiReview, googleReviewUrl: shop.googleReviewUrl }`

Wrap everything in try/catch. Never let a Twilio or Gemini failure break the review submission — if AI fails, still return success but with a fallback generic message.

**Fallback review** (if Gemini fails): 
```
"Great experience at {shopName} in {city}! Really happy with the service. Would definitely recommend to everyone. Keep it up! 👍"
```

---

## Step 8 — Update Review Page (already exists from Phase 0)

`app/r/[slug]/page.tsx` and `ReviewForm.tsx` already exist. The only change needed:

In `ReviewForm.tsx`, the `done_public` step now shows the real AI-generated review (returned from the updated API in Step 7) instead of the dummy string. The UI is already built — no changes needed to the component structure.

Verify the success screen shows:
- Real Hinglish review text in a card
- "Google par paste karein" button copies it to clipboard AND opens `googleReviewUrl` in new tab

## Step 9 — `components/StarRating.tsx` (already exists from Phase 0)

No changes needed. Already built in Phase 0.

---

## Step 10 — Seed (already done in Phase 0)

`prisma/seed.ts` and test shop (`testshop1`) already exist from Phase 0. No changes needed.

For Phase 1 testing: the owner's WhatsApp alert goes to the phone number stored on the Owner record in DB. For the seeded test owner, that's empty — add your own phone to the seed or update directly in Prisma Studio (`npx prisma studio`).

Join the Twilio WhatsApp sandbox: send "join &lt;keyword&gt;" to +14155238886. Keyword is in your Twilio console → Messaging → Try it out → Send a WhatsApp message.

---

## Step 12 — Mobile-First Styling

The review page MUST look great on mobile (customers open it on their phone).

Requirements:
- Full-screen single card layout
- Max width 420px, centered
- Large tap targets for stars (min 48px row height)
- Clean sans-serif font
- Subtle gradient background
- Submit button is full-width, prominent
- Smooth transition between steps (use CSS transition or Framer Motion)

Colors: warm, trustworthy. Suggest: white card on a warm off-white or very light saffron background.

---

## Phase 1 Acceptance Criteria

- [ ] `GET /r/testshop1` loads the review page with 4 star categories
- [ ] Submitting with average < 3 saves review as private + sends WhatsApp to test number
- [ ] Submitting with average >= 3 saves review as public + returns AI Hinglish text
- [ ] Clicking "Google par paste karein" copies text to clipboard + opens Google Reviews URL
- [ ] Inactive shop shows correct message
- [ ] Mobile layout looks clean and professional
- [ ] All DB operations wrapped in try/catch
- [ ] Gemini failure doesn't break the flow (fallback text used)
