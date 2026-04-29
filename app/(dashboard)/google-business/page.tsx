"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Building2, MapPin, RefreshCw, AlertCircle, ChevronRight, ArrowLeft, Loader2 } from "lucide-react";

interface Location {
  name: string;
  title: string;
  storefrontAddress?: {
    addressLines?: string[];
    locality?: string;
    administrativeArea?: string;
  };
}

interface Account {
  name: string;
  accountName: string;
  type: string;
  role: string;
  locations: Location[];
  locationError?: string;
}

interface ApiResponse {
  accounts?: Account[];
  error?: string;
  message?: string;
}

export default function GoogleBusinessPage() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/google-business/accounts");
      const json = await res.json();

      if (!res.ok) {
        if (json.error === "google_not_connected") {
          setError("Google Business not connected. Please connect from the dashboard first.");
        } else {
          setError(json.message || json.error || "Failed to fetch data");
        }
        return;
      }

      setData(json);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatAddress = (loc: Location) => {
    const parts: string[] = [];
    if (loc.storefrontAddress?.addressLines) {
      parts.push(...loc.storefrontAddress.addressLines);
    }
    if (loc.storefrontAddress?.locality) {
      parts.push(loc.storefrontAddress.locality);
    }
    if (loc.storefrontAddress?.administrativeArea) {
      parts.push(loc.storefrontAddress.administrativeArea);
    }
    return parts.join(", ") || "No address";
  };

  return (
    <main className="min-h-screen bg-[#FAFAFA] font-sans selection:bg-orange-200 selection:text-orange-900">
      {/* Background effects */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.03)_1px,transparent_1px)] bg-size-[64px_64px] mask-[radial-gradient(ellipse_80%_80%_at_50%_0%,#000_10%,transparent_100%)]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-[50%] rounded-full bg-blue-400/5 blur-[120px]" />
      </div>

      {/* Top Nav */}
      <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-bold">Dashboard</span>
            </Link>
            <span className="text-slate-300">/</span>
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-600" />
              <span className="font-black text-slate-900 tracking-tight">Google Business</span>
            </div>
          </div>
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </nav>

      <div className="relative mx-auto max-w-6xl px-6 py-10 space-y-8 z-10">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Google Business Profile</h1>
          <p className="mt-1 text-slate-500 font-medium">
            Your connected accounts and business locations from Google.
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="bg-white border border-slate-200 rounded-4xl p-16 text-center shadow-sm">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
            <p className="text-sm font-bold text-slate-600">Fetching your Google Business data...</p>
            <p className="text-xs text-slate-400 mt-1">This may take a few seconds</p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="bg-white border border-red-200 rounded-4xl p-12 text-center shadow-sm">
            <div className="w-16 h-16 mx-auto bg-red-50 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-lg font-black text-slate-900 mb-2">Something went wrong</h2>
            <p className="text-sm font-medium text-slate-500 max-w-md mx-auto mb-6">{error}</p>
            <button
              onClick={fetchData}
              className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-6 py-3 text-sm font-bold text-white hover:bg-slate-800 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
          </div>
        )}

        {/* Data */}
        {!loading && !error && data && (
          <>
            {(!data.accounts || data.accounts.length === 0) ? (
              <div className="bg-white border border-slate-200 rounded-4xl p-16 text-center shadow-sm">
                <div className="w-16 h-16 mx-auto bg-blue-50 rounded-full flex items-center justify-center mb-4">
                  <Building2 className="w-8 h-8 text-blue-500" />
                </div>
                <h2 className="text-lg font-black text-slate-900 mb-2">No accounts found</h2>
                <p className="text-sm font-medium text-slate-500 max-w-md mx-auto">
                  No Google Business accounts are linked to this Google account. 
                  Make sure you&apos;re signed into the correct Google account that manages your business.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Summary */}
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                  <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Accounts</p>
                    <p className="text-4xl font-black text-slate-900">{data.accounts.length}</p>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Total Locations</p>
                    <p className="text-4xl font-black text-blue-600">
                      {data.accounts.reduce((sum, acc) => sum + (acc.locations?.length || 0), 0)}
                    </p>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm col-span-2 md:col-span-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Status</p>
                    <p className="text-lg font-black text-emerald-600 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                      Connected
                    </p>
                  </div>
                </div>

                {/* Accounts */}
                {data.accounts.map((account) => (
                  <section
                    key={account.name}
                    className="bg-white border border-slate-200 rounded-4xl shadow-sm overflow-hidden"
                  >
                    {/* Account Header */}
                    <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-center shadow-inner">
                          <Building2 className="w-6 h-6 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-black text-slate-900 truncate">
                            {account.accountName}
                          </h3>
                          <div className="flex items-center gap-3 mt-0.5">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                              {account.type}
                            </span>
                            <span className="text-slate-300">·</span>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                              {account.role}
                            </span>
                            <span className="text-slate-300">·</span>
                            <span className="text-[10px] font-mono text-slate-400">
                              {account.name}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Locations */}
                    <div className="p-6">
                      {account.locationError ? (
                        <div className="flex items-center gap-3 p-4 rounded-2xl bg-amber-50 border border-amber-200">
                          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                          <p className="text-sm font-medium text-amber-800">{account.locationError}</p>
                        </div>
                      ) : account.locations.length === 0 ? (
                        <div className="text-center py-8">
                          <MapPin className="w-6 h-6 text-slate-300 mx-auto mb-2" />
                          <p className="text-sm font-medium text-slate-400">No locations found for this account</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">
                            {account.locations.length} Location{account.locations.length !== 1 ? "s" : ""}
                          </p>
                          {account.locations.map((loc) => (
                            <div
                              key={loc.name}
                              className="group flex items-center justify-between p-4 rounded-2xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all"
                            >
                              <div className="flex items-center gap-4 min-w-0">
                                <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center group-hover:bg-blue-100 transition-colors shrink-0">
                                  <MapPin className="w-5 h-5 text-slate-500 group-hover:text-blue-600 transition-colors" />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-black text-slate-900 truncate">{loc.title}</p>
                                  <p className="text-xs font-medium text-slate-500 truncate">{formatAddress(loc)}</p>
                                  <p className="text-[10px] font-mono text-slate-400 mt-0.5">{loc.name}</p>
                                </div>
                              </div>
                              <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 shrink-0 transition-colors" />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </section>
                ))}

                {/* Raw JSON for debugging */}
                <details className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
                  <summary className="p-6 text-sm font-bold text-slate-500 cursor-pointer hover:text-slate-700 transition-colors">
                    🔍 Raw API Response (Debug)
                  </summary>
                  <div className="px-6 pb-6">
                    <pre className="bg-slate-900 text-slate-100 p-4 rounded-2xl text-xs overflow-x-auto font-mono leading-relaxed max-h-96">
                      {JSON.stringify(data, null, 2)}
                    </pre>
                  </div>
                </details>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
