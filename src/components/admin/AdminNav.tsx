"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ADMIN_NAV, NavIcon, isNavActive } from "./nav-items";

/** Desktop sidebar navigation (dark sidebar). */
export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex-1 space-y-1 px-3 py-4">
      <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35">
        Menu
      </p>
      {ADMIN_NAV.map((item) => {
        const active = isNavActive(item, pathname);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
              active
                ? "bg-white/10 text-white"
                : "text-white/60 hover:bg-white/5 hover:text-white"
            }`}
          >
            {active && (
              <span className="absolute -left-3 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-brand-400" />
            )}
            <NavIcon
              d={item.icon}
              className={active ? "text-brand-300" : "text-white/50 group-hover:text-white/80"}
            />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
