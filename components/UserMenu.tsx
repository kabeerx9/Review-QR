"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LogOut, Settings, CreditCard, User, Building2 } from "lucide-react";

export default function UserMenu({ ownerName }: { ownerName: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="relative" ref={menuRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 transition-colors p-1.5 pr-3 rounded-full shadow-sm"
      >
        <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-black text-sm">
          {ownerName.charAt(0).toUpperCase() || "O"}
        </div>
        <span className="text-sm font-bold text-slate-700 hidden sm:block">
          {ownerName || "Owner"}
        </span>
        <svg className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-3 border-b border-slate-100">
            <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">Account</p>
            <p className="text-sm font-bold text-slate-900 truncate">{ownerName || "Owner"}</p>
          </div>
          
          <div className="p-1.5">
            <Link 
              href="/settings" 
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 w-full p-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-xl transition-colors"
            >
              <Settings className="w-4 h-4" />
              Settings
            </Link>
            <Link 
              href="/billing" 
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 w-full p-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-xl transition-colors"
            >
              <CreditCard className="w-4 h-4" />
              Billing
            </Link>
            <Link 
              href="/google-business" 
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 w-full p-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-xl transition-colors"
            >
              <Building2 className="w-4 h-4" />
              Google Business
            </Link>
          </div>
          
          <div className="p-1.5 border-t border-slate-100">
            <button 
              onClick={handleLogout}
              className="flex items-center gap-3 w-full p-2.5 text-sm font-bold text-red-600 hover:bg-red-50 rounded-xl transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Log out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
