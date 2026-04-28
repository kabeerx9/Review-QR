"use client";

import { NICHE_LABELS } from "@/constants/niches";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useMemo, useState } from "react";

type OnboardingStep = 1 | 2 | 3;

interface GoogleLocation {
  locationId: string;
  title: string;
  address: string;
  placeId: string | null;
  googleMapsUrl: string;
  googleReviewUrl: string;
}

function OnboardingPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [step, setStep] = useState<OnboardingStep>(1);
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [niche, setNiche] = useState("RESTAURANT");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [locationsLoading, setLocationsLoading] = useState(false);
  const [locations, setLocations] = useState<GoogleLocation[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<GoogleLocation | null>(null);

  const nicheOptions = useMemo(() => Object.entries(NICHE_LABELS), []);

  useEffect(() => {
    const savedName = sessionStorage.getItem("onboarding_name");
    const savedCity = sessionStorage.getItem("onboarding_city");
    const savedNiche = sessionStorage.getItem("onboarding_niche");

    if (savedName) setName(savedName);
    if (savedCity) setCity(savedCity);
    if (savedNiche) setNiche(savedNiche);
  }, []);

  useEffect(() => {
    const stepParam = searchParams.get("step");
    const googleError = searchParams.get("google_error");

    if (googleError) {
      setError(
        googleError === "access_denied"
          ? "You denied Google access. This is required to verify your business ownership."
          : googleError === "invalid_state"
            ? "The Google verification session expired or was invalid. Please try connecting again."
            : "Something went wrong connecting to Google. Please try again.",
      );
      setStep(2);
      return;
    }

    if (stepParam === "3") {
      setStep(3);
    }
  }, [searchParams]);

  useEffect(() => {
    if (step !== 3) {
      return;
    }

    let cancelled = false;

    async function loadLocations() {
      setLocationsLoading(true);
      setError("");

      try {
        const response = await fetch("/api/businesses", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || data.error || "Failed to load Google Business locations.",
          );
        }

        if (cancelled) {
          return;
        }

        const nextLocations = Array.isArray(data.locations) ? data.locations : [];
        setLocations(nextLocations);
        setSelectedLocation((current) => {
          if (!current) {
            return nextLocations[0] ?? null;
          }

          return (
            nextLocations.find(
              (location: GoogleLocation) => location.locationId === current.locationId,
            ) ?? nextLocations[0] ?? null
          );
        });
      } catch (loadError) {
        if (cancelled) {
          return;
        }

        setLocations([]);
        setSelectedLocation(null);
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Failed to load your Google Business locations. Please try again.",
        );
      } finally {
        if (!cancelled) {
          setLocationsLoading(false);
        }
      }
    }

    void loadLocations();

    return () => {
      cancelled = true;
    };
  }, [step]);

  function goToStep2() {
    if (!name.trim() || !city.trim()) {
      setError("Please fill in all fields.");
      return;
    }

    setError("");
    setStep(2);
  }

  function connectGoogle() {
    sessionStorage.setItem("onboarding_name", name);
    sessionStorage.setItem("onboarding_city", city);
    sessionStorage.setItem("onboarding_niche", niche);
    window.location.href = "/api/auth/google";
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedLocation) {
      setError("Please select your business from the list.");
      return;
    }

    setLoading(true);
    setError("");

    const response = await fetch("/api/shop", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        city,
        niche,
        googleLocationId: selectedLocation.locationId,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      setError(data.message || data.error || "Unable to create shop");
      setLoading(false);
      return;
    }

    sessionStorage.removeItem("onboarding_name");
    sessionStorage.removeItem("onboarding_city");
    sessionStorage.removeItem("onboarding_niche");

    router.push(`/onboarding/success?shopId=${data.shop.id}`);
  }

  const progressPercent = step === 1 ? "w-1/3" : step === 2 ? "w-2/3" : "w-full";

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#FAFAFA] px-5 py-12 font-sans">
      <div className="fixed inset-0 pointer-events-none bg-[linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.03)_1px,transparent_1px)] bg-[size:64px_64px]" />
      <div className="fixed top-0 left-1/2 h-[40%] w-[60%] -translate-x-1/2 rounded-full bg-orange-400/10 blur-[120px] pointer-events-none" />

      <form onSubmit={onSubmit} className="relative z-10 w-full max-w-lg space-y-6">
        <div className="text-center">
          <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-orange-200 bg-orange-100 text-3xl shadow-inner">
            {step === 1 ? "🏪" : step === 2 ? "🔗" : "✅"}
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            {step === 1 && "Tell us about your shop"}
            {step === 2 && "Verify you own this business"}
            {step === 3 && "Select your Google Business"}
          </h1>
          <p className="mt-1 text-sm font-medium text-slate-500">
            {step === 1 && "Quick setup, about 60 seconds."}
            {step === 2 && "Required to generate your QR code and enable AI replies."}
            {step === 3 && "Choose the exact location from your Google account."}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200">
            <div
              className={`h-full rounded-full bg-gradient-to-r from-orange-500 to-red-500 transition-all duration-500 ${progressPercent}`}
            />
          </div>
          <span className="text-xs font-black uppercase tracking-widest text-slate-400">
            Step {step}/3
          </span>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-lg">
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-400">
                  Shop Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Spice Garden"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium text-slate-900 transition-all placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-400">
                  City
                </label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Jaipur"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium text-slate-900 transition-all placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-400">
                  Business Type
                </label>
                <select
                  value={niche}
                  onChange={(e) => setNiche(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium text-slate-900 transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  {nicheOptions.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label as string}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={goToStep2}
                className="w-full rounded-xl bg-slate-900 py-4 font-bold text-white shadow-md transition-colors hover:bg-slate-800"
              >
                Continue →
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-start gap-4 rounded-xl border border-blue-100 bg-blue-50 p-4">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100">
                    <svg
                      className="h-4 w-4 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-blue-900">Why is this required?</p>
                    <p className="mt-1 text-xs font-medium leading-relaxed text-blue-700">
                      We verify you are the actual Google Business owner. No fake
                      businesses. Your account also enables our AI to automatically post
                      replies to your Google reviews on your behalf.
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  {[
                    "Verify your business is real and you own it",
                    "Enable AI to auto-reply to your Google reviews",
                    "Unlock your personalised QR code",
                  ].map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-3 text-sm font-medium text-slate-700"
                    >
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                        <svg
                          className="h-3 w-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="3"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={connectGoogle}
                className="flex w-full items-center justify-center gap-3 rounded-xl border-2 border-slate-200 bg-white py-4 font-bold text-slate-800 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Connect Google Business Account
              </button>

              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full py-3 text-sm font-bold text-slate-500 transition-colors hover:text-slate-700"
              >
                ← Back
              </button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              {locationsLoading ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-10 text-center">
                  <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-orange-500" />
                  <h3 className="font-bold text-slate-900">
                    Loading your Google Businesses
                  </h3>
                  <p className="mt-2 text-sm text-slate-500">
                    Verifying the businesses linked to your connected Google account.
                  </p>
                </div>
              ) : locations.length === 0 ? (
                <div className="py-8 text-center">
                  <div className="mb-3 text-4xl">😕</div>
                  <h3 className="mb-2 font-bold text-slate-900">No businesses found</h3>
                  <p className="mb-6 text-sm text-slate-500">
                    The connected Google account has no Google Business Profile.
                    Make sure you&apos;ve created and verified your business on Google.
                  </p>
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="rounded-xl bg-slate-100 px-6 py-2.5 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-200"
                  >
                    ← Try a different account
                  </button>
                </div>
              ) : (
                <>
                  <p className="mb-4 text-xs font-black uppercase tracking-widest text-slate-400">
                    {locations.length} verified{" "}
                    {locations.length === 1 ? "business" : "businesses"} found
                  </p>

                  <div className="max-h-80 space-y-3 overflow-y-auto pr-1">
                    {locations.map((loc) => (
                      <button
                        key={loc.locationId}
                        type="button"
                        onClick={() => setSelectedLocation(loc)}
                        className={`w-full rounded-2xl border-2 p-4 text-left transition-all ${
                          selectedLocation?.locationId === loc.locationId
                            ? "border-orange-500 bg-orange-50"
                            : "border-slate-200 bg-slate-50 hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                              selectedLocation?.locationId === loc.locationId
                                ? "border-orange-500 bg-orange-500"
                                : "border-slate-300"
                            }`}
                          >
                            {selectedLocation?.locationId === loc.locationId && (
                              <svg
                                className="h-3 w-3 text-white"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="3"
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-slate-900">{loc.title}</p>
                            {loc.address && (
                              <p className="mt-0.5 text-xs font-medium text-slate-500">
                                {loc.address}
                              </p>
                            )}
                            <div className="mt-3 flex flex-wrap gap-2">
                              {loc.googleMapsUrl && (
                                <span className="rounded-full bg-slate-900 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-white">
                                  Maps linked
                                </span>
                              )}
                              {loc.googleReviewUrl && (
                                <span className="rounded-full bg-orange-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-orange-700">
                                  Review link ready
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>

                  <button
                    type="submit"
                    disabled={!selectedLocation || loading}
                    className="mt-2 w-full rounded-xl bg-orange-500 py-4 font-bold text-white shadow-[0_4px_14px_rgba(249,115,22,0.35)] transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loading ? "Generating QR Code..." : "Generate My QR Code →"}
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}
      </form>
    </main>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#FAFAFA] px-5 py-12 font-sans">
          <div className="rounded-3xl border border-slate-200 bg-white px-8 py-10 text-center shadow-lg">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-orange-500" />
            <p className="font-medium text-slate-600">Loading onboarding...</p>
          </div>
        </main>
      }
    >
      <OnboardingPageContent />
    </Suspense>
  );
}
