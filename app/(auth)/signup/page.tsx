"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function safeJson(response: Response): Promise<Record<string, unknown>> {
    const text = await response.text();
    if (!text) return {};
    try {
      return JSON.parse(text) as Record<string, unknown>;
    } catch {
      return {};
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const response = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await safeJson(response);
    if (!response.ok) {
      const apiError = typeof data.error === "string" ? data.error : "Signup failed";
      const message =
        apiError === "missing_jwt_secret"
          ? "Server config missing JWT_SECRET. Add it in .env.local and restart dev server."
          : apiError;
      setError(message);
      setLoading(false);
      return;
    }

    router.push("/onboarding");
  }

  return (
    <main className="flex min-h-screen bg-[var(--bg-primary)]">
      {/* Left — Branding Panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center bg-gradient-to-br from-orange-500/10 via-[var(--bg-primary)] to-emerald-500/5 border-r border-[var(--border-subtle)]">
        <div className="orb orb-1" />
        <div className="relative z-10 max-w-md px-12 space-y-6">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-red-500 text-lg font-bold text-white">R</div>
            <span className="text-2xl font-bold text-white">ReviewQR</span>
          </div>
          <h2 className="text-3xl font-bold text-white leading-snug">
            Get your free QR code in under 2 minutes
          </h2>
          <p className="text-[var(--text-secondary)] leading-relaxed">
            Create your account, set up your shop, and start collecting 5-star reviews today.
          </p>
          <div className="space-y-3 text-sm text-[var(--text-muted)]">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-500/10 text-orange-400 text-xs font-bold">1</span>
              Create account
            </div>
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-500/10 text-orange-400 text-xs font-bold">2</span>
              Setup your shop
            </div>
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-500/10 text-orange-400 text-xs font-bold">3</span>
              Get your QR code!
            </div>
          </div>
        </div>
      </div>

      {/* Right — Signup Form */}
      <div className="flex flex-1 items-center justify-center px-5 py-12">
        <div className="fixed inset-0 bg-noise pointer-events-none lg:hidden" />
        <form onSubmit={onSubmit} className="relative z-10 w-full max-w-sm space-y-6 anim-slide">
          <div className="absolute -top-12 left-0 lg:-left-4">
            <Link href="/" className="text-sm font-medium text-[var(--text-muted)] hover:text-white transition-colors flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              Back to Home
            </Link>
          </div>

          <div className="lg:hidden flex items-center gap-2 mb-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-red-500 text-sm font-bold text-white">R</div>
            <span className="text-lg font-bold text-white">ReviewQR</span>
          </div>

          <div>
            <h1 className="text-2xl font-bold text-white">Create your account</h1>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">Start your 15-day free trial</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Full name</label>
              <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="field" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Email</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="field" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Password</label>
              <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 6 characters" className="field" />
            </div>
          </div>

          {error && <p className="text-sm text-[var(--red-soft)] bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}

          <button type="submit" disabled={loading} className="btn-main w-full py-3">
            {loading ? "Creating account..." : "Start Free Trial →"}
          </button>

          <p className="text-sm text-[var(--text-secondary)] text-center">
            Already have an account?{" "}
            <Link className="font-semibold text-[var(--accent)] hover:text-[var(--accent-hover)] transition" href="/login">Login</Link>
          </p>
        </form>
      </div>
    </main>
  );
}
