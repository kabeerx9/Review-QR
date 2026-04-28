"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
}

function calcTimeLeft(trialEndsAt: string): TimeLeft {
  const diff = new Date(trialEndsAt).getTime() - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
  return {
    total: diff,
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

// ── Nav badge (compact) ────────────────────────────────────────────────────
export function TrialCountdownBadge({ trialEndsAt }: { trialEndsAt: string }) {
  const [t, setT] = useState<TimeLeft>(() => calcTimeLeft(trialEndsAt));

  useEffect(() => {
    const id = setInterval(() => setT(calcTimeLeft(trialEndsAt)), 1000);
    return () => clearInterval(id);
  }, [trialEndsAt]);

  const urgent = t.days <= 3;

  return (
    <div
      className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest ${
        urgent
          ? "bg-red-50 border-red-200 text-red-700"
          : "bg-orange-50 border-orange-100 text-orange-700"
      }`}
    >
      <span className="relative flex h-2 w-2">
        <span
          className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
            urgent ? "bg-red-400" : "bg-orange-400"
          }`}
        />
        <span
          className={`relative inline-flex rounded-full h-2 w-2 ${
            urgent ? "bg-red-500" : "bg-orange-500"
          }`}
        />
      </span>
      {t.total === 0
        ? "Trial expired"
        : `${t.days}d ${pad(t.hours)}h ${pad(t.minutes)}m ${pad(t.seconds)}s`}
    </div>
  );
}

// ── Banner (full, with flip-clock style units) ────────────────────────────
export function TrialCountdownBanner({ trialEndsAt }: { trialEndsAt: string }) {
  const [t, setT] = useState<TimeLeft>(() => calcTimeLeft(trialEndsAt));

  useEffect(() => {
    const id = setInterval(() => setT(calcTimeLeft(trialEndsAt)), 1000);
    return () => clearInterval(id);
  }, [trialEndsAt]);

  const urgent = t.days <= 3;

  const units = [
    { label: "Days", value: pad(t.days) },
    { label: "Hours", value: pad(t.hours) },
    { label: "Mins", value: pad(t.minutes) },
    { label: "Secs", value: pad(t.seconds) },
  ];

  return (
    <div
      className={`rounded-2xl border px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 ${
        urgent
          ? "border-red-200 bg-red-50 text-red-800"
          : "border-amber-200 bg-amber-50 text-amber-800"
      }`}
    >
      <div className="space-y-1">
        <p className="text-sm font-bold">
          {urgent ? "⚠️ Trial khatam hone wala hai!" : "Free trial chal raha hai"}
        </p>
        <div className="flex items-center gap-2">
          {units.map((u) => (
            <div key={u.label} className="flex flex-col items-center">
              <span
                className={`font-black text-xl tabular-nums leading-none px-2 py-1 rounded-lg ${
                  urgent ? "bg-red-100 text-red-900" : "bg-amber-100 text-amber-900"
                }`}
              >
                {u.value}
              </span>
              <span className="text-[9px] font-bold uppercase tracking-widest mt-0.5 opacity-60">
                {u.label}
              </span>
            </div>
          ))}
        </div>
      </div>
      <Link
        href="/billing"
        className={`shrink-0 inline-flex items-center justify-center rounded-full px-5 py-2 text-sm font-black text-white shadow transition-transform hover:scale-105 ${
          urgent
            ? "bg-red-500 hover:bg-red-600 shadow-red-200"
            : "bg-orange-500 hover:bg-orange-600 shadow-orange-200"
        }`}
      >
        Subscribe now →
      </Link>
    </div>
  );
}
