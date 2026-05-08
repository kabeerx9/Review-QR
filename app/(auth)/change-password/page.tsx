"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function ChangePasswordPage() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters");
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    const response = await fetch("/api/auth/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    const data = await safeJson(response);
    if (!response.ok) {
      const apiError = typeof data.error === "string" ? data.error : "Change password failed";
      const message =
        apiError === "missing_jwt_secret"
          ? "Server config missing JWT_SECRET. Add it in .env.local and restart dev server."
          : apiError === "invalid_current_password"
          ? "Current password is incorrect"
          : apiError === "password_too_short"
          ? "New password must be at least 8 characters"
          : apiError === "same_password"
          ? "New password must be different from current password"
          : apiError;
      setError(message);
      setLoading(false);
      return;
    }

    const redirectTo = typeof data.redirectTo === "string" ? data.redirectTo : "/dashboard";
    router.push(redirectTo);
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
            Change your password
          </h2>
          <p className="leading-relaxed text-[#635d54]">
            For your security, you must change your password before continuing to use the dashboard.
          </p>
        </div>
      </div>

      {/* Right — Change Password Form */}
      <div className="flex flex-1 items-center justify-center px-5 py-12">
        <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(247,148,29,0.10)_0%,transparent_60%)] lg:hidden" />
        <form onSubmit={onSubmit} className="relative z-10 w-full max-w-sm space-y-6 rounded-3xl border border-[#e5d9c4] bg-white p-6 shadow-[0_16px_36px_rgba(34,31,28,0.08)] anim-slide">
          <div className="lg:hidden flex items-center gap-2 mb-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-br from-orange-500 to-red-500 text-sm font-bold text-white">R</div>
            <span className="text-lg font-bold text-[#22211c]">ReviewQR</span>
          </div>

          <div>
            <h1 className="text-2xl font-bold text-[#22211c]">Change Password</h1>
            <p className="mt-1 text-sm text-[#635d54]">Set a new password to continue</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#635d54]">Current Password</label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className={inputClassName}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#635d54]">New Password</label>
              <input
                type="password"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min 8 characters"
                className={inputClassName}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#635d54]">Confirm New Password</label>
              <input
                type="password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Min 8 characters"
                className={inputClassName}
              />
            </div>
          </div>

          {error && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

          <button type="submit" disabled={loading} className="btn-main w-full py-3">
            {loading ? "Changing password..." : "Change Password →"}
          </button>
        </form>
      </div>
    </main>
  );
}
