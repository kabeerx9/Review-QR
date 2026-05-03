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
      <main className="flex min-h-screen items-center justify-center bg-[#FAFAFA] px-5 font-sans">
        <div className="bg-white border border-slate-200 rounded-[2rem] relative z-10 w-full max-w-[420px] p-8 text-center shadow-sm anim-scale">
          <div className="text-4xl mb-4">⏸️</div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Temporarily Inactive</h1>
          <p className="mt-2 text-sm font-medium text-slate-500">This review page is currently paused. Please contact the shop owner.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#FAFAFA] px-5 py-12 font-sans flex items-center justify-center">
      <div className="relative z-10 w-full max-w-[420px] flex flex-col h-full">
        <ReviewForm
          shopId={shop.id}
          shopName={shop.name}
          city={shop.city}
          niche={shop.niche}
          googleReviewUrl={shop.googleReviewUrl}
        />

        <a href="/" target="_blank" className="mt-12 mb-4 block text-center opacity-60 hover:opacity-100 transition-opacity">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Powered by</p>
          <p className="text-xl font-black text-slate-900 tracking-tight">Review<span className="text-orange-500">QR</span></p>
        </a>
      </div>
    </main>
  );
}
