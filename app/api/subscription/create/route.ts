import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import razorpay from "@/lib/razorpay";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/subscription/create
 * Creates a Razorpay subscription for the authenticated owner.
 * Body: { planId: string }
 */
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { planId } = body;

  if (!planId) {
    return NextResponse.json(
      { error: "planId is required" },
      { status: 400 }
    );
  }

  const owner = await prisma.owner.findUnique({
    where: { id: session.ownerId },
  });

  if (!owner) {
    return NextResponse.json({ error: "owner_not_found" }, { status: 404 });
  }

  try {
    // Create or reuse Razorpay customer
    let customerId = owner.razorpayCustomerId;
    if (!customerId) {
      const customer = await razorpay.customers.create({
        name: owner.name || "Owner",
        email: owner.email || undefined,
        contact: owner.phone || undefined,
      });
      customerId = customer.id;
      await prisma.owner.update({
        where: { id: owner.id },
        data: { razorpayCustomerId: customerId },
      });
    }

    // Create subscription
    const subscription = await razorpay.subscriptions.create({
      plan_id: planId,
      customer_notify: 1,
      quantity: 1,
      total_count: 120, // 10 years max
      notes: {
        ownerId: owner.id,
        customerId: customerId,
      },
    });

    // Save subscription ID (status stays TRIAL/EXPIRED until webhook confirms)
    await prisma.owner.update({
      where: { id: owner.id },
      data: { razorpaySubscriptionId: subscription.id },
    });

    return NextResponse.json({
      subscriptionId: subscription.id,
      shortUrl: subscription.short_url,
    });
  } catch (error) {
    console.error("Failed to create subscription:", error);
    return NextResponse.json(
      {
        error: "subscription_create_failed",
        message:
          error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
