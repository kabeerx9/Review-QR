'use client';

import { useState } from 'react';
import Link from 'next/link';
import QRCode from 'qrcode';
import { BackButton } from '@/components/BackButton';

export default function FreeQRGenerator() {
  const [googleLink, setGoogleLink] = useState('');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  const generateQR = async () => {
    setError('');
    if (!googleLink.trim()) {
      setError('Please enter a Google review link.');
      return;
    }
    setIsGenerating(true);
    try {
      const url = await QRCode.toDataURL(googleLink.trim(), {
        width: 400,
        margin: 3,
        color: { dark: '#0f172a', light: '#ffffff' },
        errorCorrectionLevel: 'H',
      });
      setQrCodeDataUrl(url);
    } catch (err) {
      setError('Failed to generate QR code. Please try again.');
    }
    setIsGenerating(false);
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
          <Link href="/login" className="text-sm font-bold text-orange-600 hover:text-orange-700">Get Pro Version →</Link>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          <div>
            <div className="inline-block bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest mb-6">100% Free Tool</div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 leading-tight mb-4">
              Free Google Review QR Code Generator
            </h1>
            <p className="text-lg text-slate-600 mb-6 font-medium leading-relaxed">
              Generate a free QR code that links customers directly to your Google review page. Print it and place it at your counter, on bills, or on tables.
            </p>

            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6">
              <p className="text-sm font-bold text-amber-900 mb-1">How to get your Google Review Link:</p>
              <ol className="text-sm text-amber-800 space-y-1 list-decimal pl-4">
                <li>Open <strong>Google Business Profile</strong> dashboard</li>
                <li>Click <strong>"Ask for reviews"</strong></li>
                <li>Copy the short link shown (starts with g.page/...)</li>
                <li>Paste it below and generate!</li>
              </ol>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl">
              <label className="block text-sm font-bold text-slate-700 mb-2">Your Google Review Link</label>
              <input
                type="url"
                value={googleLink}
                onChange={e => { setGoogleLink(e.target.value); setError(''); }}
                placeholder="https://g.page/r/YOUR_ID/review"
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 mb-2 focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium"
              />
              {error && <p className="text-red-500 text-sm font-bold mb-4">{error}</p>}
              <div className="mb-5" />
              <button
                onClick={generateQR}
                disabled={isGenerating || !googleLink.trim()}
                className="w-full bg-slate-900 text-white font-black py-4 rounded-xl transition-all hover:bg-slate-800 disabled:opacity-40"
              >
                {isGenerating ? 'Generating...' : 'Generate Free QR Code →'}
              </button>
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-10 min-h-[500px] flex flex-col items-center justify-center">
            {!qrCodeDataUrl && !isGenerating && (
              <div className="text-center text-slate-400">
                <div className="w-52 h-52 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <span className="text-slate-300 font-medium text-sm px-4 text-center">QR code will appear here</span>
                </div>
                <p className="font-medium">Enter your Google review link to get started</p>
              </div>
            )}
            {isGenerating && (
              <div className="flex flex-col items-center gap-4 text-slate-400">
                <div className="w-8 h-8 border-4 border-slate-200 border-t-orange-500 rounded-full animate-spin" />
                <p className="font-medium">Generating your QR code…</p>
              </div>
            )}
            {qrCodeDataUrl && !isGenerating && (
              <div className="text-center w-full">
                <img src={qrCodeDataUrl} alt="Your Google Review QR Code" className="w-56 h-56 mx-auto mb-6 rounded-2xl shadow-sm border border-slate-100" />
                <p className="text-sm text-slate-500 font-bold mb-6">Scan to test your QR code</p>
                <a
                  href={qrCodeDataUrl}
                  download="Google-Review-QR-ReviewQR.png"
                  className="inline-flex items-center gap-2 bg-orange-500 text-white px-8 py-3 rounded-full font-black hover:bg-orange-600 transition-colors mb-6"
                >
                  ↓ Download PNG
                </a>
                <div className="bg-orange-50 border border-orange-100 p-5 rounded-2xl text-left mt-4">
                  <h3 className="font-black text-orange-900 mb-1 text-sm">⚠️ This is a basic QR code</h3>
                  <p className="text-xs text-orange-800 mb-3 font-medium">It sends every customer to Google — including angry ones who might leave 1-stars. ReviewQR Pro intercepts unhappy customers privately first.</p>
                  <Link href="/login" className="text-xs font-black text-orange-600">Upgrade to Smart QR →</Link>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-24 max-w-3xl mx-auto">
          <h2 className="text-2xl font-black text-slate-900 mb-4">Why every business needs a Google Review QR Code</h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            Getting more Google reviews is the #1 way to rank higher in local search results. However, asking customers to manually search for your business creates too much friction. A Google Review QR Code eliminates this friction by taking customers directly to the review screen with a single scan.
          </p>
          <p className="text-slate-600 leading-relaxed">
            Businesses that place a QR code at checkout typically see a 3–5x increase in monthly Google reviews within 30 days. More reviews means higher ranking, which means more customers discovering your business.
          </p>
        </div>
      </main>
    </div>
  );
}
