'use client';

import { useState } from 'react';
import Link from 'next/link';
import { BackButton } from '@/components/BackButton';

export default function GoogleReviewLinkGenerator() {
  const [placeId, setPlaceId] = useState('');
  const [generatedLink, setGeneratedLink] = useState('');
  const [copied, setCopied] = useState(false);

  const generate = () => {
    if (!placeId.trim()) return;
    // Standard Google review deeplink format
    const cleanId = placeId.trim().replace(/\s+/g, '');
    const link = `https://search.google.com/local/writereview?placeid=${cleanId}`;
    setGeneratedLink(link);
  };

  const copy = () => {
    navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
          <Link href="/signup" className="text-sm font-bold text-orange-600 hover:text-orange-700">Get Pro Version →</Link>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          <div>
            <div className="inline-block bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest mb-6">Free SEO Tool</div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 leading-tight mb-4">
              Google Review Link Generator
            </h1>
            <p className="text-lg text-slate-600 mb-8 font-medium leading-relaxed">
              Generate a direct Google Review link from your Google Place ID. Share via WhatsApp, SMS, or print it as a QR code to collect 5-star reviews instantly.
            </p>

            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6">
              <p className="text-sm font-bold text-amber-900 mb-1">How to find your Google Place ID:</p>
              <ol className="text-sm text-amber-800 space-y-1 list-decimal pl-4">
                <li>Go to <a href="https://developers.google.com/maps/documentation/places/web-service/place-id" target="_blank" rel="noopener noreferrer" className="underline font-bold">Google Place ID Finder</a></li>
                <li>Search for your business name</li>
                <li>Copy the Place ID (starts with "ChIJ...")</li>
                <li>Paste it below</li>
              </ol>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl">
              <label className="block text-sm font-bold text-slate-700 mb-2">Your Google Place ID</label>
              <input
                type="text"
                value={placeId}
                onChange={e => setPlaceId(e.target.value)}
                placeholder="e.g., ChIJN1t_tDeuEmsRUsoyG83frY4"
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 mb-5 focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium font-mono text-sm"
              />
              <button
                onClick={generate}
                disabled={!placeId.trim()}
                className="w-full bg-slate-900 text-white font-black py-4 rounded-xl transition-all hover:bg-slate-800 disabled:opacity-40"
              >
                Generate Review Link →
              </button>
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-10 min-h-[480px] flex flex-col">
            {!generatedLink ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-center">
                <div className="text-5xl mb-4">🔗</div>
                <p className="font-medium">Your review link will appear here</p>
              </div>
            ) : (
              <div className="flex-1 flex flex-col gap-5">
                <h2 className="text-lg font-black text-slate-900">Your Google Review Link</h2>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 break-all">
                  <p className="text-sm font-mono text-slate-700">{generatedLink}</p>
                </div>

                <button
                  onClick={copy}
                  className={`w-full py-3 rounded-xl font-black transition-colors ${copied ? 'bg-emerald-500 text-white' : 'bg-slate-900 text-white hover:bg-slate-800'}`}
                >
                  {copied ? '✓ Copied!' : 'Copy Link'}
                </button>

                <a
                  href={generatedLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 rounded-xl font-black border-2 border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors text-center"
                >
                  Test Link →
                </a>

                <div className="mt-auto bg-orange-50 border border-orange-100 p-5 rounded-2xl">
                  <h3 className="font-black text-orange-900 mb-1 text-sm">⚠️ Warning: This link has no protection</h3>
                  <p className="text-xs text-orange-800 mb-3 font-medium">Sharing this link directly means angry customers can also post 1-star reviews. ReviewQR intercepts unhappy customers privately first.</p>
                  <Link href="/signup" className="text-xs font-black text-orange-600 hover:text-orange-700">Get the smart version →</Link>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-24 max-w-3xl mx-auto">
          <h2 className="text-2xl font-black text-slate-900 mb-4">Why a Direct Google Review Link Triples Your Reviews</h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            When you ask a customer to "find us on Google," 90% of them never do. The friction is too high. But when you send them a direct link (or a scannable QR code), they land straight on the review form with zero effort. This single change typically results in a 3–5x increase in monthly review volume.
          </p>
        </div>
      </main>
    </div>
  );
}
