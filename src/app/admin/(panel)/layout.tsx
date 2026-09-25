import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { logout } from "../auth-actions";
import { AdminNav } from "@/components/admin/AdminNav";
import NewOrdersAlert from "@/components/admin/NewOrdersAlert";

export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!isSupabaseConfigured()) {
    return <SetupScreen>{children}</SetupScreen>;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  const email = user.email;

  return (
    <div className="flex min-h-screen bg-stone-100">
      <aside className="fixed inset-y-0 left-0 z-30 flex w-60 flex-col border-r border-stone-200 bg-white">
        <div className="border-b border-stone-200 px-5 py-4">
          <Link href="/admin" className="block">
            <span className="text-lg font-bold text-brand-700">SNR Naturals</span>
            <span className="block text-xs text-stone-500">Admin Panel</span>
          </Link>
        </div>

        <AdminNav />

        <div className="border-t border-stone-200 p-3">
          <div className="mb-2 truncate px-3 text-xs text-stone-500">{email}</div>
          <form action={logout}>
            <button
              type="submit"
              className="w-full rounded-md px-3 py-2 text-left text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
            >
              Sign out
            </button>
          </form>
        </div>
      </aside>

      <main className="ml-60 flex-1 p-6">
        <NewOrdersAlert />
        {children}
      </main>
    </div>
  );
}

function SetupScreen({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-stone-100">
      <aside className="fixed inset-y-0 left-0 z-30 flex w-60 flex-col border-r border-stone-200 bg-white">
        <div className="border-b border-stone-200 px-5 py-4">
          <span className="text-lg font-bold text-brand-700">SNR Naturals</span>
          <span className="block text-xs text-stone-500">Admin Panel</span>
        </div>
        <AdminNav />
        <div className="border-t border-stone-200 p-3">
          <div className="truncate px-3 text-xs text-stone-500">Not configured</div>
        </div>
      </aside>
      <main className="ml-60 flex-1 p-6">{children}</main>
    </div>
  );
}
