"use client";

import { getUser } from "@/lib/auth";

export default function Topbar() {
  const user = getUser();
  const initials = user?.username ? user.username.slice(0, 2).toUpperCase() : "SK";

  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-200 bg-white px-6 py-4">
      <div className="flex flex-1 items-center gap-3 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-500">
        <span className="text-slate-400">🔍</span>
        <input
          className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
          placeholder="Search data, transactions, members..."
        />
      </div>
      <div className="flex items-center gap-4">
        <button
          className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
          aria-label="Notifications"
        >
          <span>🔔</span>
        </button>
        <button
          className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
          aria-label="Help"
        >
          <span>?</span>
        </button>
        <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-white px-3 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-xs font-semibold text-white">
            {initials}
          </div>
          <div className="hidden text-sm text-slate-600 sm:block">
            {user?.username || "Administrator"}
          </div>
        </div>
      </div>
    </div>
  );
}
