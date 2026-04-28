import { getSession } from "@/lib/auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import UserMenu from "@/components/UserMenu";
import prisma from "@/lib/prisma";

export default async function SettingsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const owner = await prisma.owner.findUnique({
    where: { id: session.ownerId },
  });

  if (!owner) redirect("/login");

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
          <div className="flex items-center gap-6 pb-8 border-b border-slate-100">
            <div className="w-20 h-20 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-3xl font-black">
              {owner.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">{owner.name}</h2>
              <p className="text-slate-500">{owner.email}</p>
            </div>
          </div>

          <div className="py-8">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div>
                <p className="font-bold text-slate-900">AI Auto-Replies</p>
                <p className="text-sm text-slate-500">Automatically reply to new Google reviews.</p>
              </div>
              <div className="w-12 h-6 bg-emerald-500 rounded-full relative shadow-inner">
                <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-100 text-center">
            <p className="text-slate-400 text-sm font-medium">More settings coming soon.</p>
          </div>
        </div>
      </div>
    </main>
  );
}
