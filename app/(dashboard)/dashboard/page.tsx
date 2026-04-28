import { getSession } from "@/lib/auth";
import { getDashboardData } from "@/lib/dashboard";
import { NICHE_CATEGORIES } from "@/constants/niches";
import DashboardShopActions from "@/components/DashboardShopActions";
import RatingTrendChart from "@/components/RatingTrendChart";
import Link from "next/link";
import { redirect } from "next/navigation";
import Image from "next/image";
import UserMenu from "@/components/UserMenu";
import { TrialCountdownBadge, TrialCountdownBanner } from "@/components/TrialCountdown";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const data = await getDashboardData(session.ownerId);
  const shop = data.shop;
  const isExpired = data.subscription.status === "EXPIRED";
  const isTrial = data.subscription.status === "TRIAL";
  const daysLeft = data.subscription.daysLeft;
  const trialEndsAt = data.subscription.trialEndsAt
    ? new Date(data.subscription.trialEndsAt).toLocaleDateString()
    : "N/A";
  const categories = shop ? NICHE_CATEGORIES[shop.niche] ?? ["Quality", "Cleanliness", "Service", "Experience"] : [];
  const monthlyTotal = data.metrics.totalReviewsThisMonth;
  const publicPct = monthlyTotal ? Math.round((data.metrics.publicReviewsThisMonth / monthlyTotal) * 100) : 0;
  const privatePct = monthlyTotal ? Math.round((data.metrics.privateReviewsThisMonth / monthlyTotal) * 100) : 0;

  return (
    <main className="min-h-screen bg-[#FAFAFA] font-sans selection:bg-orange-200 selection:text-orange-900">
      {/* SEAMLESS LIGHT BACKGROUND EFFECTS */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Soft Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.03)_1px,transparent_1px)] bg-size-[64px_64px] mask-[radial-gradient(ellipse_80%_80%_at_50%_0%,#000_10%,transparent_100%)]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-[50%] rounded-full bg-orange-400/5 blur-[120px]" />
      </div>

      {/* Top Nav */}
      <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-br from-orange-500 to-orange-600 text-white font-black shadow-md transition-transform group-hover:scale-105">
              RQ
            </div>
            <span className="font-black text-slate-900 tracking-tight text-lg">ReviewQR</span>
            <span className="text-xs font-bold text-slate-400 hidden sm:inline uppercase tracking-widest ml-2">/ Dashboard</span>
          </Link>
          <div className="flex items-center gap-4">
            {isTrial && data.subscription.trialEndsAt && (
              <TrialCountdownBadge trialEndsAt={data.subscription.trialEndsAt} />
            )}
            
            <UserMenu ownerName={data.ownerName || "Owner"} />
          </div>
        </div>
      </nav>

      <div className="relative mx-auto max-w-6xl px-6 py-10 space-y-8 z-10">
        {/* Welcome */}
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Welcome back, {data.ownerName || "Owner"} 👋</h1>
          <p className="mt-1 text-slate-500 font-medium">Here&apos;s a quick overview of your shop&apos;s reputation.</p>
        </div>

        {isTrial && data.subscription.trialEndsAt && (
          <TrialCountdownBanner trialEndsAt={data.subscription.trialEndsAt} />
        )}

        {!shop ? (
          <div className="bg-white border border-slate-200 rounded-4xl p-16 text-center shadow-sm max-w-2xl mx-auto mt-12">
            <div className="w-24 h-24 mx-auto bg-orange-50 rounded-full flex items-center justify-center text-4xl mb-6 shadow-inner border border-orange-100">
              🏪
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-3">No shop set up yet</h2>
            <p className="text-slate-500 font-medium mb-8">
              You're one step away from fully automated 5-star Google reviews. Create your first shop to generate your custom QR code.
            </p>
            <Link href="/onboarding" className="inline-flex items-center justify-center rounded-full bg-orange-500 px-8 py-4 text-sm font-black text-white transition-transform hover:scale-105 shadow-[0_8px_30px_rgba(249,115,22,0.3)] hover:bg-orange-600">
              Setup Your Shop
            </Link>
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Total Reviews (Month)</p>
                <p className="text-4xl font-black text-slate-900">{data.metrics.totalReviewsThisMonth}</p>
              </div>
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Posted to Google</p>
                <p className="text-4xl font-black text-blue-600">{data.metrics.publicReviewsThisMonth}</p>
              </div>
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10 text-4xl">🛡️</div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Intercepted</p>
                <p className="text-4xl font-black text-red-500">{data.metrics.privateReviewsThisMonth}</p>
              </div>
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Avg Rating</p>
                <p className="text-4xl font-black text-emerald-600">{data.metrics.averageRatingThisMonth.toFixed(2)}</p>
              </div>
            </div>

            <div className="grid gap-8 lg:grid-cols-2">
              <section className="bg-white border border-slate-200 rounded-4xl p-8 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Rating Trend (Last 30 Days)</p>
                {data.metrics.ratingTrend.length === 0 ? (
                  <p className="text-sm font-medium text-slate-500">Not enough review activity this month yet.</p>
                ) : (
                  <RatingTrendChart data={data.metrics.ratingTrend} />
                )}
              </section>

              <section className="bg-white border border-slate-200 rounded-4xl p-8 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Monthly Breakdown</p>
                <div className="space-y-4">
                  <div>
                    <div className="mb-1 flex items-center justify-between text-xs font-semibold text-slate-500">
                      <span>Posted to Google</span>
                      <span>{data.metrics.publicReviewsThisMonth} ({publicPct}%)</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-blue-500" style={{ width: `${publicPct}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="mb-1 flex items-center justify-between text-xs font-semibold text-slate-500">
                      <span>Intercepted private feedback</span>
                      <span>{data.metrics.privateReviewsThisMonth} ({privatePct}%)</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-red-500" style={{ width: `${privatePct}%` }} />
                    </div>
                  </div>
                  <p className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
                    This month total: {monthlyTotal} reviews, avg {data.metrics.averageRatingThisMonth.toFixed(2)}/5.
                  </p>
                </div>
              </section>
            </div>

            <div className="grid gap-8 lg:grid-cols-5">
              {/* Shop Info — 2 cols */}
              <section className="bg-white border border-slate-200 rounded-4xl p-8 shadow-sm lg:col-span-2 flex flex-col">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Your Shop</p>
                    <h2 className="text-2xl font-black text-slate-900">{shop.name}</h2>
                    <p className="text-sm font-bold text-slate-500">{shop.city} · {shop.niche}</p>
                  </div>
                  <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center text-xl shadow-inner">
                    {shop.niche === 'HOTEL' ? '🏨' : shop.niche === 'RESTAURANT' ? '🍽️' : shop.niche === 'SALON' ? '💇' : '🏪'}
                  </div>
                </div>

                {shop.qrCodeUrl && (
                  <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex flex-col items-center justify-center mb-6 shadow-inner">
                    <Image src={shop.qrCodeUrl} alt="Shop QR" width={180} height={180} className="rounded-xl mix-blend-multiply" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-4">Print this for your counter</p>
                  </div>
                )}

                <div className="mt-auto pt-4 border-t border-slate-100">
                  <DashboardShopActions
                    qrCodeUrl={shop.qrCodeUrl || ""}
                    reviewLink={`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/r/${shop.slug}`}
                  />
                </div>
              </section>

              {/* Recent Negative Reviews — 3 cols */}
              <section className="bg-white border border-slate-200 rounded-4xl p-8 shadow-sm lg:col-span-3 flex flex-col">
                <div className="flex items-center justify-between mb-8">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Negative Reviews</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Last 10 private reviews</p>
                </div>

                {data.recentNegativeReviews.length === 0 ? (
                  <div className="text-center py-16 flex-1 flex flex-col justify-center items-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-2xl mb-4 shadow-sm">
                      🎉
                    </div>
                    <h3 className="text-slate-900 font-bold mb-1">No negative reviews this month</h3>
                    <p className="text-sm font-medium text-slate-500 max-w-xs">
                      Great job. Keep monitoring customer experience and keep this feed empty.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {data.recentNegativeReviews.map((review) => (
                      <div key={review.id} className="rounded-2xl border border-red-100 bg-red-50/30 p-4">
                        <div className="mb-3 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-xl border border-red-100 bg-white text-red-500 shadow-sm flex items-center justify-center text-lg font-black">
                              {review.averageRating.toFixed(1)}
                            </div>
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                              {new Date(review.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <span className="rounded-lg border border-red-200 bg-red-100/50 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-red-700">
                            Private
                          </span>
                        </div>

                        <div className="mb-3 flex flex-wrap gap-2">
                          {categories.map((category, index) => {
                            const value = [review.rating1, review.rating2, review.rating3, review.rating4][index];
                            return (
                              <span
                                key={`${review.id}-${category}`}
                                className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700"
                              >
                                {category}: {value}/5
                              </span>
                            );
                          })}
                        </div>

                        {review.customerPhone && (
                          <a href={`tel:${review.customerPhone}`} className="text-xs font-bold text-blue-700 underline">
                            Call {review.customerPhone}
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          </>
        )}
      </div>

      {isExpired && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 px-5 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-red-200 bg-white p-8 text-center shadow-2xl">
            <h2 className="text-2xl font-black text-slate-900">Aapka trial khatam ho gaya</h2>
            <p className="mt-2 text-sm font-medium text-slate-600">
              Subscribe karein to QR system aur dashboard access turant reactivate ho jayega.
            </p>
            <Link
              href="/billing"
              className="mt-5 inline-flex rounded-full bg-slate-900 px-6 py-3 text-sm font-bold text-white hover:bg-slate-800"
            >
              Go to Billing
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}
