"use client";

import { NICHE_LABELS } from "@/constants/niches";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";

type OnboardingStep = 1 | 2;

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<OnboardingStep>(1);
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [niche, setNiche] = useState("RESTAURANT");
  const [googleReviewUrl, setGoogleReviewUrl] = useState("");
  const [googleMapsUrl, setGoogleMapsUrl] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const nicheOptions = useMemo(() => Object.entries(NICHE_LABELS), []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const response = await fetch("/api/shop", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, city, niche, googleReviewUrl, googleMapsUrl }),
    });

    const data = await response.json();
    if (!response.ok) {
      setError(data.error || "Unable to create shop");
      setLoading(false);
      return;
    }

    router.push(`/onboarding/success?shopId=${data.shop.id}`);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
      <form onSubmit={onSubmit} className="w-full max-w-lg space-y-5 rounded-2xl border bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold">Setup your shop</h1>

        {step === 1 ? (
          <>
            <input
              type="text"
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Shop name"
              className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-400"
            />
            <input
              type="text"
              required
              value={city}
              onChange={(event) => setCity(event.target.value)}
              placeholder="City"
              className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-400"
            />
            <select
              value={niche}
              onChange={(event) => setNiche(event.target.value)}
              className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-400"
            >
              {nicheOptions.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setStep(2)}
              className="w-full rounded-xl bg-orange-500 py-2 text-sm font-semibold text-white"
            >
              Continue
            </button>
          </>
        ) : (
          <>
            <input
              type="url"
              value={googleReviewUrl}
              onChange={(event) => setGoogleReviewUrl(event.target.value)}
              placeholder="Google Review URL (optional)"
              className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-400"
            />
            <input
              type="url"
              value={googleMapsUrl}
              onChange={(event) => setGoogleMapsUrl(event.target.value)}
              placeholder="Google Maps URL (optional)"
              className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-400"
            />
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full rounded-xl border py-2 text-sm font-semibold"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-orange-500 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {loading ? "Creating..." : "Create Shop"}
              </button>
            </div>
          </>
        )}

        {error ? <p className="text-sm text-red-600">{error}</p> : null}
      </form>
    </main>
  );
}
