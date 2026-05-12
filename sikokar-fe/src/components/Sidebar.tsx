"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clearAuth, getUser } from "@/lib/auth";
import { getNavItems } from "@/lib/navigation";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const user = getUser();

  const navItems = getNavItems(user?.role);

  const handleLogout = () => {
    clearAuth();
    router.replace("/login");
  };

  return (
    <aside className="hidden h-screen w-72 flex-col border-r border-slate-200 bg-white md:flex">
      <div className="px-7 pb-6 pt-8">
        <div className="text-xl font-semibold text-slate-900">SIKOKAR</div>
        <div className="text-sm text-slate-500">Koperasi Karawang</div>
      </div>
      <nav className="flex flex-1 flex-col gap-2 px-4">
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                active
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  active ? "bg-indigo-500" : "bg-slate-300"
                }`}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-slate-200 px-6 py-5">
        <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Account
        </div>
        <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <div className="text-sm font-semibold text-slate-900">
            {user?.username || "User"}
          </div>
          <div className="text-xs text-slate-500">Role: {user?.role || "-"}</div>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
        >
          Logout
        </button>
      </div>
    </aside>
  );
}
