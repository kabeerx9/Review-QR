import { getSession } from "@/lib/auth";
import razorpay from "@/lib/razorpay";
import { NextResponse } from "next/server";

/**
 * GET /api/subscription/plans
 * Fetches all active subscription plans from Razorpay dynamically.
 */
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const plans = await razorpay.plans.all({ count: 20 });

    // Map Razorpay plans to our format, sorted by amount ascending
    const formatted = (plans.items || [])
      .filter((p) => p.item)
      .sort((a, b) => Number(a.item.amount) - Number(b.item.amount))
      .map((p) => ({
        id: p.id,
        name: p.item.name,
        description: p.item.description || "",
        amount: Number(p.item.amount) / 100, // Convert paise to rupees
        currency: p.item.currency,
        period: p.period,
        interval: p.interval,
      }));

    return NextResponse.json({ plans: formatted });
  } catch (error) {
    console.error("Failed to fetch plans:", error);
    return NextResponse.json(
      { error: "Failed to fetch plans" },
      { status: 500 }
    );
  }
}
