import { requireOwner } from "@/lib/auth";
import Link from "next/link";
import UserMenu from "@/components/UserMenu";
import prisma from "@/lib/prisma";

import SettingsForm from "@/components/SettingsForm";

export default async function SettingsPage() {
  const owner = await requireOwner();
  const ownerWithShops = await prisma.owner.findUnique({
    where: { id: owner.id },
    include: { shops: true },
  });
  const shop = ownerWithShops?.shops[0];

  return (
    <main className="min-h-screen bg-[#FAFAFA] font-sans">
      <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 text-white font-black shadow-md transition-transform group-hover:scale-105">
              RQ
            </div>
            <span className="font-black text-slate-900 tracking-tight text-lg">ReviewQR</span>
            <span className="text-xs font-bold text-slate-400 hidden sm:inline uppercase tracking-widest ml-2">/ Settings</span>
          </Link>
          <UserMenu ownerName={owner.name || "Owner"} />
        </div>
      </nav>

      <div className="relative mx-auto max-w-3xl px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Settings</h1>
          <p className="mt-1 text-slate-500 font-medium">Manage your profile and shop preferences.</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm">
          <div className="flex items-center gap-6 pb-8 mb-8 border-b border-slate-100">
            <div className="w-20 h-20 bg-gradient-to-br from-orange-100 to-red-100 text-orange-600 rounded-full flex items-center justify-center text-3xl font-black shadow-inner">
              {owner.name.charAt(0).toUpperCase() || "O"}
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900">{owner.name || "Shop Owner"}</h2>
              <p className="text-slate-500 font-medium">{owner.email}</p>
            </div>
          </div>

          <SettingsForm owner={{
            name: owner.name,
            email: owner.email,
            phone: owner.phone,
            autoReplyEnabled: owner.autoReplyEnabled
          }} shop={shop ? { id: shop.id, specialties: (shop as any).specialties || "" } : null} />
        </div>
      </div>
    </main>
  );
}
