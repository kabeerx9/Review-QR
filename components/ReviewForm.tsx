"use client";

import StarRating from "@/components/StarRating";
import { NICHE_CATEGORIES } from "@/constants/niches";
import { useMemo, useState } from "react";

type Step = "rating" | "submitting" | "done_public" | "done_private";

interface ReviewFormProps {
  shopId: string;
  shopName: string;
  city: string;
  niche: string;
  googleReviewUrl: string;
}

async function safeJson(response: Response): Promise<Record<string, unknown>> {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return {};
  }
}

export default function ReviewForm({ shopId, shopName, city, niche, googleReviewUrl }: ReviewFormProps) {
  const [ratings, setRatings] = useState([0, 0, 0, 0]);
  const [phone, setPhone] = useState("");
  const [step, setStep] = useState<Step>("rating");
  const [generatedReview, setGeneratedReview] = useState("");
  const [error, setError] = useState("");

  const labels = useMemo(
    () => NICHE_CATEGORIES[niche] ?? ["Quality", "Cleanliness", "Service", "Experience"],
    [niche],
  );
  const isReady = ratings.every((rating) => rating >= 1);

  async function onSubmit() {
    if (!isReady) return;
    setError("");
    setStep("submitting");

    const response = await fetch("/api/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shopId, ratings, customerPhone: phone || undefined }),
    });

    const data = await safeJson(response);
    if (!response.ok) {
      setStep("rating");
      const err = typeof data.error === "string" ? data.error : "Something went wrong";
      setError(err === "shop_inactive" ? "This shop is not accepting reviews right now." : err);
      return;
    }

    if (data.status === "public") {
      setGeneratedReview(typeof data.review === "string" ? data.review : "");
      setStep("done_public");
    } else {
      setStep("done_private");
    }
  }

  if (step === "done_private") {
    return (
      <div className="transition-opacity duration-200">
        <div className="rounded-2xl border border-white/60 bg-white p-6 text-center shadow-md">
          <h2 className="text-xl font-semibold text-zinc-900">
            Shukriya for your feedback! We&apos;ll improve.
          </h2>
        </div>
      </div>
    );
  }

  if (step === "done_public") {
    return (
      <div className="space-y-4 transition-opacity duration-200">
        <div className="rounded-2xl border border-white/60 bg-white p-6 shadow-md">
          <h2 className="text-xl font-semibold text-zinc-900">Shukriya! 🙏</h2>
          <p className="mt-3 rounded-xl bg-amber-50/80 p-4 text-sm leading-relaxed text-zinc-800">
            {generatedReview}
          </p>
          <button
            type="button"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(generatedReview);
              } catch {
                // ignore clipboard failures (e.g. non-HTTPS)
              }
              if (googleReviewUrl) window.open(googleReviewUrl, "_blank", "noopener,noreferrer");
            }}
            className="mt-4 w-full rounded-xl bg-orange-500 px-4 py-3.5 text-sm font-semibold text-white shadow-sm active:scale-[0.99]"
          >
            Google par paste karein
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="transition-opacity duration-200">
      <div className="space-y-5 rounded-2xl border border-white/60 bg-white p-5 shadow-md">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">{shopName}</h1>
          <p className="text-sm text-zinc-600">{city}</p>
        </div>

        {labels.map((label, index) => (
          <StarRating
            key={label}
            label={label}
            value={ratings[index]}
            disabled={step === "submitting"}
            onChange={(value) => {
              setRatings((prev) => {
                const copy = [...prev];
                copy[index] = value;
                return copy;
              });
            }}
          />
        ))}

        <div>
          <label className="text-sm font-medium text-zinc-700" htmlFor="phone">
            Phone number (optional)
          </label>
          <input
            id="phone"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="+91XXXXXXXXXX"
            className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-3 py-3 text-base outline-none focus:ring-2 focus:ring-orange-400"
          />
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <button
          type="button"
          disabled={!isReady || step === "submitting"}
          onClick={onSubmit}
          className="w-full rounded-xl bg-orange-500 px-4 py-3.5 text-base font-semibold text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.99]"
        >
          {step === "submitting" ? "Submitting..." : "Submit"}
        </button>
      </div>
    </div>
  );
}
