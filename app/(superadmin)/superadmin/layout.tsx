import Link from "next/link";
import { requireSuperAdmin } from "@/lib/auth";

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireSuperAdmin();
  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link href="/superadmin" className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 text-white font-bold">
                  RQ
                </div>
                <span className="font-bold text-slate-900">ReviewQR / Superadmin</span>
              </Link>
              <Link
                href="/superadmin"
                className="text-sm font-medium text-slate-600 hover:text-slate-900"
              >
                Users
              </Link>
            </div>
            <form action="/api/auth/logout" method="POST">
              <button
                type="submit"
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
              >
                Logout
              </button>
            </form>
          </div>
        </div>
      </nav>
      <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
    </div>
  );
}
