"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { NICHE_LABELS } from "@/constants/niches";

interface User {
  id: string;
  name: string;
  email: string | null;
  role: "USER" | "SUPERADMIN";
  subscriptionStatus: string;
  subscriptionPlan: string | null;
  trialEndsAt: string | null;
  mustChangePassword: boolean;
  disabledAt: string | null;
  internalNotes: string;
  createdAt: string;
  lastLoginAt: string | null;
  shopsCount: number;
}

interface Stats {
  total: number;
  trial: number;
  active: number;
  expired: number;
  cancelled: number;
  disabled: number;
}

export default function SuperAdminDashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<Stats>({ total: 0, trial: 0, active: 0, expired: 0, cancelled: 0, disabled: 0 });
  const [loading, setLoading] = useState(true);
  const [currentSuperAdminId, setCurrentSuperAdminId] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    q: "",
    subscriptionStatus: "all",
    role: "all",
    disabled: "all",
    mustChangePassword: "all",
  });
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createdUsers, setCreatedUsers] = useState<Array<{ name: string; email: string; temporaryPassword: string; trialEndsAt: string }>>([]);
  const [createNiche, setCreateNiche] = useState("RESTAURANT");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        ...filters,
        page: page.toString(),
        pageSize: pageSize.toString(),
      });
      const res = await fetch(`/api/superadmin/users?${params}`);
      const data = await res.json();
      setUsers(data.users || []);
      setTotal(data.total || 0);
      if (data.stats) setStats(data.stats);
      if (data.currentSuperAdminId) setCurrentSuperAdminId(data.currentSuperAdminId);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  async function handleCreateUser(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCreateError("");
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const internalNotes = formData.get("internalNotes") as string;
    const city = formData.get("city") as string;
    const niche = formData.get("niche") as string;
    const customNiche = formData.get("customNiche") as string;
    const googleReviewUrl = formData.get("googleReviewUrl") as string;
    const googleMapsUrl = formData.get("googleMapsUrl") as string;

    if (!name || !email) {
      setCreateError("Name and email are required");
      return;
    }

    try {
      const res = await fetch("/api/superadmin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, internalNotes, city, niche, customNiche, googleReviewUrl, googleMapsUrl }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data.error === "email_taken" ? "Email already exists" : data.error === "invalid_input" ? "Name and email are required" : data.error || "Failed to create user";
        setCreateError(msg);
        return;
      }
      setCreatedUsers([{ ...data.user, temporaryPassword: data.temporaryPassword }]);
      setShowCreateForm(false);
      setCreateError("");
      fetchUsers();
    } catch (error) {
      setCreateError("Network error. Please try again.");
    }
  }

  async function handleToggleStatus(userId: string, currentDisabled: string | null) {
    try {
      await fetch(`/api/superadmin/users/${userId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ disabled: !currentDisabled }),
      });
      fetchUsers();
    } catch (error) {
      console.error("Failed to toggle status:", error);
    }
  }

  const totalPages = Math.ceil(total / pageSize);

  function daysLeft(trialEndsAt: string | null): string {
    if (!trialEndsAt) return "-";
    const days = Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (days < 0) return "Expired";
    return `${days}d left`;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Superadmin Dashboard</h1>
          <p className="text-sm text-slate-600">Manage users and accounts</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { setShowCreateForm(true); setCreateError(""); }}
            className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600"
          >
            Create User
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium text-slate-500 uppercase">Total Users</p>
          <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium text-slate-500 uppercase">Trial</p>
          <p className="text-2xl font-bold text-blue-600">{stats.trial}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium text-slate-500 uppercase">Active</p>
          <p className="text-2xl font-bold text-green-600">{stats.active}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium text-slate-500 uppercase">Expired</p>
          <p className="text-2xl font-bold text-red-600">{stats.expired}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium text-slate-500 uppercase">Cancelled</p>
          <p className="text-2xl font-bold text-slate-600">{stats.cancelled}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium text-slate-500 uppercase">Disabled</p>
          <p className="text-2xl font-bold text-red-600">{stats.disabled}</p>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <div className="flex flex-wrap gap-3 mb-4">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={filters.q}
            onChange={(e) => { setFilters({ ...filters, q: e.target.value }); setPage(1); }}
            className="flex-1 min-w-[200px] rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none"
          />
          <select
            value={filters.subscriptionStatus}
            onChange={(e) => { setFilters({ ...filters, subscriptionStatus: e.target.value }); setPage(1); }}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none"
          >
            <option value="all">All Status</option>
            <option value="TRIAL">Trial</option>
            <option value="ACTIVE">Active</option>
            <option value="EXPIRED">Expired</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          <select
            value={filters.role}
            onChange={(e) => { setFilters({ ...filters, role: e.target.value }); setPage(1); }}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none"
          >
            <option value="all">All Roles</option>
            <option value="USER">User</option>
            <option value="SUPERADMIN">Superadmin</option>
          </select>
          <select
            value={filters.disabled}
            onChange={(e) => { setFilters({ ...filters, disabled: e.target.value }); setPage(1); }}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none"
          >
            <option value="all">All Status</option>
            <option value="false">Active</option>
            <option value="true">Disabled</option>
          </select>
          <select
            value={filters.mustChangePassword}
            onChange={(e) => { setFilters({ ...filters, mustChangePassword: e.target.value }); setPage(1); }}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none"
          >
            <option value="all">Password Change</option>
            <option value="false">No</option>
            <option value="true">Yes</option>
          </select>
        </div>

        {loading ? (
          <p className="text-sm text-slate-600">Loading...</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="px-3 py-2 text-left font-medium text-slate-600">Name</th>
                    <th className="px-3 py-2 text-left font-medium text-slate-600">Email</th>
                    <th className="px-3 py-2 text-left font-medium text-slate-600">Role</th>
                    <th className="px-3 py-2 text-left font-medium text-slate-600">Status</th>
                    <th className="px-3 py-2 text-left font-medium text-slate-600">Plan</th>
                    <th className="px-3 py-2 text-left font-medium text-slate-600">Trial</th>
                    <th className="px-3 py-2 text-left font-medium text-slate-600">Disabled</th>
                    <th className="px-3 py-2 text-left font-medium text-slate-600">Pwd Change</th>
                    <th className="px-3 py-2 text-left font-medium text-slate-600">Shops</th>
                    <th className="px-3 py-2 text-left font-medium text-slate-600">Created</th>
                    <th className="px-3 py-2 text-left font-medium text-slate-600">Last Login</th>
                    <th className="px-3 py-2 text-left font-medium text-slate-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-3 py-2 font-medium text-slate-900">{user.name}</td>
                      <td className="px-3 py-2 text-slate-600">{user.email}</td>
                      <td className="px-3 py-2">
                        <span className={`rounded px-2 py-0.5 text-xs font-medium ${user.role === "SUPERADMIN" ? "bg-purple-100 text-purple-700" : "bg-slate-100 text-slate-700"}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <span className={`rounded px-2 py-0.5 text-xs font-medium ${
                          user.subscriptionStatus === "ACTIVE" ? "bg-green-100 text-green-700" :
                          user.subscriptionStatus === "TRIAL" ? "bg-blue-100 text-blue-700" :
                          user.subscriptionStatus === "EXPIRED" ? "bg-red-100 text-red-700" :
                          "bg-slate-100 text-slate-700"
                        }`}>
                          {user.subscriptionStatus}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-slate-600">{user.subscriptionPlan || "-"}</td>
                      <td className="px-3 py-2 text-slate-600 whitespace-nowrap">
                        {user.trialEndsAt ? (
                          <span title={new Date(user.trialEndsAt).toLocaleDateString()}>
                            {daysLeft(user.trialEndsAt)}
                          </span>
                        ) : "-"}
                      </td>
                      <td className="px-3 py-2">
                        {user.disabledAt ? (
                          <span className="rounded bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">Yes</span>
                        ) : (
                          <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">No</span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        {user.mustChangePassword ? (
                          <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">Yes</span>
                        ) : (
                          <span className="text-xs text-slate-400">No</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-slate-600">{user.shopsCount}</td>
                      <td className="px-3 py-2 text-slate-500 whitespace-nowrap text-xs">{new Date(user.createdAt).toLocaleDateString()}</td>
                      <td className="px-3 py-2 text-slate-500 whitespace-nowrap text-xs">{user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : "Never"}</td>
                      <td className="px-3 py-2">
                        <div className="flex gap-2">
                          {user.id !== currentSuperAdminId && (
                            <>
                              <Link
                                href={`/superadmin/users/${user.id}`}
                                className="rounded-lg bg-blue-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-600 transition-colors"
                              >
                                View
                              </Link>
                              <button
                                onClick={() => handleToggleStatus(user.id, user.disabledAt)}
                                className={`rounded-lg px-3 py-1.5 text-xs font-medium text-white transition-colors ${
                                  user.disabledAt ? "bg-green-500 hover:bg-green-600" : "bg-red-500 hover:bg-red-600"
                                }`}
                              >
                                {user.disabledAt ? "Enable" : "Disable"}
                              </button>
                            </>
                          )}
                          {user.id === currentSuperAdminId && (
                            <span className="text-xs text-slate-400 italic">(You)</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                <p className="text-xs text-slate-500">
                  Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(page - 1)}
                    disabled={page <= 1}
                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="flex items-center text-xs text-slate-600 px-2">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={page >= totalPages}
                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {showCreateForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 sm:p-6">
          <div className="w-full max-w-lg rounded-lg border border-slate-200 bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Create User</h2>
            <form onSubmit={handleCreateUser} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                  <input
                    name="name"
                    type="text"
                    required
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white text-slate-900 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                  <input
                    name="email"
                    type="email"
                    required
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white text-slate-900 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">City</label>
                  <input
                    name="city"
                    type="text"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white text-slate-900 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Business Type</label>
                  <select
                    name="niche"
                    value={createNiche}
                    onChange={(e) => setCreateNiche(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white text-slate-900 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none"
                  >
                    {Object.entries(NICHE_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>
              {createNiche === "OTHER" && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Specify Business Type</label>
                  <input
                    name="customNiche"
                    type="text"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white text-slate-900 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Specialties (Optional)</label>
                <input
                  name="specialties"
                  type="text"
                  placeholder="e.g. North Indian, Italian, Bakery"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white text-slate-900 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Google Review URL (Optional)</label>
                  <input
                    name="googleReviewUrl"
                    type="url"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white text-slate-900 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Google Maps URL (Optional)</label>
                  <input
                    name="googleMapsUrl"
                    type="url"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white text-slate-900 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Internal Notes</label>
                <textarea
                  name="internalNotes"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white text-slate-900 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none"
                  rows={2}
                />
              </div>
              {createError && (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{createError}</p>
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {createdUsers.length > 0 && !showCreateForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 sm:p-6">
          <div className="w-full max-w-lg rounded-lg border border-slate-200 bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold text-slate-900 mb-4">User Created</h2>
            <p className="text-sm text-slate-600 mb-4">
              Copy this temporary password now. It won't be shown again.
            </p>
            <div className="space-y-3">
              {createdUsers.map((user, i) => (
                <div key={i} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <div className="mb-3">
                    <p className="font-medium text-slate-900">{user.name}</p>
                    <p className="text-sm text-slate-600">{user.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-mono bg-white border border-slate-300 rounded px-2 py-1 text-slate-900 flex-1">
                      {user.temporaryPassword}
                    </p>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(user.temporaryPassword);
                        setCopiedIndex(i);
                        setTimeout(() => setCopiedIndex(null), 2000);
                      }}
                      className={`rounded-lg px-3 py-1 text-xs font-medium text-white transition-all ${
                        copiedIndex === i
                          ? "bg-green-500"
                          : "bg-blue-500 hover:bg-blue-600"
                      }`}
                    >
                      {copiedIndex === i ? "Copied!" : "Copy"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => setCreatedUsers([])}
              className="mt-4 w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
