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
      <main className="flex min-h-screen items-center justify-center bg-[var(--bg-primary)] px-5">
        <div className="fixed inset-0 bg-noise pointer-events-none" />
        <div className="card-static relative z-10 w-full max-w-[420px] p-8 text-center anim-scale">
          <div className="text-3xl mb-3">⏸️</div>
          <h1 className="text-xl font-bold text-white">This review page is currently inactive.</h1>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">Please contact the shop owner.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--bg-primary)] px-5 py-8">
      <div className="fixed inset-0 bg-noise pointer-events-none" />
      <div className="relative z-10 mx-auto w-full max-w-[420px]">
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
