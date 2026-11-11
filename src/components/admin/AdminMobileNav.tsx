"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/admin/auth-actions";
import { LogoMark } from "@/components/Logo";
import { ADMIN_NAV, NavIcon, isNavActive } from "./nav-items";

const MORE_ICON = "M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z";

/** App-style bottom tab bar + "More" sheet for the admin panel on phones. */
export function AdminMobileNav({ email }: { email?: string | null }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const tabs = ADMIN_NAV.filter((i) => i.mobileTab);
  const more = ADMIN_NAV.filter((i) => !i.mobileTab);
  const moreActive = more.some((i) => isNavActive(i, pathname));

  return (
    <>
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-black/5 bg-white/95 backdrop-blur-md lg:hidden print:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        aria-label="Admin"
      >
        <div className="mx-auto grid h-16 max-w-lg grid-cols-5">
          {tabs.map((t) => {
            const active = isNavActive(t, pathname);
            return (
              <Link
                key={t.href}
                href={t.href}
                className={`relative flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium ${
                  active ? "text-brand-700" : "text-stone-500"
                }`}
              >
                {active && <span className="absolute top-0 h-0.5 w-8 rounded-full bg-brand-700" />}
                <NavIcon d={t.icon} />
                {t.label}
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => setOpen(true)}
            className={`relative flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium ${
              moreActive || open ? "text-brand-700" : "text-stone-500"
            }`}
          >
            {moreActive && <span className="absolute top-0 h-0.5 w-8 rounded-full bg-brand-700" />}
            <NavIcon d={MORE_ICON} />
            More
          </button>
        </div>
      </nav>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="More">
          <div className="animate-fade-in absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div
            className="animate-slide-up absolute inset-x-0 bottom-0 rounded-t-3xl bg-white"
            style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 1rem)" }}
          >
            <div className="flex justify-center pt-3">
              <span className="h-1 w-10 rounded-full bg-stone-300" />
            </div>
            <div className="flex items-center gap-3 px-5 pb-4 pt-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-ink">
                <LogoMark className="h-7 text-white" />
              </span>
              <div className="min-w-0">
                <p className="font-bold text-ink">SNR Naturals Admin</p>
                {email && <p className="truncate text-xs text-stone-500">{email}</p>}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 px-5">
              {more.map((i) => {
                const active = isNavActive(i, pathname);
                return (
                  <Link
                    key={i.href}
                    href={i.href}
                    className={`flex flex-col items-center gap-2 rounded-2xl py-4 text-xs font-medium ring-1 ${
                      active
                        ? "bg-brand-50 text-brand-700 ring-brand-200"
                        : "bg-stone-50 text-ink ring-stone-200"
                    }`}
                  >
                    <NavIcon d={i.icon} />
                    {i.label}
                  </Link>
                );
              })}
            </div>

            <div className="mt-4 space-y-1 px-5">
              <Link
                href="/"
                target="_blank"
                className="flex items-center justify-between rounded-xl px-1 py-3 text-sm text-stone-700"
              >
                View store
                <NavIcon d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" className="text-stone-400" />
              </Link>
              <form action={logout}>
                <button
                  type="submit"
                  className="w-full rounded-xl bg-red-50 py-3 text-sm font-semibold text-red-600"
                >
                  Sign out
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
