"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface SettingsFormProps {
  owner: {
    name: string;
    email: string | null;
    phone: string | null;
    autoReplyEnabled: boolean;
  };
}

export default function SettingsForm({ owner }: SettingsFormProps) {
  const router = useRouter();
  const [name, setName] = useState(owner.name || "");
  const [email, setEmail] = useState(owner.email || "");
  const [phone, setPhone] = useState(owner.phone || "");
  const [autoReplyEnabled, setAutoReplyEnabled] = useState(owner.autoReplyEnabled);
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const res = await fetch("/api/owner", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, autoReplyEnabled }),
      });

      if (!res.ok) {
        throw new Error("Failed to update settings.");
      }

      setMessage({ type: "success", text: "Settings saved successfully!" });
      router.refresh();
    } catch (error) {
      setMessage({ type: "error", text: "An error occurred while saving." });
    } finally {
      setLoading(false);
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Full Name</label>
          <input 
            type="text" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all font-medium text-slate-900"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Email Address</label>
          <input 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all font-medium text-slate-900"
            required
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">WhatsApp Number (For Alerts)</label>
          <input 
            type="tel" 
            value={phone} 
            onChange={(e) => setPhone(e.target.value)} 
            placeholder="+91..."
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all font-medium text-slate-900"
          />
        </div>
      </div>

      <div className="py-6 border-y border-slate-100">
        <div className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-100 cursor-pointer" onClick={() => setAutoReplyEnabled(!autoReplyEnabled)}>
          <div>
            <p className="font-bold text-slate-900 text-lg">AI Auto-Replies</p>
            <p className="text-sm text-slate-500 font-medium mt-1">Automatically draft and post human-like replies to new Google reviews.</p>
          </div>
          <div className={`w-14 h-8 rounded-full relative transition-colors ${autoReplyEnabled ? 'bg-emerald-500 shadow-inner' : 'bg-slate-300'}`}>
            <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform ${autoReplyEnabled ? 'right-1 translate-x-0' : 'left-1 translate-x-0'}`} />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button 
          type="submit" 
          disabled={loading}
          className="px-8 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors shadow-md disabled:opacity-50"
        >
          {loading ? "Saving..." : "Save Changes"}
        </button>

        {message.text && (
          <span className={`text-sm font-bold ${message.type === 'success' ? 'text-emerald-600' : 'text-red-600'}`}>
            {message.text}
          </span>
        )}
      </div>
    </form>
  );
}
