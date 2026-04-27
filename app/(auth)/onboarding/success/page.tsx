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
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-lg space-y-5 rounded-2xl border bg-white p-6 text-center shadow-sm">
        <h1 className="text-2xl font-semibold">Your QR code is ready! 🎉</h1>
        {qrCodeUrl ? (
          <Image
            src={qrCodeUrl}
            alt="Shop QR code"
            width={256}
            height={256}
            className="mx-auto rounded-xl border p-2"
          />
        ) : (
          <p className="text-sm text-zinc-500">Loading QR...</p>
        )}
        <div className="space-y-2">
          <a
            href={qrCodeUrl}
            download="reviewqr-code.png"
            className="block w-full rounded-xl bg-orange-500 py-2 text-sm font-semibold text-white"
          >
            Download QR Code
          </a>
          <Link
            href="/dashboard"
            className="block w-full rounded-xl border py-2 text-sm font-semibold text-zinc-700"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
