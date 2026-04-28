import Link from "next/link";
import Image from "next/image";
import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";

interface OnboardingSuccessProps {
  searchParams: Promise<{ shopId?: string }>;
}

export default async function OnboardingSuccessPage({ searchParams }: OnboardingSuccessProps) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { shopId } = await searchParams;
  const shop = shopId
    ? await prisma.shop.findFirst({
        where: { id: shopId, ownerId: session.ownerId },
      })
    : null;

  const qrCodeUrl = shop?.qrCodeUrl || "";

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--bg-primary)] px-5 py-12">
      <div className="fixed inset-0 bg-noise pointer-events-none" />

      <div className="relative z-10 w-full max-w-md text-center space-y-6 anim-scale">
        <div className="text-5xl">🎉</div>
        <h1 className="text-3xl font-bold heading-accent">You&apos;re all set!</h1>
        <p className="text-[var(--text-secondary)]">Your QR code is ready. Print it and place it at your shop.</p>

        {qrCodeUrl ? (
          <div className="card-static p-6 inline-block">
            <div className="bg-white p-3 rounded-xl inline-block">
              <Image src={qrCodeUrl} alt="Shop QR code" width={200} height={200} className="rounded-lg" />
            </div>
          </div>
        ) : (
          <div className="card-static p-8">
            <p className="text-sm text-[var(--text-muted)]">Generating QR...</p>
          </div>
        )}

        <div className="space-y-3">
          <a href={qrCodeUrl} download="reviewqr-code.png" className="btn-main w-full py-3 block">
            ⬇ Download QR Code
          </a>
          <Link href="/dashboard" className="btn-ghost w-full py-3 block">
            Go to Dashboard →
          </Link>
        </div>
      </div>
    </main>
  );
}
