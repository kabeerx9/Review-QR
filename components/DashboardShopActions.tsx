"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface DashboardShopActionsProps {
  reviewLink: string;
  qrCodeUrl: string;
}

export default function DashboardShopActions({ reviewLink, qrCodeUrl }: DashboardShopActionsProps) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    await navigator.clipboard.writeText(reviewLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="space-y-3 pt-2">
      <a 
        href={qrCodeUrl || "#"} 
        download="reviewqr-code.png" 
        className="w-full flex items-center justify-center gap-2 py-3 bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold rounded-xl transition-colors shadow-md"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
        Download QR Code
      </a>
      
      <button 
        type="button" 
        onClick={copyLink} 
        className={`w-full flex items-center justify-center gap-2 py-3 text-sm font-bold rounded-xl transition-all border ${
          copied 
            ? "bg-emerald-50 text-emerald-600 border-emerald-200" 
            : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300 shadow-sm"
        }`}
      >
        {copied ? (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
            Link Copied!
          </>
        ) : (
          <>
            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
            Copy Review Link
          </>
        )}
      </button>
    </div>
  );
}
