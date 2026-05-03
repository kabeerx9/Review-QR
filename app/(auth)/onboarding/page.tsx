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
  const [customNiche, setCustomNiche] = useState("");
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
      body: JSON.stringify({ name, city, niche, googleReviewUrl, googleMapsUrl, customNiche }),
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
    <main className="flex min-h-screen items-center justify-center bg-[#fcf8ef] px-5 py-12">
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(247,148,29,0.10)_0%,transparent_60%)]" />

      <form onSubmit={onSubmit} className="relative z-10 w-full max-w-lg space-y-6 anim-slide">
        {/* Header */}
        <div className="text-center">
          <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-linear-to-br from-orange-500/20 to-red-500/20 text-2xl">🏪</div>
          <h1 className="text-2xl font-bold text-[#22211c]">Setup your shop</h1>
          <p className="mt-1 text-sm text-[#635d54]">This takes about 30 seconds</p>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-1.5 rounded-full overflow-hidden bg-[#f2e9d7]">
            <div className={`h-full rounded-full bg-linear-to-r from-orange-500 to-red-500 transition-all duration-500 ${step === 1 ? 'w-1/2' : 'w-full'}`} />
          </div>
          <span className="text-xs font-medium text-[#81786b]">{step}/2</span>
        </div>

        <div className="rounded-3xl border border-[#e5d9c4] bg-white p-6 shadow-[0_16px_36px_rgba(34,31,28,0.08)]">
          {step === 1 ? (
            <div className="space-y-4 anim-fade">
              <p className="text-xs font-medium uppercase tracking-wider text-[#81786b]">Shop Details</p>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[#635d54]">Shop name</label>
                <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Spice Garden" className="w-full rounded-xl border border-[#e9dfce] bg-[#fffcf7] px-4 py-3 text-sm text-[#22211c] placeholder:text-[#9a8f80] outline-none transition focus:border-orange-300 focus:ring-4 focus:ring-orange-100" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[#635d54]">City</label>
                <input type="text" required value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Jaipur" className="w-full rounded-xl border border-[#e9dfce] bg-[#fffcf7] px-4 py-3 text-sm text-[#22211c] placeholder:text-[#9a8f80] outline-none transition focus:border-orange-300 focus:ring-4 focus:ring-orange-100" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[#635d54]">Business type</label>
                <select value={niche} onChange={(e) => setNiche(e.target.value)} className="w-full rounded-xl border border-[#e9dfce] bg-[#fffcf7] px-4 py-3 pr-10 text-sm text-[#22211c] outline-none transition focus:border-orange-300 focus:ring-4 focus:ring-orange-100">
                  {nicheOptions.map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              {niche === "OTHER" && (
                <div className="anim-fade">
                  <label className="mb-1.5 block text-xs font-medium text-[#635d54]">Please specify your business type</label>
                  <input type="text" required value={customNiche} onChange={(e) => setCustomNiche(e.target.value)} placeholder="e.g. Car Wash, Pet Grooming, Accounting" className="w-full rounded-xl border border-[#e9dfce] bg-[#fffcf7] px-4 py-3 text-sm text-[#22211c] placeholder:text-[#9a8f80] outline-none transition focus:border-orange-300 focus:ring-4 focus:ring-orange-100" />
                </div>
              )}
              <button type="button" onClick={() => setStep(2)} className="btn-main w-full py-3">
                Continue →
              </button>
            </div>
          ) : (
            <div className="space-y-4 anim-fade">
              <p className="text-xs font-medium uppercase tracking-wider text-[#81786b]">Google Links (Optional)</p>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[#635d54]">Google Review URL</label>
                <input type="url" value={googleReviewUrl} onChange={(e) => setGoogleReviewUrl(e.target.value)} placeholder="https://g.page/..." className="w-full rounded-xl border border-[#e9dfce] bg-[#fffcf7] px-4 py-3 text-sm text-[#22211c] placeholder:text-[#9a8f80] outline-none transition focus:border-orange-300 focus:ring-4 focus:ring-orange-100" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[#635d54]">Google Maps URL</label>
                <input type="url" value={googleMapsUrl} onChange={(e) => setGoogleMapsUrl(e.target.value)} placeholder="https://maps.google.com/..." className="w-full rounded-xl border border-[#e9dfce] bg-[#fffcf7] px-4 py-3 text-sm text-[#22211c] placeholder:text-[#9a8f80] outline-none transition focus:border-orange-300 focus:ring-4 focus:ring-orange-100" />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 rounded-full border border-[#e2d7c3] bg-[#f8f1e5] py-3 text-sm font-medium text-[#3a342c] transition hover:bg-[#f3e8d8]"
                >
                  ← Back
                </button>
                <button type="submit" disabled={loading} className="btn-main flex-1 py-3">
                  {loading ? "Creating..." : "Create Shop ✓"}
                </button>
              </div>
            </div>
          )}
        </div>

        {error && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      </form>
    </main>
  );
}
