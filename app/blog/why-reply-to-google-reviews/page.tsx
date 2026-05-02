import Link from 'next/link';
import type { Metadata } from 'next';
import { BackButton } from '@/components/BackButton';

export const metadata: Metadata = {
  title: "Why You Must Reply to Every Google Review (Even the Bad Ones) | ReviewQR Blog",
  description: "Replying to Google reviews boosts local SEO ranking and builds customer trust. Learn the exact templates and strategy for responding to positive and negative reviews.",
};

export default function BlogPost2() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] font-sans">
      <nav className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <BackButton />
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500 text-white font-black text-sm">RQ</div>
              <span className="text-xl font-black tracking-tight text-slate-900 hidden sm:block">ReviewQR</span>
            </Link>
          </div>
          <Link href="/signup" className="text-sm font-bold text-orange-600 hover:text-orange-700">Start Free Trial →</Link>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-20">
        <div className="mb-12">
          <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest">Local SEO</span>
          <h1 className="text-3xl md:text-5xl font-black text-slate-900 leading-tight mt-6 mb-4">
            Why You Must Reply to Every Google Review (Even the Bad Ones)
          </h1>
          <p className="text-slate-400 font-bold text-sm">April 28, 2026 · 6 min read</p>
        </div>

        <div className="prose prose-slate max-w-none">
          <p className="text-xl text-slate-600 font-medium leading-relaxed mb-8">
            Most Indian business owners reply to reviews only when they have time—which means rarely. This is a critical mistake. Replying to Google reviews is not optional. It is one of the most powerful and free tools available to improve your local search ranking.
          </p>

          <h2 className="text-2xl font-black text-slate-900 mb-4 mt-10">Google's Algorithm Rewards Engagement</h2>
          <p className="text-slate-600 leading-relaxed mb-6">
            Google's local ranking algorithm measures how actively you manage your Business Profile. Businesses that reply to reviews consistently appear higher in Google Maps results for the same search query. This is publicly documented in Google's own Local Search ranking factors.
          </p>

          <h2 className="text-2xl font-black text-slate-900 mb-4 mt-10">89% of Customers Read Your Replies</h2>
          <p className="text-slate-600 leading-relaxed mb-6">
            According to BrightLocal's annual consumer survey, 89% of consumers say they read business owner responses to reviews before deciding to visit. Your reply is not just for the one reviewer—it is a public advertisement to every future customer who reads that review page.
          </p>

          <h2 className="text-2xl font-black text-slate-900 mb-4 mt-10">Templates: How to Reply to a 5-Star Review</h2>
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 mb-6 font-mono text-sm text-slate-700">
            <p>"Thank you so much, [Customer Name]! We are thrilled you had a great experience at [Business Name]. Your kind words motivate our entire team. We hope to see you again soon!"</p>
          </div>
          <p className="text-slate-600 leading-relaxed mb-6">
            Key principles: use their name, mention your business name (for keyword SEO), thank them specifically, invite them back.
          </p>

          <h2 className="text-2xl font-black text-slate-900 mb-4 mt-10">Templates: How to Reply to a 1-Star Review</h2>
          <div className="bg-orange-50 border border-orange-200 rounded-2xl p-6 mb-6 font-mono text-sm text-orange-900">
            <p>"We're sorry to hear this, [Customer Name]. This is not the experience we strive to provide. Please reach out to us directly at [phone/email] so we can make this right. We take all feedback seriously."</p>
          </div>
          <p className="text-slate-600 leading-relaxed mb-8">
            Never be defensive. Never argue. Your goal is not to win the argument with the reviewer—it is to appear professional and caring to the thousands of other customers who will read this exchange.
          </p>

          <h2 className="text-2xl font-black text-slate-900 mb-4 mt-10">The Problem: Who Has Time for This?</h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            A busy restaurant owner with 50 reviews a month cannot possibly reply to all of them manually. This is exactly the gap ReviewQR Pro fills. Our AI connects directly to your Google Business account and automatically replies to every single review, in the customer's language, within minutes of them posting.
          </p>
        </div>

        <div className="mt-20 bg-slate-900 rounded-[2rem] p-10 text-center text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/20 rounded-full blur-[80px] pointer-events-none" />
          <div className="relative z-10">
            <h3 className="text-2xl font-black mb-3">Put your review replies on autopilot.</h3>
            <p className="text-slate-400 font-medium mb-6">ReviewQR AI replies to every Google review 24/7, in Hindi, English, or any Indian language. Sounds 100% human.</p>
            <Link href="/signup" className="inline-flex items-center gap-2 bg-orange-500 text-white px-8 py-3 rounded-full font-black hover:bg-orange-600 transition-colors">
              Start 15-Day Free Trial
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
