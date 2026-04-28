import { getSession } from "@/lib/auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import UserMenu from "@/components/UserMenu";
import prisma from "@/lib/prisma";

export default async function BillingPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const owner = await prisma.owner.findUnique({
    where: { id: session.ownerId },
  });

  if (!owner) redirect("/login");

  const trialEndsAt = owner.trialEndsAt ? owner.trialEndsAt.toLocaleDateString() : "N/A";

  return (
    <main className="min-h-screen bg-[#FAFAFA] font-sans">
      <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 text-white font-black shadow-md transition-transform group-hover:scale-105">
              RQ
            </div>
            <span className="font-black text-slate-900 tracking-tight text-lg">ReviewQR</span>
            <span className="text-xs font-bold text-slate-400 hidden sm:inline uppercase tracking-widest ml-2">/ Billing</span>
          </Link>
          <UserMenu ownerName={owner.name || "Owner"} />
        </div>
      </nav>

      <div className="relative mx-auto max-w-3xl px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Billing & Plans</h1>
          <p className="mt-1 text-slate-500 font-medium">Manage your subscription and billing details.</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Current Plan</p>
              <h2 className="text-2xl font-black text-slate-900">15-Day Free Trial</h2>
            </div>
            <span className="bg-orange-100 text-orange-700 text-xs font-bold px-3 py-1.5 rounded-lg border border-orange-200">
              Active
            </span>
          </div>

          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 mb-6">
            <p className="font-bold text-slate-900 mb-2">Your trial ends on {trialEndsAt}</p>
            <p className="text-sm text-slate-500">
              Upgrade to the Growth plan to keep your AI Auto-Replies and Reputation Shield active after the trial.
            </p>
          </div>

          <button className="w-full py-4 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors shadow-md">
            Upgrade Plan
          </button>
        </div>
      </div>
    </main>
  );
}
