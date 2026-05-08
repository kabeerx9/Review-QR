import { requireOwner } from "@/lib/auth";
import Link from "next/link";
import UserMenu from "@/components/UserMenu";
import BillingClient from "@/components/BillingClient";
import prisma from "@/lib/prisma";
import razorpay from "@/lib/razorpay";

export default async function BillingPage() {
  const owner = await requireOwner();

  // Fetch plans from Razorpay
  let plans: {
    id: string;
    name: string;
    description: string;
    amount: number;
    currency: string;
    period: string;
    interval: number;
  }[] = [];

  try {
    const razorpayPlans = await razorpay.plans.all({ count: 20 });
    plans = (razorpayPlans.items || [])
      .filter((p) => p.item)
      .sort((a, b) => Number(a.item.amount) - Number(b.item.amount))
      .map((p) => ({
        id: p.id,
        name: p.item.name,
        description: p.item.description || "",
        amount: Number(p.item.amount) / 100,
        currency: p.item.currency,
        period: p.period,
        interval: p.interval,
      }));
  } catch (error) {
    console.error("Failed to fetch Razorpay plans:", error);
  }

  const status = owner.subscriptionStatus;
  const isTrial = status === "TRIAL";
  const isActive = status === "ACTIVE";
  const isExpired = status === "EXPIRED";
  const isCancelled = status === "CANCELLED";
  const trialEndsAt = owner.trialEndsAt
    ? owner.trialEndsAt.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "N/A";
  const daysLeft =
    isTrial && owner.trialEndsAt
      ? Math.max(
          0,
          Math.ceil(
            (owner.trialEndsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
          )
        )
      : null;

  // Map plan enum to tier for display
  const currentPlanName = owner.subscriptionPlan
    ? { STARTER: "Starter", GROWTH: "Growth", AGENCY: "Agency" }[
        owner.subscriptionPlan
      ]
    : null;

  return (
    <main className="min-h-screen bg-[#FAFAFA] font-sans selection:bg-orange-200 selection:text-orange-900">
      {/* Background effects */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.03)_1px,transparent_1px)] bg-size-[64px_64px] mask-[radial-gradient(ellipse_80%_80%_at_50%_0%,#000_10%,transparent_100%)]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-[50%] rounded-full bg-orange-400/5 blur-[120px]" />
      </div>

      {/* Top Nav */}
      <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 text-white font-black shadow-md transition-transform group-hover:scale-105">
              RQ
            </div>
            <span className="font-black text-slate-900 tracking-tight text-lg">
              ReviewQR
            </span>
            <span className="text-xs font-bold text-slate-400 hidden sm:inline uppercase tracking-widest ml-2">
              / Billing
            </span>
          </Link>
          <UserMenu ownerName={owner.name || "Owner"} />
        </div>
      </nav>

      <div className="relative mx-auto max-w-5xl px-6 py-12 space-y-8 z-10">
        {/* Header */}
        <div className="mb-4">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Billing & Plans
          </h1>
          <p className="mt-1 text-slate-500 font-medium">
            Choose a plan that fits your business.
          </p>
        </div>

        {/* Current Status Card */}
        <div
          className={`bg-white border rounded-[2rem] p-8 shadow-sm ${
            isExpired || isCancelled
              ? "border-red-200"
              : isActive
                ? "border-emerald-200"
                : "border-orange-200"
          }`}
        >
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                Current Status
              </p>
              <h2 className="text-2xl font-black text-slate-900">
                {isActive && currentPlanName
                  ? `${currentPlanName} Plan`
                  : isTrial
                    ? "15-Day Free Trial"
                    : isExpired
                      ? "Trial Expired"
                      : "Subscription Cancelled"}
              </h2>
              {isTrial && daysLeft !== null && (
                <p className="text-sm font-medium text-slate-500 mt-1">
                  {daysLeft > 0
                    ? `${daysLeft} din baaki · Ends ${trialEndsAt}`
                    : `Trial expired on ${trialEndsAt}`}
                </p>
              )}
            </div>
            <span
              className={`text-xs font-black px-4 py-2 rounded-full border ${
                isActive
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : isTrial
                    ? "bg-orange-50 text-orange-700 border-orange-200"
                    : "bg-red-50 text-red-700 border-red-200"
              }`}
            >
              {isActive
                ? "✓ Active"
                : isTrial
                  ? `⏳ Trial${daysLeft !== null ? ` · ${daysLeft}d left` : ""}`
                  : isExpired
                    ? "✕ Expired"
                    : "✕ Cancelled"}
            </span>
          </div>

          {(isExpired || isCancelled) && (
            <div className="mt-6 p-4 bg-red-50 border border-red-100 rounded-2xl">
              <p className="text-sm font-bold text-red-800">
                Aapka QR code deactivate ho gaya hai. Subscribe karein to
                customers phir se reviews de payenge.
              </p>
            </div>
          )}
        </div>

        {/* Plans */}
        {plans.length > 0 ? (
          <BillingClient
            plans={plans}
            currentStatus={status}
            currentPlan={owner.subscriptionPlan}
            hasSubscription={!!owner.razorpaySubscriptionId}
          />
        ) : (
          <div className="bg-white border border-slate-200 rounded-[2rem] p-12 text-center shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Unable to load plans. Please refresh the page.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
