"use client";

import StarRating from "@/components/StarRating";
import { NICHE_CATEGORIES } from "@/constants/niches";
import { useMemo, useState, useEffect } from "react";

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
  const [generatedReviews, setGeneratedReviews] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [error, setError] = useState("");
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [regenerateCount, setRegenerateCount] = useState(0);
  const [hasSaved, setHasSaved] = useState(false);

  const labels = useMemo(
    () => NICHE_CATEGORIES[niche] ?? ["Quality", "Cleanliness", "Service", "Experience"],
    [niche],
  );
  const isReady = ratings.some((rating) => rating >= 1);

  useEffect(() => {
    if (ratings.every(r => r >= 1) && step === "rating") {
      onSubmit(ratings);
    }
  }, [ratings, step]);

  async function onSubmit(overrideRatings?: number[]) {
    const finalRatings = overrideRatings || ratings;
    const isReadyNow = finalRatings.some((r) => r >= 1);
    if (!isReadyNow) return;
    setError("");
    setStep("submitting");

    const response = await fetch("/api/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shopId, ratings: finalRatings, customerPhone: phone || undefined }),
    });

    const data = await safeJson(response);
    if (!response.ok) {
      setStep("rating");
      const err = typeof data.error === "string" ? data.error : "Something went wrong";
      setError(err === "shop_inactive" ? "This shop is not accepting reviews right now." : err);
      return;
    }

    if (data.status === "public") {
      setGeneratedReviews([typeof data.review === "string" ? data.review : ""]);
      setCurrentIndex(0);
      setStep("done_public");
    } else {
      setStep("done_private");
    }
  }

  async function onRegenerate() {
    setIsRegenerating(true);
    setError("");

    try {
      const response = await fetch("/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shopId, ratings, customerPhone: phone || undefined, regenerate: true }),
      });

      const data = await safeJson(response);
      if (!response.ok) {
        const err = typeof data.error === "string" ? data.error : "Failed to regenerate";
        setError(err);
      } else if (data.status === "public") {
        setGeneratedReviews(prev => [...prev, typeof data.review === "string" ? data.review : ""]);
        setCurrentIndex(prev => prev + 1);
        setRegenerateCount((prev) => prev + 1);
      }
    } catch (e) {
      setError("Something went wrong");
    } finally {
      setIsRegenerating(false);
    }
  }

  if (step === "done_private") {
    return (
      <div className="anim-scale">
        <div className="bg-white border border-slate-200 rounded-[2rem] p-8 text-center space-y-4 shadow-sm">
          <div className="text-5xl">🙏</div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Shukriya for your feedback!</h2>
          <p className="text-sm font-medium text-slate-500">We&apos;ll work on improving. Your feedback has been shared privately with the owner.</p>
        </div>
      </div>
    );
  }

  if (step === "done_public") {
    return (
      <div className="space-y-4 anim-scale">
        <div className="bg-white border border-slate-200 rounded-[2rem] p-8 space-y-6 shadow-sm">
          <div className="text-center">
            <div className="text-5xl mb-3">🎉</div>
            <h2 className="text-2xl font-black heading-accent tracking-tight">Shukriya!</h2>
            <p className="text-sm font-medium text-slate-500 mt-2">Here&apos;s your review, ready to post</p>
          </div>
          
          <div className="flex items-center justify-between mb-2 px-2">
            <button 
              type="button"
              onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))} 
              disabled={currentIndex === 0}
              className="p-2 text-slate-400 hover:text-slate-800 disabled:opacity-30 transition-colors rounded-xl hover:bg-slate-100 font-bold"
            >
              ← Prev
            </button>
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full uppercase tracking-wider">
              Option {currentIndex + 1} of {generatedReviews.length}
            </span>
            <button 
              type="button"
              onClick={() => setCurrentIndex(prev => Math.min(generatedReviews.length - 1, prev + 1))} 
              disabled={currentIndex === generatedReviews.length - 1}
              className="p-2 text-slate-400 hover:text-slate-800 disabled:opacity-30 transition-colors rounded-xl hover:bg-slate-100 font-bold"
            >
              Next →
            </button>
          </div>
          
          <div className="rounded-2xl bg-slate-50 border border-slate-200 p-5 relative overflow-hidden focus-within:border-orange-500 focus-within:bg-white transition-all shadow-inner">
            {isRegenerating && (
              <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center z-10">
                <span className="text-sm font-bold text-slate-800 animate-pulse">Generating...</span>
              </div>
            )}
            <textarea
              value={generatedReviews[currentIndex] || ""}
              onChange={(e) => {
                const newText = e.target.value;
                setGeneratedReviews(prev => {
                  const copy = [...prev];
                  copy[currentIndex] = newText;
                  return copy;
                });
              }}
              className="w-full bg-transparent text-sm md:text-base leading-relaxed text-slate-700 italic resize-none outline-none min-h-[120px] font-medium"
            />
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-center font-bold">{error}</p>}

          <div className="space-y-3 pt-2">
            <button
              type="button"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(generatedReviews[currentIndex] || "");
                } catch {
                  // ignore clipboard failures (e.g. non-HTTPS)
                }
                
                if (!hasSaved) {
                  setHasSaved(true);
                  fetch("/api/review/save", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      shopId,
                      ratings,
                      customerPhone: phone || undefined,
                      generatedReview: generatedReviews[currentIndex],
                    }),
                  }).catch(console.error);
                }

                if (googleReviewUrl) window.open(googleReviewUrl, "_blank", "noopener,noreferrer");
              }}
              className="btn-main w-full py-3.5 text-base"
            >
              📋 Copy & Post on Google
            </button>
            
            {regenerateCount < 3 && (
              <button
                type="button"
                onClick={onRegenerate}
                disabled={isRegenerating}
                className="w-full py-3.5 text-sm font-bold flex items-center justify-center gap-2 text-slate-500 hover:text-slate-900 transition-all bg-slate-100 rounded-full hover:bg-slate-200"
              >
                🔄 {isRegenerating ? "Regenerating..." : "Generate Another"}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="anim-slide">
      <div className="bg-white border border-slate-200 rounded-[2rem] p-8 space-y-6 shadow-sm">
        {/* Shop Header */}
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-2xl shadow-inner">
            {niche === "RESTAURANT" ? "🍽️" : niche === "SALON" ? "💇" : niche === "GYM" ? "🏋️" : "🏪"}
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">{shopName}</h1>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">{city}</p>
          </div>
        </div>

        <div className="h-px bg-slate-100" />

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

        <div className="h-px bg-slate-100" />

        {/* Phone */}
        <div>
          <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-2" htmlFor="phone">
            Phone number <span className="text-slate-300 normal-case tracking-normal font-medium">(optional)</span>
          </label>
          <input
            id="phone"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="+91 XXXXXXXXXX"
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all font-medium text-slate-900"
          />
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-center font-bold">{error}</p>}

        <button
          type="button"
          disabled={!isReady || step === "submitting"}
          onClick={() => onSubmit()}
          className="btn-main w-full py-3.5 text-base"
        >
          {step === "submitting" ? "Submitting..." : "Submit Review →"}
        </button>
      </div>
    </div>
  );
}
