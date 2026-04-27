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
      <main className="mx-auto flex min-h-screen max-w-xl items-center justify-center p-4">
        <div className="rounded-2xl border bg-white p-6 text-center shadow-sm">
          <h1 className="text-xl font-semibold">This review page is currently inactive.</h1>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-xl p-4 pt-10">
      <ReviewForm
        shopId={shop.id}
        shopName={shop.name}
        city={shop.city}
        niche={shop.niche}
        googleReviewUrl={shop.googleReviewUrl}
      />
    </main>
  );
}
