"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getUser } from "@/lib/auth";
import { getNavItems } from "@/lib/navigation";

export default function MobileNav() {
  const pathname = usePathname();
  const user = getUser();
  const navItems = getNavItems(user?.role);

  return (
    <div className="flex gap-2 overflow-x-auto border-b border-slate-200 bg-white px-4 py-3 md:hidden">
      {navItems.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-semibold ${
              active
                ? "bg-indigo-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
