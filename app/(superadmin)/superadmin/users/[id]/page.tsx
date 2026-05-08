"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: "USER" | "SUPERADMIN";
  subscriptionStatus: string;
  subscriptionPlan: string | null;
  trialStartedAt: string | null;
  trialEndsAt: string | null;
  mustChangePassword: boolean;
  disabledAt: string | null;
  internalNotes: string;
  autoReplyEnabled: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
  razorpayCustomerId: string | null;
  razorpaySubscriptionId: string | null;
  shops: Array<{
    id: string;
    name: string;
    city: string;
    niche: string;
    isActive: boolean;
    slug: string;
    qrCodeUrl: string | null;
    googleReviewUrl: string;
    googleMapsUrl: string;
    specialties: string | null;
  }>;
  onboardedBy: {
    id: string;
    name: string;
    email: string | null;
  } | null;
  superAdminAuditTargets: Array<{
    id: string;
    action: string;
    createdAt: string;
    actor: {
      name: string;
      email: string | null;
    };
  }>;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function UserDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState("");
  const [editingSpecialty, setEditingSpecialty] = useState(false);
  const [specialtyValue, setSpecialtyValue] = useState("");
  const [specialtyShopId, setSpecialtyShopId] = useState<string | null>(null);
  const [savingSpecialty, setSavingSpecialty] = useState(false);
  const [specialtySaved, setSpecialtySaved] = useState(false);

  useEffect(() => {
    fetchUser();
  }, [resolvedParams.id]);

  async function fetchUser() {
    setLoading(true);
    try {
      const res = await fetch(`/api/superadmin/users/${resolvedParams.id}`);
      const data = await res.json();
      if (data.user) {
        setUser(data.user);
        setNotesValue(data.user.internalNotes || "");
      }
    } catch (error) {
      console.error("Failed to fetch user:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveNotes() {
    try {
      await fetch(`/api/superadmin/users/${resolvedParams.id}/notes`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ internalNotes: notesValue }),
      });
      setEditingNotes(false);
      fetchUser();
    } catch (error) {
      console.error("Failed to save notes:", error);
    }
  }

  async function handleSaveSpecialty() {
    if (!specialtyShopId) return;
    setSavingSpecialty(true);
    try {
      const res = await fetch(`/api/superadmin/shops/${specialtyShopId}/specialty`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ specialties: specialtyValue }),
      });
      if (res.ok) {
        setSpecialtySaved(true);
        setTimeout(() => {
          setEditingSpecialty(false);
          setSpecialtyShopId(null);
          setSpecialtySaved(false);
          if (user) {
            setUser({
              ...user,
              shops: user.shops.map(shop =>
                shop.id === specialtyShopId
                  ? { ...shop, specialties: specialtyValue || null }
                  : shop
              )
            });
          }
        }, 800);
      }
    } catch (error) {
      console.error("Failed to save specialty:", error);
    } finally {
      setSavingSpecialty(false);
    }
  }

  async function handleToggleStatus() {
    if (!user) return;
    try {
      await fetch(`/api/superadmin/users/${resolvedParams.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ disabled: !user.disabledAt }),
      });
      fetchUser();
    } catch (error) {
      console.error("Failed to toggle status:", error);
    }
  }

  if (loading) {
    return <p className="text-sm text-slate-600">Loading...</p>;
  }

  if (!user) {
    return <p className="text-sm text-slate-600">User not found</p>;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/superadmin" className="text-sm text-slate-600 hover:text-slate-900">
            ← Back to Users
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 mt-2">{user.name}</h1>
          <p className="text-sm text-slate-600">{user.email}</p>
        </div>
        <button
          onClick={handleToggleStatus}
          className={`rounded-lg px-4 py-2 text-sm font-medium ${
            user.disabledAt
              ? "bg-green-500 text-white hover:bg-green-600"
              : "bg-red-500 text-white hover:bg-red-600"
          }`}
        >
          {user.disabledAt ? "Enable Account" : "Disable Account"}
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Account Info</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-600">Role</span>
              <span className="font-medium text-slate-900">{user.role}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Email</span>
              <span className="font-medium text-slate-900">{user.email}</span>
            </div>
            {user.phone && (
              <div className="flex justify-between">
                <span className="text-slate-600">Phone</span>
                <span className="font-medium text-slate-900">{user.phone}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-600">Subscription Status</span>
              <span className="font-medium text-slate-900">{user.subscriptionStatus}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Plan</span>
              <span className="font-medium text-slate-900">{user.subscriptionPlan || "-"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Trial Started</span>
              <span className="font-medium text-slate-900">
                {user.trialStartedAt ? new Date(user.trialStartedAt).toLocaleDateString() : "-"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Trial Ends</span>
              <span className="font-medium text-slate-900">
                {user.trialEndsAt ? new Date(user.trialEndsAt).toLocaleDateString() : "-"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Must Change Password</span>
              <span className="font-medium text-slate-900">{user.mustChangePassword ? "Yes" : "No"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Disabled</span>
              <span className="font-medium text-slate-900">{user.disabledAt ? "Yes" : "No"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Auto Reply Enabled</span>
              <span className="font-medium text-slate-900">{user.autoReplyEnabled ? "Yes" : "No"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Created At</span>
              <span className="font-medium text-slate-900">
                {new Date(user.createdAt).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Updated At</span>
              <span className="font-medium text-slate-900">
                {new Date(user.updatedAt).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Last Login</span>
              <span className="font-medium text-slate-900">
                {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : "Never"}
              </span>
            </div>
            {user.onboardedBy && (
              <div className="flex justify-between">
                <span className="text-slate-600">Onboarded By</span>
                <span className="font-medium text-slate-900">{user.onboardedBy.name}</span>
              </div>
            )}
            {user.razorpayCustomerId && (
              <div className="flex justify-between">
                <span className="text-slate-600">Razorpay Customer ID</span>
                <span className="font-mono text-xs text-slate-900">{user.razorpayCustomerId}</span>
              </div>
            )}
            {user.razorpaySubscriptionId && (
              <div className="flex justify-between">
                <span className="text-slate-600">Razorpay Subscription ID</span>
                <span className="font-mono text-xs text-slate-900">{user.razorpaySubscriptionId}</span>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Payment Status</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-600">Subscription Status</span>
              <span className={`font-medium ${
                user.subscriptionStatus === "ACTIVE" ? "text-green-600" :
                user.subscriptionStatus === "TRIAL" ? "text-blue-600" :
                user.subscriptionStatus === "EXPIRED" ? "text-red-600" :
                "text-slate-900"
              }`}>{user.subscriptionStatus}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Plan</span>
              <span className="font-medium text-slate-900">{user.subscriptionPlan || "Not subscribed"}</span>
            </div>
            {user.trialEndsAt && (
              <div className="flex justify-between">
                <span className="text-slate-600">Trial Ends</span>
                <span className="font-medium text-slate-900">
                  {new Date(user.trialEndsAt).toLocaleDateString()}
                </span>
              </div>
            )}
            {user.razorpayCustomerId && (
              <div className="flex justify-between">
                <span className="text-slate-600">Has Customer ID</span>
                <span className="font-medium text-green-600">Yes</span>
              </div>
            )}
            {user.razorpaySubscriptionId && (
              <div className="flex justify-between">
                <span className="text-slate-600">Has Subscription</span>
                <span className="font-medium text-green-600">Active</span>
              </div>
            )}
            {!user.razorpayCustomerId && (
              <div className="flex justify-between">
                <span className="text-slate-600">Has Customer ID</span>
                <span className="font-medium text-slate-400">No</span>
              </div>
            )}
            {!user.razorpaySubscriptionId && user.subscriptionStatus !== "TRIAL" && (
              <div className="flex justify-between">
                <span className="text-slate-600">Has Subscription</span>
                <span className="font-medium text-red-600">No</span>
              </div>
            )}
          </div>
          {user.subscriptionStatus === "TRIAL" && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-xs text-blue-700 font-medium mb-2">Trial Period</p>
              <p className="text-xs text-blue-600">
                User is on trial. Trial ends on {user.trialEndsAt ? new Date(user.trialEndsAt).toLocaleDateString() : "N/A"}.
              </p>
            </div>
          )}
          {user.subscriptionStatus === "EXPIRED" && (
            <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-200">
              <p className="text-xs text-red-700 font-medium mb-2">Subscription Expired</p>
              <p className="text-xs text-red-600">
                User needs to renew subscription. Share payment mandate to enable payment.
              </p>
            </div>
          )}
          {(user.subscriptionStatus === "CANCELLED" || user.subscriptionStatus === "EXPIRED") && (
            <div className="mt-4 space-y-2">
              <button
                onClick={() => {
                  const subject = encodeURIComponent("Subscription Renewal - ReviewQR");
                  const body = encodeURIComponent(`Hi ${user.name},\n\nYour ReviewQR subscription has ${user.subscriptionStatus.toLowerCase()}. To continue using our service, please renew your subscription.\n\nClick here to make payment: ${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/billing\n\nIf you have any questions, please reply to this email.\n\nThanks,\nReviewQR Team`);
                  window.location.href = `mailto:${user.email}?subject=${subject}&body=${body}`;
                }}
                className="w-full rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 transition-colors"
              >
                Send Payment Mandate via Email
              </button>
            </div>
          )}
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Internal Notes</h2>
          <p className="text-xs text-slate-500 mb-4">Private notes for superadmin reference only</p>
          {editingNotes ? (
            <div className="space-y-3">
              <textarea
                value={notesValue}
                onChange={(e) => setNotesValue(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none"
                rows={4}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setEditingNotes(false);
                    setNotesValue(user.internalNotes);
                  }}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveNotes}
                  className="rounded-lg bg-orange-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-orange-600"
                >
                  Save
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-slate-600 whitespace-pre-wrap">{user.internalNotes || "No notes"}</p>
              <button
                onClick={() => setEditingNotes(true)}
                className="text-sm text-orange-600 hover:text-orange-800"
              >
                Edit Notes
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-4">Shops ({user.shops.length})</h2>
        {user.shops.length === 0 ? (
          <p className="text-sm text-slate-600">No shops</p>
        ) : (
          <div className="space-y-4">
            {user.shops.map((shop) => (
              <div key={shop.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-medium text-slate-900">{shop.name}</p>
                    <p className="text-xs text-slate-600">{shop.city} · {shop.niche}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded px-2 py-1 text-xs font-medium ${shop.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {shop.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                  <div>
                    <span className="text-slate-500">Slug:</span>
                    <span className="text-slate-900 ml-1">{shop.slug}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-500">Specialty:</span>
                    {editingSpecialty && specialtyShopId === shop.id ? (
                      <div className="mt-2">
                        {savingSpecialty ? (
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-600"></div>
                            Saving...
                          </div>
                        ) : specialtySaved ? (
                          <div className="flex items-center gap-2 text-sm text-green-600">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Saved!
                          </div>
                        ) : (
                          <>
                            <input
                              type="text"
                              value={specialtyValue}
                              onChange={(e) => setSpecialtyValue(e.target.value)}
                              className="border border-slate-300 rounded px-3 py-2 text-sm w-full text-slate-900 bg-white"
                              placeholder="Enter specialty"
                            />
                            <div className="flex gap-2 mt-2">
                              <button
                                onClick={handleSaveSpecialty}
                                className="text-sm bg-green-500 text-white px-3 py-1.5 rounded hover:bg-green-600"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => {
                                  setEditingSpecialty(false);
                                  setSpecialtyShopId(null);
                                }}
                                className="text-sm bg-slate-300 text-slate-700 px-3 py-1.5 rounded hover:bg-slate-400"
                              >
                                Cancel
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <span className="text-slate-900 ml-1">{shop.specialties || "-"}</span>
                        <button
                          onClick={() => {
                            setEditingSpecialty(true);
                            setSpecialtyValue(shop.specialties || "");
                            setSpecialtyShopId(shop.id);
                          }}
                          className="text-xs text-orange-600 hover:text-orange-800 ml-2"
                        >
                          Edit
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-2 mb-3">
                  {shop.googleReviewUrl && (
                    <div>
                      <span className="text-slate-500 text-xs">Google Review:</span>
                      <a href={shop.googleReviewUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-xs ml-1 hover:underline truncate block">
                        {shop.googleReviewUrl}
                      </a>
                    </div>
                  )}
                  {shop.googleMapsUrl && (
                    <div>
                      <span className="text-slate-500 text-xs">Google Maps:</span>
                      <a href={shop.googleMapsUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-xs ml-1 hover:underline truncate block">
                        {shop.googleMapsUrl}
                      </a>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`/r/${shop.slug}`}
                    target="_blank"
                    className="rounded-lg bg-blue-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-600 transition-colors"
                  >
                    View QR Page
                  </Link>
                  {shop.qrCodeUrl && (
                    <button
                      onClick={() => shop.qrCodeUrl && window.open(shop.qrCodeUrl, '_blank')}
                      className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      Download QR
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-4">Audit Logs</h2>
        {!user.superAdminAuditTargets || user.superAdminAuditTargets.length === 0 ? (
          <p className="text-sm text-slate-600">No audit logs</p>
        ) : (
          <div className="space-y-2">
            {user.superAdminAuditTargets.map((log: any) => (
              <div key={log.id} className="flex justify-between items-center rounded-lg border border-slate-100 bg-slate-50 p-3">
                <div>
                  <p className="font-medium text-slate-900">{log.action}</p>
                  <p className="text-xs text-slate-600">By {log.actor.name}</p>
                </div>
                <p className="text-xs text-slate-500">{new Date(log.createdAt).toLocaleString()}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
