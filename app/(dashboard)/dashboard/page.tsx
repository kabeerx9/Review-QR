import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import DashboardShopActions from "@/components/DashboardShopActions";
import Link from "next/link";
import { redirect } from "next/navigation";
import Image from "next/image";
import UserMenu from "@/components/UserMenu";

interface ReviewRecord {
  id: string;
  createdAt: Date;
  averageRating: number;
  isPublic: boolean;
}

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const owner = await prisma.owner.findUnique({
    where: { id: session.ownerId },
    include: {
      shops: {
        include: {
          reviews: {
            orderBy: { createdAt: "desc" },
            take: 5,
          },
        },
      },
    },
  });

  if (!owner) redirect("/login");

  const shop = owner.shops[0];
  const totalReviews = owner.shops.reduce((acc: number, current: { reviews: ReviewRecord[] }) => acc + current.reviews.length, 0);
  const publicReviews = shop?.reviews.filter((r: ReviewRecord) => r.isPublic).length ?? 0;
  const privateReviews = shop?.reviews.filter((r: ReviewRecord) => !r.isPublic).length ?? 0;
  const trialEndsAt = owner.trialEndsAt ? owner.trialEndsAt.toLocaleDateString() : "N/A";

  return (
    <main className="min-h-screen bg-[#FAFAFA] font-sans selection:bg-orange-200 selection:text-orange-900">
      {/* SEAMLESS LIGHT BACKGROUND EFFECTS */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Soft Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.03)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_0%,#000_10%,transparent_100%)]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-[50%] rounded-full bg-orange-400/5 blur-[120px]" />
      </div>

      {/* Top Nav */}
      <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 text-white font-black shadow-md transition-transform group-hover:scale-105">
              RQ
            </div>
            <span className="font-black text-slate-900 tracking-tight text-lg">ReviewQR</span>
            <span className="text-xs font-bold text-slate-400 hidden sm:inline uppercase tracking-widest ml-2">/ Dashboard</span>
          </Link>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 bg-orange-50 px-3 py-1.5 rounded-full border border-orange-100">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
              </span>
              <span className="text-[10px] font-black uppercase tracking-widest text-orange-700">Trial Ends: {trialEndsAt}</span>
            </div>
            
            <UserMenu ownerName={owner.name || "Owner"} />
          </div>
        </div>
      </nav>

      <div className="relative mx-auto max-w-6xl px-6 py-10 space-y-8 z-10">
        {/* Welcome */}
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Welcome back, {owner.name || "Owner"} 👋</h1>
          <p className="mt-1 text-slate-500 font-medium">Here&apos;s a quick overview of your shop&apos;s reputation.</p>
        </div>

        {!shop ? (
          <div className="bg-white border border-slate-200 rounded-[2rem] p-16 text-center shadow-sm max-w-2xl mx-auto mt-12">
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
              <div className="bg-white border border-slate-200 rounded-[1.5rem] p-6 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Total Scans / Reviews</p>
                <p className="text-4xl font-black text-slate-900">{totalReviews}</p>
              </div>
              <div className="bg-white border border-slate-200 rounded-[1.5rem] p-6 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Posted to Google</p>
                <p className="text-4xl font-black text-blue-600">{publicReviews}</p>
              </div>
              <div className="bg-white border border-slate-200 rounded-[1.5rem] p-6 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10 text-4xl">🛡️</div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Bad Reviews Blocked</p>
                <p className="text-4xl font-black text-red-500">{privateReviews}</p>
              </div>
              <div className="bg-white border border-slate-200 rounded-[1.5rem] p-6 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">AI Auto-Reply</p>
                <div className="mt-2 flex items-center gap-2 text-emerald-600 bg-emerald-50 w-fit px-3 py-1.5 rounded-lg border border-emerald-100">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-sm font-bold">Active</span>
                </div>
              </div>
            </div>

            <div className="grid gap-8 lg:grid-cols-5">
              {/* Shop Info — 2 cols */}
              <section className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm lg:col-span-2 flex flex-col">
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

              {/* Recent Reviews — 3 cols */}
              <section className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm lg:col-span-3 flex flex-col">
                <div className="flex items-center justify-between mb-8">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Activity Feed</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Recent Interactions</p>
                </div>

                {shop.reviews.length === 0 ? (
                  <div className="text-center py-16 flex-1 flex flex-col justify-center items-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-2xl mb-4 shadow-sm">
                      📱
                    </div>
                    <h3 className="text-slate-900 font-bold mb-1">No reviews yet</h3>
                    <p className="text-sm font-medium text-slate-500 max-w-xs">
                      Print your QR code and place it at the billing counter to start collecting reviews.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {shop.reviews.map((review: ReviewRecord) => (
                      <div
                        key={review.id}
                        className={`flex items-center justify-between rounded-2xl border p-4 transition-transform hover:scale-[1.01] ${
                          review.isPublic
                            ? "border-blue-100 bg-blue-50/30"
                            : "border-red-100 bg-red-50/30"
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`h-12 w-12 rounded-xl flex items-center justify-center text-lg font-black shadow-sm ${
                            review.isPublic ? "bg-white text-blue-600 border border-blue-100" : "bg-white text-red-500 border border-red-100"
                          }`}>
                            {review.averageRating.toFixed(1)}
                          </div>
                          <div>
                            <div className="flex gap-1 text-sm mb-1">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <span key={i} className={i < Math.round(review.averageRating) ? "text-amber-400" : "text-slate-200"}>★</span>
                              ))}
                            </div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                              {new Date(review.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border ${
                            review.isPublic
                              ? "bg-blue-100/50 text-blue-700 border-blue-200"
                              : "bg-red-100/50 text-red-700 border-red-200"
                          }`}>
                            {review.isPublic ? "Posted to Google" : "Blocked & Private"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
