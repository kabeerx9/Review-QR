"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function LoginPage() {
  const router = useRouter();
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

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await safeJson(response);
    if (!response.ok) {
      const apiError = typeof data.error === "string" ? data.error : "Login failed";
      const message =
        apiError === "missing_jwt_secret"
          ? "Server config missing JWT_SECRET. Add it in .env.local and restart dev server."
          : apiError;
      setError(message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4 rounded-2xl border bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold text-orange-600">ReviewQR</p>
        <h1 className="text-2xl font-semibold">Welcome back</h1>
        <input
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Email"
          className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-400"
        />
        <input
          type="password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Password"
          className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-400"
        />
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-orange-500 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {loading ? "Logging in..." : "Login"}
        </button>
        <p className="text-sm text-zinc-600">
          Don&apos;t have an account?{" "}
          <Link className="font-semibold text-orange-600" href="/signup">
            Sign up
          </Link>
        </p>
      </form>
    </main>
  );
}
