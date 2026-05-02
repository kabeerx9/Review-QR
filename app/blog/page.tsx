'use client';

import Link from 'next/link';
import { BackButton } from '@/components/BackButton';

export default function BlogIndex() {
  const posts = [
    {
      title: "How to Remove Fake 1-Star Reviews from Google Maps",
      excerpt: "A step-by-step guide to reporting, flagging, and legally removing malicious reviews left by competitors or bots.",
      slug: "how-to-remove-fake-google-reviews",
      date: "May 2, 2026",
      category: "Reputation Management"
    },
    {
      title: "Why You Must Reply to Every Google Review (Even the Bad Ones)",
      excerpt: "Google's local search algorithm rewards active businesses. Here is exactly why and how you should reply to all feedback.",
      slug: "why-reply-to-google-reviews",
      date: "April 28, 2026",
      category: "Local SEO"
    },
    {
      title: "Top 5 Ways to Increase Restaurant Footfall in 2026",
      excerpt: "Stop spending money on ads. Discover how leveraging your existing footfall can create a viral organic loop.",
      slug: "increase-restaurant-footfall-2026",
      date: "April 15, 2026",
      category: "Growth Strategies"
    }
  ];

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-sans selection:bg-orange-200 selection:text-orange-900">
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

      <main className="max-w-4xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-black text-slate-900 leading-tight mb-4">
            The Local Growth Blog
          </h1>
          <p className="text-xl text-slate-600 font-medium">
            Actionable strategies to dominate local search, manage your reputation, and scale your offline business.
          </p>
        </div>

        <div className="space-y-8">
          {posts.map((post, i) => (
            <Link key={i} href={`/blog/${post.slug}`} className="block group">
              <article className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm transition-all hover:shadow-lg hover:-translate-y-1">
                <div className="flex items-center gap-4 mb-4">
                  <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest">{post.category}</span>
                  <span className="text-sm text-slate-400 font-bold">{post.date}</span>
                </div>
                <h2 className="text-2xl md:text-3xl font-black text-slate-900 mb-4 group-hover:text-orange-600 transition-colors">
                  {post.title}
                </h2>
                <p className="text-slate-600 font-medium leading-relaxed">
                  {post.excerpt}
                </p>
              </article>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
