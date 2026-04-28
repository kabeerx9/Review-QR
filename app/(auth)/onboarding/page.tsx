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
    <main className="flex min-h-screen items-center justify-center bg-[var(--bg-primary)] px-5 py-12">
      <div className="fixed inset-0 bg-noise pointer-events-none" />

      <form onSubmit={onSubmit} className="relative z-10 w-full max-w-lg space-y-6 anim-slide">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500/20 to-red-500/20 text-2xl mb-3">🏪</div>
          <h1 className="text-2xl font-bold text-white">Setup your shop</h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">This takes about 30 seconds</p>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-1.5 rounded-full overflow-hidden bg-white/[0.06]">
            <div className={`h-full rounded-full bg-gradient-to-r from-orange-500 to-red-500 transition-all duration-500 ${step === 1 ? 'w-1/2' : 'w-full'}`} />
          </div>
          <span className="text-xs font-medium text-[var(--text-muted)]">{step}/2</span>
        </div>

        <div className="card-static p-6">
          {step === 1 ? (
            <div className="space-y-4 anim-fade">
              <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">Shop Details</p>
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Shop name</label>
                <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Spice Garden" className="field" />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">City</label>
                <input type="text" required value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Jaipur" className="field" />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Business type</label>
                <select value={niche} onChange={(e) => setNiche(e.target.value)} className="field">
                  {nicheOptions.map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              <button type="button" onClick={() => setStep(2)} className="btn-main w-full py-3">
                Continue →
              </button>
            </div>
          ) : (
            <div className="space-y-4 anim-fade">
              <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">Google Links (Optional)</p>
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Google Review URL</label>
                <input type="url" value={googleReviewUrl} onChange={(e) => setGoogleReviewUrl(e.target.value)} placeholder="https://g.page/..." className="field" />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Google Maps URL</label>
                <input type="url" value={googleMapsUrl} onChange={(e) => setGoogleMapsUrl(e.target.value)} placeholder="https://maps.google.com/..." className="field" />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setStep(1)} className="btn-ghost flex-1 py-3">← Back</button>
                <button type="submit" disabled={loading} className="btn-main flex-1 py-3">
                  {loading ? "Creating..." : "Create Shop ✓"}
                </button>
              </div>
            </div>
          )}
        </div>

        {error && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}
      </form>
    </main>
  );
}
