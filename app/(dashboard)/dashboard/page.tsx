import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { redirect } from "next/navigation";
import Image from "next/image";

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
  const totalReviews = owner.shops.reduce((acc, current) => acc + current.reviews.length, 0);
  const trialEndsAt = owner.trialEndsAt ? owner.trialEndsAt.toLocaleDateString() : "N/A";

  return (
    <main className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Welcome, {owner.name || "Owner"}!</h1>
          <p className="text-sm text-zinc-600">Trial ends on {trialEndsAt}</p>
        </div>
        <form action="/api/auth/logout" method="post">
          <button className="rounded-xl border px-3 py-2 text-sm font-medium">Logout</button>
        </form>
      </header>

      {!shop ? (
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <p className="text-sm">No shop yet.</p>
          <Link href="/onboarding" className="mt-2 inline-block text-sm font-semibold text-orange-600">
            Set one up →
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          <section className="rounded-2xl border bg-white p-6 shadow-sm">
            <p className="text-xs uppercase text-zinc-500">Shop</p>
            <h2 className="mt-1 text-xl font-semibold">{shop.name}</h2>
            <p className="text-sm text-zinc-600">
              {shop.city} • {shop.niche}
            </p>
            {shop.qrCodeUrl ? (
              <Image
                src={shop.qrCodeUrl}
                alt="Shop QR"
                width={208}
                height={208}
                className="mt-4 rounded-xl border p-2"
              />
            ) : null}
            <div className="mt-4 flex flex-wrap gap-2">
              <a
                href={shop.qrCodeUrl || "#"}
                download="reviewqr-code.png"
                className="rounded-xl bg-orange-500 px-3 py-2 text-sm font-semibold text-white"
              >
                Download QR
              </a>
              <a
                href={`/r/${shop.slug}`}
                target="_blank"
                rel="noreferrer"
                className="rounded-xl border px-3 py-2 text-sm font-medium"
              >
                Open Review Link
              </a>
            </div>
          </section>

          <section className="rounded-2xl border bg-white p-6 shadow-sm">
            <p className="text-xs uppercase text-zinc-500">Reviews</p>
            <h3 className="mt-1 text-xl font-semibold">{totalReviews} reviews collected</h3>
            <div className="mt-4 space-y-2">
              {shop.reviews.length === 0 ? (
                <p className="text-sm text-zinc-500">No reviews yet.</p>
              ) : (
                shop.reviews.map((review) => (
                  <div key={review.id} className="rounded-xl border p-3 text-sm">
                    <p className="font-medium">
                      {new Date(review.createdAt).toLocaleDateString()} • {review.averageRating.toFixed(1)} / 5
                    </p>
                    <p className={review.isPublic ? "text-emerald-600" : "text-amber-600"}>
                      {review.isPublic ? "Public" : "Private"}
                    </p>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
