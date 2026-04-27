"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface DashboardShopActionsProps {
  reviewLink: string;
  qrCodeUrl: string;
}

export default function DashboardShopActions({ reviewLink, qrCodeUrl }: DashboardShopActionsProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  async function copyLink() {
    await navigator.clipboard.writeText(reviewLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      <a
        href={qrCodeUrl || "#"}
        download="reviewqr-code.png"
        className="rounded-xl bg-orange-500 px-3 py-2 text-sm font-semibold text-white"
      >
        Download QR
      </a>
      <button type="button" onClick={copyLink} className="rounded-xl border px-3 py-2 text-sm font-medium">
        {copied ? "Copied!" : "Copy Review Link"}
      </button>
      <button type="button" onClick={logout} className="rounded-xl border px-3 py-2 text-sm font-medium">
        Logout
      </button>
    </div>
  );
}
