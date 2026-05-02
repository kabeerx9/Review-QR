'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

const tools = [
  {
    href: '/tools/google-review-qr-code-generator',
    icon: '📱',
    title: 'Free Review QR Generator',
    desc: 'Generate a QR code for your Google review page',
  },
  {
    href: '/tools/google-review-link-generator',
    icon: '🔗',
    title: 'Review Link Generator',
    desc: 'Create a direct Google review shortlink',
  },
  {
    href: '/tools/review-reply-generator',
    icon: '🤖',
    title: 'AI Reply Generator',
    desc: 'Auto-generate a reply to any customer review',
  },
  {
    href: '/tools/google-review-roi-calculator',
    icon: '📊',
    title: 'ROI Calculator',
    desc: 'Calculate how much revenue your rating is costing you',
  },
];

export function ToolsDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className={`flex items-center gap-1 text-sm font-bold transition-colors ${open ? 'text-orange-600' : 'text-slate-500 hover:text-orange-600'}`}
      >
        Free Tools
        <svg
          className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2.5}
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-72 bg-white rounded-2xl border border-slate-200 shadow-2xl p-2 z-50">
          {/* Arrow */}
          <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-l border-t border-slate-200 rotate-45" />
          {tools.map((tool) => (
            <Link
              key={tool.href}
              href={tool.href}
              onClick={() => setOpen(false)}
              className="flex items-start gap-3 rounded-xl p-3 hover:bg-orange-50 transition-colors group"
            >
              <span className="text-xl shrink-0 mt-0.5">{tool.icon}</span>
              <div>
                <p className="text-sm font-black text-slate-900 group-hover:text-orange-600 transition-colors leading-tight">{tool.title}</p>
                <p className="text-xs text-slate-400 font-medium mt-0.5 leading-snug">{tool.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
