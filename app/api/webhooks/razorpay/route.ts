import crypto from "crypto";
import prisma from "@/lib/prisma";
import razorpay from "@/lib/razorpay";
import { NextRequest, NextResponse } from "next/server";
import { Plan } from "@prisma/client";

/**
 * POST /api/webhooks/razorpay
 * Handles Razorpay webhook events for subscription lifecycle.
 */
export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-razorpay-signature");

  // Verify webhook signature
  if (!signature || !verifyWebhookSignature(rawBody, signature)) {
    console.error("Razorpay webhook: Invalid signature");
    return NextResponse.json({ error: "invalid_signature" }, { status: 400 });
  }

  const payload = JSON.parse(rawBody);
  const event = payload.event as string;

  console.log(`Razorpay webhook received: ${event}`);

  try {
    switch (event) {
      case "subscription.activated":
      case "subscription.charged": {
        await handleSubscriptionActivated(payload);
        break;
      }
      case "subscription.cancelled":
      case "subscription.completed": {
        await handleSubscriptionCancelled(payload);
        break;
      }
      case "payment.failed": {
        await handlePaymentFailed(payload);
        break;
      }
      default:
        console.log(`Unhandled Razorpay event: ${event}`);
    }
  } catch (error) {
    console.error(`Error handling event ${event}:`, error);
    // Still return 200 to prevent Razorpay retries
  }

  return NextResponse.json({ received: true });
}

// ─── Signature Verification ──────────────────────────────────────

function verifyWebhookSignature(body: string, signature: string): boolean {
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET!)
    .update(body)
    .digest("hex");
  return expectedSignature === signature;
}

// ─── Event Handlers ──────────────────────────────────────────────

async function handleSubscriptionActivated(payload: Record<string, unknown>) {
  const entity = (
    payload.payload as Record<string, Record<string, Record<string, unknown>>>
  ).subscription.entity;
  const subscriptionId = entity.id as string;
  const planId = entity.plan_id as string;

  const owner = await prisma.owner.findFirst({
    where: { razorpaySubscriptionId: subscriptionId },
  });

  if (!owner) {
    console.error("Owner not found for subscription:", subscriptionId);
    return;
  }

  // Map Razorpay plan to our Plan enum by fetching plan details
  const plan = await mapRazorpayPlanToEnum(planId);

  await prisma.owner.update({
    where: { id: owner.id },
    data: {
      subscriptionStatus: "ACTIVE",
      subscriptionPlan: plan,
    },
  });

  // Activate all shops
  await prisma.shop.updateMany({
    where: { ownerId: owner.id },
    data: { isActive: true },
  });

  console.log(`Subscription activated for owner ${owner.id}, plan: ${plan}`);
}

async function handleSubscriptionCancelled(payload: Record<string, unknown>) {
  const entity = (
    payload.payload as Record<string, Record<string, Record<string, unknown>>>
  ).subscription.entity;
  const subscriptionId = entity.id as string;

  const owner = await prisma.owner.findFirst({
    where: { razorpaySubscriptionId: subscriptionId },
  });

  if (!owner) {
    console.error("Owner not found for subscription:", subscriptionId);
    return;
  }

  await prisma.owner.update({
    where: { id: owner.id },
    data: {
      subscriptionStatus: "CANCELLED",
      razorpaySubscriptionId: null,
    },
  });

  // Deactivate all shops
  await prisma.shop.updateMany({
    where: { ownerId: owner.id },
    data: { isActive: false },
  });

  console.log(`Subscription cancelled for owner ${owner.id}`);
}

async function handlePaymentFailed(payload: Record<string, unknown>) {
  const entity = (
    payload.payload as Record<string, Record<string, Record<string, unknown>>>
  ).payment.entity;
  const subscriptionId = entity.subscription_id as string | undefined;

  if (!subscriptionId) return;

  const owner = await prisma.owner.findFirst({
    where: { razorpaySubscriptionId: subscriptionId },
  });

  if (!owner) return;

  console.log(`Payment failed for owner ${owner.id}`);
  // TODO: Send WhatsApp notification about payment failure
}

// ─── Plan Mapping ────────────────────────────────────────────────

/**
 * Maps a Razorpay plan ID to our Plan enum by checking the plan amount.
 * ₹499 = STARTER, ₹999 = GROWTH, ₹2999 = AGENCY
 */
async function mapRazorpayPlanToEnum(planId: string): Promise<Plan> {
  try {
    const plan = await razorpay.plans.fetch(planId);
    const amount = Number(plan.item.amount) / 100; // paise → rupees

    if (amount <= 499) return "STARTER";
    if (amount <= 999) return "GROWTH";
    return "AGENCY";
  } catch {
    console.error("Failed to fetch plan for mapping, defaulting to STARTER");
    return "STARTER";
  }
}
