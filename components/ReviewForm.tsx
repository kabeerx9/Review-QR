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

    const data = await response.json();
    if (!response.ok) {
      setStep("rating");
      setError(data.error || "Something went wrong");
      return;
    }

    if (data.status === "public") {
      setGeneratedReview(data.review || "");
      setStep("done_public");
    } else {
      setStep("done_private");
    }
  }

  if (step === "done_private") {
    return (
      <div className="rounded-2xl border bg-white p-6 text-center shadow-sm">
        <h2 className="text-xl font-semibold">Shukriya for your feedback! We&apos;ll improve.</h2>
      </div>
    );
  }

  if (step === "done_public") {
    return (
      <div className="space-y-4 rounded-2xl border bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold">Shukriya! 🙏</h2>
        <p className="rounded-xl bg-zinc-50 p-4 text-sm text-zinc-700">{generatedReview}</p>
        <button
          type="button"
          onClick={async () => {
            await navigator.clipboard.writeText(generatedReview);
            if (googleReviewUrl) window.open(googleReviewUrl, "_blank", "noopener,noreferrer");
          }}
          className="w-full rounded-xl bg-orange-500 px-4 py-3 text-sm font-semibold text-white"
        >
          Copy & Open Google
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5 rounded-2xl border bg-white p-5 shadow-sm">
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
          className="mt-2 w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-400"
        />
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <button
        type="button"
        disabled={!isReady || step === "submitting"}
        onClick={onSubmit}
        className="w-full rounded-xl bg-orange-500 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        {step === "submitting" ? "Submitting..." : "Submit"}
      </button>
    </div>
  );
}
