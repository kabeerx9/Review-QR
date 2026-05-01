"use client";

import { useState } from "react";
import { Loader2, ExternalLink, AlertTriangle } from "lucide-react";

interface Plan {
  id: string;
  name: string;
  description: string;
  amount: number;
  currency: string;
  period: string;
  interval: number;
}

interface BillingClientProps {
  plans: Plan[];
  currentStatus: string;
  currentPlan: string | null;
  hasSubscription: boolean;
}

const PLAN_FEATURES: Record<string, string[]> = {
  // Fallback features based on price tier
  starter: [
    "1 Shop",
    "AI Review Generation",
    "QR Code",
    "Bad Review Interception",
    "WhatsApp Alerts",
  ],
  growth: [
    "Up to 3 Shops",
    "Everything in Starter",
    "Google Auto-Reply",
    "Customer Recovery Flow",
    "Priority Support",
  ],
  agency: [
    "Unlimited Shops",
    "Everything in Growth",
    "Competitor Benchmarking",
    "White-label QR Pages",
    "Dedicated Support",
  ],
};

const PLAN_BADGES: Record<string, string> = {
  starter: "",
  growth: "Most Popular",
  agency: "Best Value",
};

function getTier(amount: number): string {
  if (amount <= 499) return "starter";
  if (amount <= 999) return "growth";
  return "agency";
}

export default function BillingClient({
  plans,
  currentStatus,
  currentPlan,
  hasSubscription,
}: BillingClientProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const handleSubscribe = async (planId: string) => {
    setLoading(planId);
    try {
      const res = await fetch("/api/subscription/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || data.error || "Failed to create subscription");
        return;
      }

      // Redirect to Razorpay hosted checkout
      if (data.shortUrl) {
        window.location.href = data.shortUrl;
      }
    } catch {
      alert("Network error. Please try again.");
    } finally {
      setLoading(null);
    }
  };

  const handleCancel = async () => {
    setCancelling(true);
    try {
      const res = await fetch("/api/subscription/cancel", {
        method: "POST",
      });

      if (!res.ok) {
        alert("Failed to cancel subscription");
        return;
      }

      window.location.reload();
    } catch {
      alert("Network error. Please try again.");
    } finally {
      setCancelling(false);
      setShowCancelConfirm(false);
    }
  };

  return (
    <>
      {/* Plan Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        {plans.map((plan) => {
          const tier = getTier(plan.amount);
          const features = PLAN_FEATURES[tier] || PLAN_FEATURES.starter;
          const badge = PLAN_BADGES[tier];
          const isCurrentPlan =
            currentStatus === "ACTIVE" &&
            currentPlan === tier.toUpperCase();
          const isPopular = tier === "growth";

          return (
            <div
              key={plan.id}
              className={`relative bg-white border rounded-[2rem] p-8 shadow-sm flex flex-col transition-all hover:shadow-md ${
                isPopular
                  ? "border-orange-300 ring-2 ring-orange-100"
                  : "border-slate-200"
              }`}
            >
              {badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-orange-500 text-white text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-md">
                    {badge}
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-lg font-black text-slate-900 mb-1">
                  {plan.name}
                </h3>
                {plan.description && (
                  <p className="text-xs font-medium text-slate-500">
                    {plan.description}
                  </p>
                )}
              </div>

              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-slate-900">
                    ₹{plan.amount}
                  </span>
                  <span className="text-sm font-bold text-slate-400">
                    /{plan.period}
                  </span>
                </div>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-center gap-3 text-sm font-medium text-slate-600"
                  >
                    <svg
                      className="w-4 h-4 text-emerald-500 shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2.5}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4.5 12.75l6 6 9-13.5"
                      />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>

              {isCurrentPlan ? (
                <button
                  disabled
                  className="w-full py-3.5 rounded-xl bg-emerald-50 text-emerald-700 text-sm font-black border border-emerald-200 cursor-default"
                >
                  Current Plan ✓
                </button>
              ) : (
                <button
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={loading !== null}
                  className={`w-full py-3.5 rounded-xl text-sm font-black transition-all flex items-center justify-center gap-2 ${
                    isPopular
                      ? "bg-orange-500 text-white hover:bg-orange-600 shadow-[0_8px_30px_rgba(249,115,22,0.3)]"
                      : "bg-slate-900 text-white hover:bg-slate-800 shadow-md"
                  } disabled:opacity-50`}
                >
                  {loading === plan.id ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      Subscribe
                      <ExternalLink className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Cancel Subscription Section */}
      {hasSubscription && currentStatus === "ACTIVE" && (
        <div className="mt-8 bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-black text-slate-900">
                Cancel Subscription
              </p>
              <p className="text-xs font-medium text-slate-500 mt-1">
                Your QR codes and dashboard will be deactivated immediately
              </p>
            </div>
            <button
              onClick={() => setShowCancelConfirm(true)}
              className="px-5 py-2.5 rounded-xl border border-red-200 bg-red-50 text-sm font-bold text-red-600 hover:bg-red-100 transition-colors"
            >
              Cancel Plan
            </button>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 px-5 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-red-200 bg-white p-8 text-center shadow-2xl">
            <div className="w-16 h-16 mx-auto bg-red-50 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-xl font-black text-slate-900 mb-2">
              Cancel karna chahte hain?
            </h2>
            <p className="text-sm font-medium text-slate-500 mb-6">
              Aapka QR code aur dashboard access turant band ho jayega.
              Customers review nahi de payenge.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelConfirm(false)}
                className="flex-1 py-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Nahi, rakhein
              </button>
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="flex-1 py-3 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {cancelling ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Cancelling...
                  </>
                ) : (
                  "Haan, cancel karein"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
