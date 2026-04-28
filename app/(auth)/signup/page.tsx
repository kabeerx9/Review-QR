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
  const inputClassName =
    "w-full rounded-xl border border-[#e9dfce] bg-[#fffcf7] px-4 py-3 text-sm text-[#22211c] placeholder:text-[#9a8f80] outline-none transition focus:border-orange-300 focus:ring-4 focus:ring-orange-100";

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
    <main className="flex min-h-screen bg-[#fcf8ef]">
      {/* Left — Branding Panel */}
      <div className="relative hidden items-center justify-center overflow-hidden border-r border-[#e8dcc8] bg-linear-to-br from-[#fff6e8] via-[#fcf8ef] to-[#fff1df] lg:flex lg:w-1/2">
        <div className="orb orb-1" />
        <div className="relative z-10 max-w-md px-12 space-y-6">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-orange-500 to-red-500 text-lg font-bold text-white">R</div>
            <span className="text-2xl font-bold text-[#22211c]">ReviewQR</span>
          </div>
          <h2 className="text-3xl font-bold leading-snug text-[#22211c]">
            Get your free QR code in under 2 minutes
          </h2>
          <p className="leading-relaxed text-[#635d54]">
            Create your account, set up your shop, and start collecting 5-star reviews today.
          </p>
          <div className="space-y-3 text-sm text-[#81786b]">
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
        <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(247,148,29,0.10)_0%,transparent_60%)] lg:hidden" />
        <form onSubmit={onSubmit} className="relative z-10 w-full max-w-sm space-y-6 rounded-3xl border border-[#e5d9c4] bg-white p-6 shadow-[0_16px_36px_rgba(34,31,28,0.08)] anim-slide">
          <div className="absolute -top-12 left-0 lg:-left-4">
            <Link href="/" className="flex items-center gap-1 text-sm font-medium text-[#81786b] transition-colors hover:text-[#22211c]">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              Back to Home
            </Link>
          </div>

          <div className="lg:hidden flex items-center gap-2 mb-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-br from-orange-500 to-red-500 text-sm font-bold text-white">R</div>
            <span className="text-lg font-bold text-[#22211c]">ReviewQR</span>
          </div>

          <div>
            <h1 className="text-2xl font-bold text-[#22211c]">Create your account</h1>
            <p className="mt-1 text-sm text-[#635d54]">Start your 15-day free trial</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#635d54]">Full name</label>
              <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className={inputClassName} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#635d54]">Email</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className={inputClassName} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#635d54]">Password</label>
              <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 6 characters" className={inputClassName} />
            </div>
          </div>

          {error && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

          <button type="submit" disabled={loading} className="btn-main w-full py-3">
            {loading ? "Creating account..." : "Start Free Trial →"}
          </button>

          <p className="text-center text-sm text-[#635d54]">
            Already have an account?{" "}
            <Link className="font-semibold text-[#9a4d14] transition hover:text-[#7f3f10]" href="/login">Login</Link>
          </p>
        </form>
      </div>
    </main>
  );
}
