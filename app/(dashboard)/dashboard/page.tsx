import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import DashboardShopActions from "@/components/DashboardShopActions";
import Link from "next/link";
import { redirect } from "next/navigation";
import Image from "next/image";

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
    <main className="min-h-screen bg-[var(--bg-primary)]">
      <div className="fixed inset-0 bg-noise pointer-events-none" />

      {/* Top Nav */}
      <nav className="sticky top-0 z-50 border-b border-[var(--border-subtle)] bg-[var(--bg-primary)]/80 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3.5">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-red-500 text-sm font-bold text-white">R</div>
            <span className="font-bold text-white">ReviewQR</span>
            <span className="text-xs text-[var(--text-muted)] hidden sm:inline">/ Dashboard</span>
          </div>
          <div className="pill">
            <span className="pill-dot" />
            Trial · {trialEndsAt}
          </div>
        </div>
      </nav>

      <div className="relative mx-auto max-w-7xl px-5 py-8 space-y-8">
        {/* Welcome */}
        <div className="anim-slide">
          <h1 className="text-2xl font-bold text-white">Welcome back, {owner.name || "Owner"} 👋</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">Here&apos;s what&apos;s happening with your reviews</p>
        </div>

        {!shop ? (
          <div className="card-static p-12 text-center anim-scale">
            <div className="text-4xl mb-4">🏪</div>
            <h2 className="text-xl font-bold text-white">No shop set up yet</h2>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">Create your first shop to get your QR code</p>
            <Link href="/onboarding" className="btn-main mt-6 inline-flex">Set up your shop →</Link>
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4 anim-slide d1">
              <div className="card-static p-5">
                <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">Total Reviews</p>
                <p className="mt-2 text-3xl font-bold text-white">{totalReviews}</p>
              </div>
              <div className="card-static p-5">
                <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">Public</p>
                <p className="mt-2 text-3xl font-bold text-emerald-400">{publicReviews}</p>
              </div>
              <div className="card-static p-5">
                <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">Private</p>
                <p className="mt-2 text-3xl font-bold text-amber-400">{privateReviews}</p>
              </div>
              <div className="card-static p-5">
                <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">Status</p>
                <p className="mt-2 text-sm font-semibold text-emerald-400 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  Active
                </p>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-5 anim-slide d2">
              {/* Shop Info — 2 cols */}
              <section className="card-static p-6 lg:col-span-2 space-y-5">
                <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">Your Shop</p>
                <div>
                  <h2 className="text-xl font-bold text-white">{shop.name}</h2>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">{shop.city} · {shop.niche}</p>
                </div>

                {shop.qrCodeUrl && (
                  <div className="bg-white p-3 rounded-xl inline-block">
                    <Image src={shop.qrCodeUrl} alt="Shop QR" width={160} height={160} className="rounded-lg" />
                  </div>
                )}

                <DashboardShopActions
                  qrCodeUrl={shop.qrCodeUrl || ""}
                  reviewLink={`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/r/${shop.slug}`}
                />
              </section>

              {/* Recent Reviews — 3 cols */}
              <section className="card-static p-6 lg:col-span-3 space-y-5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">Recent Reviews</p>
                  <p className="text-xs text-[var(--text-muted)]">Last 5</p>
                </div>

                {shop.reviews.length === 0 ? (
                  <div className="text-center py-10">
                    <div className="text-3xl mb-3">📭</div>
                    <p className="text-sm text-[var(--text-muted)]">No reviews yet. Share your QR code to start collecting!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {shop.reviews.map((review: ReviewRecord) => (
                      <div
                        key={review.id}
                        className={`flex items-center justify-between rounded-xl border p-4 transition ${
                          review.isPublic
                            ? "border-emerald-500/15 bg-emerald-500/[0.03]"
                            : "border-amber-500/15 bg-amber-500/[0.03]"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`h-9 w-9 rounded-lg flex items-center justify-center text-sm font-bold ${
                            review.isPublic ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"
                          }`}>
                            {review.averageRating.toFixed(1)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">
                              {review.averageRating.toFixed(1)} / 5.0
                            </p>
                            <p className="text-xs text-[var(--text-muted)]">
                              {new Date(review.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${
                          review.isPublic
                            ? "bg-emerald-500/10 text-emerald-400"
                            : "bg-amber-500/10 text-amber-400"
                        }`}>
                          {review.isPublic ? "✓ Public" : "🔒 Private"}
                        </span>
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
