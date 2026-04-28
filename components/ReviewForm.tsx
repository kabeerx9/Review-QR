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
      <div className="anim-scale">
        <div className="card-static p-8 text-center space-y-3">
          <div className="text-4xl">🙏</div>
          <h2 className="text-xl font-bold text-white">Shukriya for your feedback!</h2>
          <p className="text-sm text-[var(--text-secondary)]">We&apos;ll work on improving. Your feedback has been shared privately with the owner.</p>
        </div>
      </div>
    );
  }

  if (step === "done_public") {
    return (
      <div className="space-y-4 anim-scale">
        <div className="card-static p-7 space-y-5">
          <div className="text-center">
            <div className="text-4xl mb-2">🎉</div>
            <h2 className="text-xl font-bold heading-accent">Shukriya!</h2>
            <p className="text-sm text-[var(--text-secondary)] mt-1">Here&apos;s your review, ready to post</p>
          </div>
          <div className="rounded-xl bg-white/[0.03] border border-[var(--border-subtle)] p-4">
            <p className="text-sm leading-relaxed text-[var(--text-secondary)] italic">&ldquo;{generatedReview}&rdquo;</p>
          </div>
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
            className="btn-main w-full py-3.5 text-base"
          >
            📋 Copy & Post on Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="anim-slide">
      <div className="card-static p-6 space-y-5">
        {/* Shop Header */}
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-lg">
            {niche === "RESTAURANT" ? "🍽️" : niche === "SALON" ? "💇" : niche === "GYM" ? "🏋️" : "🏪"}
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">{shopName}</h1>
            <p className="text-xs text-[var(--text-muted)]">{city}</p>
          </div>
        </div>

        <div className="h-px bg-[var(--border-subtle)]" />

        {/* Ratings */}
        <div className="space-y-4">
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
        </div>

        <div className="h-px bg-[var(--border-subtle)]" />

        {/* Phone */}
        <div>
          <label className="text-xs font-medium text-[var(--text-secondary)]" htmlFor="phone">
            Phone number <span className="text-[var(--text-muted)]">(optional)</span>
          </label>
          <input
            id="phone"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="+91 XXXXXXXXXX"
            className="field mt-2"
          />
        </div>

        {error && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}

        <button
          type="button"
          disabled={!isReady || step === "submitting"}
          onClick={onSubmit}
          className="btn-main w-full py-3.5 text-base"
        >
          {step === "submitting" ? "Submitting..." : "Submit Review →"}
        </button>
      </div>
    </div>
  );
}
