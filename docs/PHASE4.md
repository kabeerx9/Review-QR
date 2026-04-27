# Phase 4 — Payments + Trial Expiry

Goal: Owner can subscribe via Razorpay. Trial expires after 15 days. QR deactivates on expiry.

Prereq: Phase 3 complete.

---

## Step 1 — Install Dependencies

```bash
npm install razorpay
npm install -D @types/razorpay
```

---

## Step 2 — Razorpay Setup (Manual — Do Once)

1. Create account at razorpay.com
2. Go to Subscriptions → Plans → Create Plan:
   - Starter: ₹499/month, `period: monthly`, `interval: 1`
   - Growth: ₹999/month, `period: monthly`, `interval: 1`
   - Agency: ₹2999/month, `period: monthly`, `interval: 1`
3. Copy the plan IDs (format: `plan_XXXXXX`) into `.env.local`:
   ```
   RAZORPAY_KEY_ID=rzp_test_XXXXXX
   RAZORPAY_KEY_SECRET=XXXXXX
   RAZORPAY_WEBHOOK_SECRET=XXXXXX
   RAZORPAY_PLAN_STARTER=plan_XXXXXX
   RAZORPAY_PLAN_GROWTH=plan_XXXXXX
   RAZORPAY_PLAN_AGENCY=plan_XXXXXX
   ```
4. Set webhook URL in Razorpay dashboard: `{NEXT_PUBLIC_APP_URL}/api/webhooks/razorpay`
   - Events to subscribe: `subscription.activated`, `subscription.charged`, `subscription.cancelled`, `subscription.completed`, `payment.failed`

---

## Step 3 — Create `lib/razorpay.ts`

```typescript
import Razorpay from 'razorpay'

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
})

export default razorpay
```

---

## Step 4 — Subscription Create API `app/api/subscription/create/route.ts` — POST

Requires auth.

Body: `{ plan: 'STARTER' | 'GROWTH' | 'AGENCY' }`

Logic:
1. Get session → ownerId, fetch Owner
2. Map plan to Razorpay plan ID:
   ```typescript
   const PLAN_MAP = {
     STARTER: process.env.RAZORPAY_PLAN_STARTER!,
     GROWTH: process.env.RAZORPAY_PLAN_GROWTH!,
     AGENCY: process.env.RAZORPAY_PLAN_AGENCY!,
   }
   ```
3. Create Razorpay customer if not exists:
   ```typescript
   const customer = await razorpay.customers.create({
     name: owner.name,
     contact: owner.phone,
   })
   // Save customer.id to Owner.razorpayCustomerId
   ```
4. Create Razorpay subscription:
   ```typescript
   const subscription = await razorpay.subscriptions.create({
     plan_id: planId,
     customer_notify: 1,
     quantity: 1,
     total_count: 120,   // 10 years max
     customer_id: customerId,
   })
   ```
5. Save `subscription.id` to `Owner.razorpaySubscriptionId` (status stays TRIAL/EXPIRED until webhook confirms payment)
6. Return `{ subscriptionId: subscription.id, shortUrl: subscription.short_url }`
   - `short_url` is the Razorpay hosted checkout URL

**Client behavior:** Redirect owner to `short_url` for payment. On return, they land back on `/dashboard`.

---

## Step 5 — Razorpay Webhook `app/api/webhooks/razorpay/route.ts` — POST

**Critical:** Verify webhook signature before processing.

```typescript
import crypto from 'crypto'

function verifyWebhookSignature(body: string, signature: string): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET!)
    .update(body)
    .digest('hex')
  return expectedSignature === signature
}
```

Must read raw body — use `req.text()` not `req.json()`. Parse JSON after verification.

Event handlers:

**`subscription.activated` or `payment.captured`:**
- Find Owner by `razorpaySubscriptionId` from `payload.subscription.entity.id`
- Set `subscriptionStatus = ACTIVE`
- Set `subscriptionPlan` based on plan ID mapping
- Set all owner's shops `isActive = true`
- Send WhatsApp to owner: "Subscription active ho gaya! Aapka QR code reactivate ho gaya. 🎉"

**`subscription.cancelled` or `subscription.completed`:**
- Find Owner by subscriptionId
- Set `subscriptionStatus = CANCELLED`
- Set all owner's shops `isActive = false`

**`payment.failed`:**
- Find Owner
- Send WhatsApp: "Payment fail ho gaya. Dobara try karein: {billing link}"

Return `200 OK` for all events (even ones you don't handle) to prevent Razorpay retries.

---

## Step 6 — Billing Page `app/(dashboard)/billing/page.tsx`

Server component + client interactions.

Show:
- Current plan (or "Free Trial")
- Days remaining (if trial)
- Three plan cards with pricing
- "Subscribe" button on each plan

On "Subscribe" click:
1. POST to `/api/subscription/create` with selected plan
2. Redirect to `shortUrl` returned

If already subscribed (status = ACTIVE): show current plan, next billing date, "Cancel" button.

Cancel flow:
- POST to `/api/subscription/cancel` → calls `razorpay.subscriptions.cancel(subscriptionId)`
- Confirm dialog before cancelling: "Cancel karein? Aapka QR aur dashboard access band ho jayega."

---

## Step 7 — Vercel Cron Jobs for Trial Expiry

Create `vercel.json` in project root:
```json
{
  "crons": [
    {
      "path": "/api/cron/trial-expiry",
      "schedule": "0 3 * * *"
    }
  ]
}
```
(Runs daily at 3:30am UTC = 9am IST)

### `app/api/cron/trial-expiry/route.ts` — GET

Secure with CRON_SECRET:
```typescript
if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
  return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
}
```

Logic:
1. **Day 13 warning** — Find owners where:
   - `subscriptionStatus = TRIAL`
   - `trialEndsAt` is between `now + 1 day` and `now + 3 days`
   - Have not received a warning yet (add `trialWarningsentAt` field to Owner or check if trialEndsAt is exactly 2 days away)
   - Send WhatsApp day-13 warning message
   
2. **Trial expiry** — Find owners where:
   - `subscriptionStatus = TRIAL`
   - `trialEndsAt < now`
   - Update `subscriptionStatus = EXPIRED`
   - Set all their shops `isActive = false`
   - Send WhatsApp trial expired message

**Add to Owner model in schema:**
```prisma
trialWarningSentAt DateTime?
```

Run `prisma db push` after schema change.

---

## Step 8 — Plan Limit Enforcement

When trial expires or subscription is STARTER (1 shop), enforce shop count limits:

In `app/api/shop/route.ts` POST (from Phase 2):
```typescript
const shopCount = await prisma.shop.count({ where: { ownerId } })
const limits = { TRIAL: 1, STARTER: 1, GROWTH: 3, AGENCY: Infinity }
const limit = limits[owner.subscriptionStatus === 'ACTIVE' ? owner.subscriptionPlan! : 'TRIAL']

if (shopCount >= limit) {
  return NextResponse.json({ error: 'plan_limit_reached' }, { status: 403 })
}
```

---

## Step 9 — Update Review Page for Expired Shops

In `app/r/[slug]/page.tsx`, when `shop.isActive === false`, show:

```
[Shop name] ka review system filhaal active nahi hai.

Agar aap is dukan ke sahab hain:
[Subscribe karein →]
```

This creates social pressure — owner gets embarrassed, upgrades.

---

## Phase 4 Acceptance Criteria

- [ ] `/billing` shows 3 plan cards with pricing
- [ ] Clicking "Subscribe" creates Razorpay subscription and redirects to payment
- [ ] After successful payment webhook: status = ACTIVE, shops reactivated
- [ ] After cancellation webhook: status = CANCELLED, shops deactivated
- [ ] Cron job runs daily, expires trials past day 15
- [ ] Day 13 owners get WhatsApp warning
- [ ] Day 15+ owners get expiry WhatsApp + shops deactivated
- [ ] Expired QR page shows correct message to customers
- [ ] Expired dashboard shows overlay with subscribe CTA (from Phase 3)
- [ ] Plan limits enforced (Starter = 1 shop, etc.)
- [ ] Webhook signature verified before processing any event
