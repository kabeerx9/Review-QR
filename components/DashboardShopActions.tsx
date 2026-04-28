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
    <div className="space-y-2.5 pt-2">
      <a href={qrCodeUrl || "#"} download="reviewqr-code.png" className="btn-main w-full py-2.5 text-sm block text-center">
        ⬇ Download QR
      </a>
      <div className="flex gap-2.5">
        <button type="button" onClick={copyLink} className="btn-ghost flex-1 py-2.5 text-sm">
          {copied ? "✓ Copied!" : "📋 Copy Link"}
        </button>
        <button type="button" onClick={logout} className="btn-ghost py-2.5 px-4 text-sm">
          Logout
        </button>
      </div>
    </div>
  );
}
