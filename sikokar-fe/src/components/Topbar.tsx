"use client";

import { getUser } from "@/lib/auth";

export default function Topbar() {
  const user = getUser();
  const initials = user?.username ? user.username.slice(0, 2).toUpperCase() : "SK";
  const dateLabel = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-200 bg-white px-6 py-4">
      <div>
        <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Dashboard</div>
        <h1 className="mt-1 text-xl font-display font-semibold text-slate-900">Data Anggota</h1>
      </div>
      <div className="flex items-center gap-4">
        <div className="hidden text-sm font-medium text-slate-500 md:block">{dateLabel}</div>
        <button
          className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
          aria-label="Notifications"
        >
          <span>🔔</span>
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
