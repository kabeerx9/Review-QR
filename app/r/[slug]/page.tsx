import ReviewForm from "@/components/ReviewForm";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";

interface RouteContext {
  params: Promise<{ slug: string }>;
}

export default async function PublicReviewPage({ params }: RouteContext) {
  const { slug } = await params;
  const shop = await prisma.shop.findUnique({ where: { slug } });

  if (!shop) notFound();

  if (!shop.isActive) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-amber-50/90 to-zinc-50 px-4">
        <div className="mx-auto w-full max-w-[420px] rounded-2xl border border-white/60 bg-white p-6 text-center shadow-md">
          <h1 className="text-xl font-semibold">This review page is currently inactive.</h1>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-amber-50/90 via-orange-50/40 to-zinc-50 px-4 py-8">
      <div className="mx-auto w-full max-w-[420px]">
        <ReviewForm
          shopId={shop.id}
          shopName={shop.name}
          city={shop.city}
          niche={shop.niche}
          googleReviewUrl={shop.googleReviewUrl}
        />
      </div>
    </main>
  );
}
