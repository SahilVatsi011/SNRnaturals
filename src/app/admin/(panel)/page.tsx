import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { DEFAULTS } from "@/lib/constants";
import { formatOrderNo } from "@/lib/order-utils";
import { Card } from "@/components/ui/Card";
import NotConfiguredBanner from "@/components/admin/NotConfiguredBanner";
import RevenueSparkline from "@/components/admin/charts/RevenueSparkline";
import { OrderStatusBadge } from "@/components/admin/OrderStatusBadge";
import {
  addDays,
  istEndOfDay,
  istStartOfDay,
  summarize,
  todayIST,
  type AnalyticsOrder,
} from "@/lib/analytics";
import { formatINR } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  if (!isSupabaseConfigured()) {
    return (
      <div>
        <h1 className="mb-4 text-2xl font-bold tracking-tight text-ink">Dashboard</h1>
        <NotConfiguredBanner />
      </div>
    );
  }

  const supabase = await createClient();
  const today = todayIST();
  const windowFrom = addDays(today, -29);
  const windowStart = istStartOfDay(windowFrom).toISOString();
  const windowEnd = istEndOfDay(today).toISOString();

  const [
    { data: recentOrders, error: ordersError },
    { count: totalOrders },
    { count: pendingOrders },
    { data: products },
    { data: settings },
    { data: windowOrders },
  ] = await Promise.all([
    supabase
      .from("orders")
      .select("id,order_no,customer_name,total,order_status,created_at")
      .order("created_at", { ascending: false })
      .limit(6),
    supabase.from("orders").select("id", { count: "exact", head: true }),
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("order_status", "pending"),
    supabase.from("products").select("id,name,stock_qty"),
    supabase
      .from("settings")
      .select("*")
      .eq("key", "lowStockThreshold")
      .single(),
    supabase
      .from("orders")
      .select("created_at,total,payment_status,order_status,items,customer_phone")
      .gte("created_at", windowStart)
      .lte("created_at", windowEnd),
  ]);

  if (ordersError) {
    return (
      <div>
        <h1 className="mb-4 text-2xl font-bold tracking-tight text-ink">Dashboard</h1>
        <NotConfiguredBanner />
      </div>
    );
  }

  const lowStockThreshold =
    (settings?.value as number) ?? DEFAULTS.lowStockThreshold;

  const windowSummary = summarize(
    (windowOrders ?? []) as AnalyticsOrder[],
    { from: windowFrom, to: today }
  );
  const revenue30d = windowSummary.metrics.revenue;
  const orders30d = windowSummary.metrics.orders;

  const lowStock = (products ?? []).filter(
    (p) => p.stock_qty <= lowStockThreshold
  );

  const hour = Number(
    new Date().toLocaleString("en-IN", { hour: "numeric", hour12: false, timeZone: "Asia/Kolkata" })
  );
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const stats = [
    {
      label: "Revenue · 30 days",
      value: formatINR(revenue30d),
      sub: `${orders30d} paid order${orders30d === 1 ? "" : "s"}`,
      href: "/admin/analytics",
      tone: "bg-brand-50 text-brand-700",
      icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    },
    {
      label: "Total orders",
      value: String(totalOrders ?? 0),
      sub: "All time",
      href: "/admin/orders",
      tone: "bg-sky-50 text-sky-700",
      icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 7h6m-6 4h4",
    },
    {
      label: "Pending orders",
      value: String(pendingOrders ?? 0),
      sub: (pendingOrders ?? 0) > 0 ? "Need your attention" : "All caught up",
      href: "/admin/orders?status=pending",
      tone: "bg-honey-100 text-honey-700",
      icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
    },
    {
      label: "Low stock",
      value: String(lowStock.length),
      sub: lowStock.length > 0 ? `≤ ${lowStockThreshold} units left` : "Stock looks healthy",
      href: "/admin/products",
      tone: lowStock.length > 0 ? "bg-red-50 text-red-600" : "bg-stone-100 text-stone-600",
      icon: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-stone-500">{greeting} 👋</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            Here&apos;s how your store is doing
          </h1>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/products/new"
            className="inline-flex items-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-800"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
            Add product
          </Link>
          <Link
            href="/admin/orders"
            className="inline-flex items-center rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-stone-700 shadow-sm ring-1 ring-black/5 transition hover:text-ink"
          >
            View orders
          </Link>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="group rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:shadow-md sm:p-5"
          >
            <div className="flex items-center justify-between">
              <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${s.tone}`}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d={s.icon} /></svg>
              </span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="text-stone-300 transition group-hover:translate-x-0.5 group-hover:text-stone-500"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            </div>
            <p className="mt-4 text-xs font-medium text-stone-500 sm:text-sm">{s.label}</p>
            <p className="mt-1 text-xl font-bold tracking-tight text-ink sm:text-2xl">{s.value}</p>
            <p className="mt-1 truncate text-xs text-stone-400">{s.sub}</p>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Revenue */}
        <Card className="lg:col-span-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-ink">Revenue</h2>
              <p className="text-sm text-stone-500">Last 30 days</p>
            </div>
            <Link href="/admin/analytics" className="rounded-full bg-stone-100 px-3 py-1.5 text-xs font-semibold text-stone-700 transition hover:bg-stone-200">
              Analytics →
            </Link>
          </div>
          <p className="mt-4 text-3xl font-bold tracking-tight text-ink">{formatINR(revenue30d)}</p>
          <p className="text-sm text-stone-500">
            from {orders30d} paid order{orders30d === 1 ? "" : "s"}
          </p>
          <div className="mt-4">
            <RevenueSparkline data={windowSummary.daily} />
          </div>
        </Card>

        {/* Low stock */}
        <Card className="lg:col-span-2">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-ink">Low stock</h2>
              <p className="text-sm text-stone-500">{lowStock.length} item{lowStock.length === 1 ? "" : "s"} at or below {lowStockThreshold}</p>
            </div>
            <Link href="/admin/products" className="rounded-full bg-stone-100 px-3 py-1.5 text-xs font-semibold text-stone-700 transition hover:bg-stone-200">
              Products →
            </Link>
          </div>
          {lowStock.length > 0 ? (
            <ul className="mt-4 max-h-72 space-y-2 overflow-y-auto pr-1">
              {lowStock
                .slice()
                .sort((x, y) => x.stock_qty - y.stock_qty)
                .map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-3 rounded-xl bg-stone-50 px-3 py-2.5">
                    <span className="truncate text-sm font-medium text-stone-700">{p.name}</span>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        p.stock_qty === 0 ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {p.stock_qty === 0 ? "Out of stock" : `${p.stock_qty} left`}
                    </span>
                  </li>
                ))}
            </ul>
          ) : (
            <div className="mt-6 flex flex-col items-center rounded-xl bg-brand-50 py-8 text-center">
              <span className="text-2xl">✅</span>
              <p className="mt-2 text-sm font-medium text-brand-700">All stock healthy</p>
            </div>
          )}
        </Card>

        {/* Recent orders */}
        <Card className="lg:col-span-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-ink">Recent orders</h2>
              <p className="text-sm text-stone-500">Latest activity in your store</p>
            </div>
            <Link href="/admin/orders" className="rounded-full bg-stone-100 px-3 py-1.5 text-xs font-semibold text-stone-700 transition hover:bg-stone-200">
              View all →
            </Link>
          </div>
          {recentOrders && recentOrders.length > 0 ? (
            <ul className="mt-4 divide-y divide-stone-100">
              {recentOrders.map((o) => (
                <li key={o.id}>
                  <Link
                    href={`/admin/orders/${o.id}`}
                    className="-mx-2 flex items-center gap-3 rounded-xl px-2 py-3 transition hover:bg-stone-50"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cream-100 text-sm font-bold text-honey-700">
                      {(o.customer_name || "?").trim().charAt(0).toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink">{o.customer_name}</p>
                      <p className="text-xs text-stone-500">
                        {formatOrderNo(o.order_no)} ·{" "}
                        {new Date(o.created_at).toLocaleString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                          timeZone: "Asia/Kolkata",
                        })}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 sm:flex-row sm:items-center sm:gap-4">
                      <span className="text-sm font-semibold text-ink">{formatINR(Number(o.total))}</span>
                      <OrderStatusBadge status={o.order_status} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 rounded-xl bg-stone-50 py-8 text-center text-sm text-stone-500">No orders yet.</p>
          )}
        </Card>
      </div>
    </div>
  );
}
