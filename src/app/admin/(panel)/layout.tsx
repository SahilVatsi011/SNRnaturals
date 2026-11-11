import Link from "next/link";
import { Logo } from "@/components/Logo";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { logout } from "../auth-actions";
import { AdminNav } from "@/components/admin/AdminNav";
import { AdminMobileNav } from "@/components/admin/AdminMobileNav";
import NotificationCenter from "@/components/admin/NotificationCenter";

export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!isSupabaseConfigured()) {
    return <Shell email={null} notifications={false}>{children}</Shell>;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  return <Shell email={user.email} notifications>{children}</Shell>;
}

function Shell({
  children,
  email,
  notifications,
}: {
  children: React.ReactNode;
  email?: string | null;
  notifications: boolean;
}) {
  const initial = (email ?? "A").charAt(0).toUpperCase();
  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "Asia/Kolkata",
  });

  return (
    <div className="min-h-screen bg-canvas">
      {/* ── Desktop sidebar ── */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-ink text-white lg:flex print:hidden">
        <div className="px-6 pb-2 pt-6">
          <Link href="/admin" className="block text-white">
            <Logo markClassName="h-9" textClassName="text-base" subtitle="Admin Panel" />
          </Link>
        </div>

        <AdminNav />

        <div className="m-3 rounded-2xl bg-white/5 p-3">
          {email ? (
            <>
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-600 text-sm font-bold">
                  {initial}
                </span>
                <div className="min-w-0">
                  <p className="text-xs text-white/50">Signed in as</p>
                  <p className="truncate text-sm text-white/90">{email}</p>
                </div>
              </div>
              <form action={logout} className="mt-3">
                <button
                  type="submit"
                  className="w-full rounded-lg bg-white/5 px-3 py-2 text-sm font-medium text-white/70 transition-colors hover:bg-red-500/15 hover:text-red-300"
                >
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <p className="px-1 text-xs text-white/50">Not configured</p>
          )}
        </div>
      </aside>

      <div className="lg:pl-64 print:pl-0">
        {/* ── Top bar ── */}
        <header className="sticky top-0 z-30 border-b border-black/5 bg-canvas/85 backdrop-blur-md print:hidden">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
            <Link href="/admin" className="text-brand-700 lg:hidden">
              <Logo markClassName="h-8" textClassName="text-base text-ink" subtitle="Admin" />
            </Link>
            <p className="hidden text-sm text-stone-500 lg:block">{today}</p>

            <div className="flex items-center gap-2">
              <Link
                href="/"
                target="_blank"
                className="hidden items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-stone-700 shadow-sm ring-1 ring-black/5 transition hover:text-ink sm:inline-flex"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                View store
              </Link>
              {notifications && <NotificationCenter />}
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 pb-28 pt-6 sm:px-6 lg:px-8 lg:pb-12 lg:pt-8 print:max-w-none print:p-0">
          {children}
        </main>
      </div>

      <AdminMobileNav email={email} />
    </div>
  );
}

