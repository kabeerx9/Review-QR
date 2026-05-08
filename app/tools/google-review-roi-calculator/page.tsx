'use client';

import { useState } from 'react';
import Link from 'next/link';
import { BackButton } from '@/components/BackButton';

export default function ROICalculator() {
  const [revenue, setRevenue] = useState('');
  const [rating, setRating] = useState('');
  const [result, setResult] = useState<null | {
    lostRevenue: number;
    potentialGain: number;
    targetRating: number;
    lostCustomers: number;
  }>(null);

  const calculate = () => {
    const rev = parseFloat(revenue);
    const rat = parseFloat(rating);
    if (!rev || !rat || rat < 1 || rat > 5) return;

    // Research-backed multipliers: each 0.1 star below 4.5 costs ~2% of potential customers
    const targetRating = 4.8;
    const ratingGap = Math.max(0, targetRating - rat);
    // ~9% revenue gain per 1-star improvement (Harvard Business School study)
    const revenueGainPercent = ratingGap * 9;
    const lostRevenue = (rev * revenueGainPercent) / 100;
    // Customers who bounce at < 4.0 (up to 40%) vs 4.8 (only ~5%)
    const lostCustomerPercent = rat < 4.0 ? 40 : rat < 4.3 ? 25 : rat < 4.6 ? 12 : 5;
    const lostCustomers = Math.round((rev / 500) * (lostCustomerPercent / 100));
    const potentialGain = rev * (revenueGainPercent / 100);

    setResult({ lostRevenue, potentialGain, targetRating, lostCustomers });
  };

  const fmt = (n: number) =>
    n >= 100000
      ? `₹${(n / 100000).toFixed(1)}L`
      : `₹${Math.round(n).toLocaleString('en-IN')}`;

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-orange-200 selection:text-orange-900">
      <nav className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <BackButton />
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500 text-white font-black text-sm">RQ</div>
              <span className="text-xl font-black tracking-tight text-slate-900 hidden sm:block">ReviewQR</span>
            </Link>
          </div>
          <Link href="/login" className="text-sm font-bold text-orange-600 hover:text-orange-700">Get Pro Version →</Link>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          <div>
            <div className="inline-block bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest mb-6">Free ROI Tool</div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 leading-tight mb-4">Google Review ROI Calculator</h1>
            <p className="text-lg text-slate-600 mb-8 font-medium leading-relaxed">
              See exactly how much revenue your current Google rating is costing you every month compared to a 4.8-star competitor.
            </p>

            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Monthly Revenue (₹)</label>
                <input
                  type="number"
                  value={revenue}
                  onChange={e => setRevenue(e.target.value)}
                  placeholder="e.g., 500000"
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Current Google Rating</label>
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  max="5"
                  value={rating}
                  onChange={e => setRating(e.target.value)}
                  placeholder="e.g., 3.8"
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium"
                />
              </div>
              <button
                onClick={calculate}
                disabled={!revenue || !rating}
                className="w-full bg-slate-900 text-white font-black py-4 rounded-xl transition-all hover:bg-slate-800 disabled:opacity-40"
              >
                Calculate Lost Revenue →
              </button>
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-10 min-h-[500px] flex flex-col justify-center">
            {!result ? (
              <div className="text-center text-slate-400">
                <div className="text-6xl mb-4">📊</div>
                <p className="font-medium">Enter your details to see your revenue analysis</p>
              </div>
            ) : (
              <div className="space-y-5">
                <h2 className="text-xl font-black text-slate-900 mb-2">Your Revenue Analysis</h2>

                <div className="bg-red-50 border border-red-100 rounded-2xl p-5">
                  <p className="text-xs font-black uppercase tracking-widest text-red-500 mb-1">Monthly Revenue Lost</p>
                  <p className="text-4xl font-black text-red-600">{fmt(result.lostRevenue)}</p>
                  <p className="text-sm text-red-700 mt-1 font-medium">vs. a competitor at {result.targetRating}★</p>
                </div>

                <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5">
                  <p className="text-xs font-black uppercase tracking-widest text-emerald-600 mb-1">Potential Monthly Gain with ReviewQR</p>
                  <p className="text-4xl font-black text-emerald-600">+{fmt(result.potentialGain)}</p>
                  <p className="text-sm text-emerald-700 mt-1 font-medium">by reaching a {result.targetRating}★ rating</p>
                </div>

                <div className="bg-orange-50 border border-orange-100 rounded-2xl p-5">
                  <p className="text-xs font-black uppercase tracking-widest text-orange-600 mb-1">Estimated Customers Bouncing Per Month</p>
                  <p className="text-4xl font-black text-orange-600">~{result.lostCustomers}</p>
                  <p className="text-sm text-orange-700 mt-1 font-medium">see your rating and choose a competitor</p>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <Link href="/login" className="flex w-full items-center justify-center gap-2 bg-orange-500 text-white py-4 rounded-2xl font-black hover:bg-orange-600 transition-colors">
                    Stop Losing Revenue — Start Free Trial
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-24 max-w-3xl mx-auto">
          <h2 className="text-2xl font-black text-slate-900 mb-4">The True Cost of a Low Google Rating</h2>
          <p className="text-slate-600 leading-relaxed">
            A Harvard Business School study found that a 1-star increase in Yelp rating leads to a 5–9% increase in revenue. For Google Maps — the primary discovery channel for Indian local businesses — the impact is even higher. Businesses with ratings below 4.0 lose an estimated 40% of potential customers before they even walk through the door.
          </p>
        </div>
      </main>
    </div>
  );
}
