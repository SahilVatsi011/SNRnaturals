import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { DEFAULTS } from "@/lib/constants";
import { formatOrderNo } from "@/lib/order-utils";
import { Card } from "@/components/ui/Card";
import NotConfiguredBanner from "@/components/admin/NotConfiguredBanner";
import RevenueSparkline from "@/components/admin/charts/RevenueSparkline";
import {
  addDays,
  istEndOfDay,
  istStartOfDay,
  summarize,
  todayIST,
  type AnalyticsOrder,
} from "@/lib/analytics";

export const dynamic = "force-dynamic";

function currency(n: number) {
  return "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

export default async function DashboardPage() {
  if (!isSupabaseConfigured()) {
    return (
      <div>
        <h1 className="mb-4 text-2xl font-bold text-stone-800">Dashboard</h1>
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
        <h1 className="mb-4 text-2xl font-bold text-stone-800">Dashboard</h1>
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

  const stats = [
    { label: "Total Orders", value: String(totalOrders ?? 0) },
    { label: "Revenue (30 days)", value: currency(revenue30d) },
    { label: "Pending Orders", value: String(pendingOrders ?? 0) },
    { label: "Low Stock Items", value: String(lowStock.length) },
  ];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-stone-800">Dashboard</h1>

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="!p-4">
            <p className="text-sm text-stone-500">{s.label}</p>
            <p className="mt-1 text-2xl font-bold text-stone-800">{s.value}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <div className="mb-3 flex items-start justify-between gap-3">
            <h2 className="text-lg font-semibold text-stone-800">
              Revenue — Last 30 Days
            </h2>
            <Link
              href="/admin/analytics"
              className="text-sm font-medium text-brand-700 hover:underline"
            >
              View analytics →
            </Link>
          </div>
          <p className="mb-2 text-sm text-stone-500">
            {currency(revenue30d)} from {orders30d} paid order
            {orders30d === 1 ? "" : "s"}
          </p>
          <RevenueSparkline data={windowSummary.daily} />
        </Card>

        <Card>
          <div className="mb-3 flex items-start justify-between gap-3">
            <h2 className="text-lg font-semibold text-stone-800">
              Recent Orders
            </h2>
            <Link
              href="/admin/orders"
              className="text-sm font-medium text-brand-700 hover:underline"
            >
              View all →
            </Link>
          </div>
          {recentOrders && recentOrders.length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-200 text-left text-stone-500">
                  <th className="pb-2">Order</th>
                  <th className="pb-2">Customer</th>
                  <th className="pb-2">Total</th>
                  <th className="pb-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((o) => (
                  <tr key={o.id} className="border-b border-stone-100">
                    <td className="py-2">
                      <div>{formatOrderNo(o.order_no)}</div>
                      <div className="text-xs text-stone-400">
                        {new Date(o.created_at).toLocaleString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </td>
                    <td className="py-2 text-stone-600">{o.customer_name}</td>
                    <td className="py-2">{currency(Number(o.total))}</td>
                    <td className="py-2">
                      <span className="rounded bg-stone-100 px-2 py-0.5 text-xs capitalize">
                        {o.order_status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-sm text-stone-500">No orders yet.</p>
          )}
        </Card>

        <Card>
          <h2 className="mb-3 text-lg font-semibold text-stone-800">
            Low Stock Alerts
          </h2>
          {lowStock.length > 0 ? (
            <ul className="space-y-2 text-sm">
              {lowStock.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between rounded border border-amber-200 bg-amber-50 px-3 py-2"
                >
                  <span className="font-medium text-stone-700">{p.name}</span>
                  <span
                    className={
                      p.stock_qty === 0 ? "text-red-600" : "text-amber-600"
                    }
                  >
                    {p.stock_qty} left
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-stone-500">All stock healthy.</p>
          )}
        </Card>
      </div>
    </div>
  );
}
