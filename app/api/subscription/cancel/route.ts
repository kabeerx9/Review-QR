import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import razorpay from "@/lib/razorpay";
import { NextResponse } from "next/server";

/**
 * POST /api/subscription/cancel
 * Cancels the authenticated owner's active Razorpay subscription.
 */
export async function POST() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const owner = await prisma.owner.findUnique({
    where: { id: session.ownerId },
  });

  if (!owner || !owner.razorpaySubscriptionId) {
    return NextResponse.json(
      { error: "no_active_subscription" },
      { status: 400 }
    );
  }

  try {
    await razorpay.subscriptions.cancel(owner.razorpaySubscriptionId);

    // Update owner status
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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to cancel subscription:", error);
    return NextResponse.json(
      { error: "cancel_failed" },
      { status: 500 }
    );
  }
}
