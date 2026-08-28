import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { DEFAULTS } from "@/lib/constants";
import { Card } from "@/components/ui/Card";
import NotConfiguredBanner from "@/components/admin/NotConfiguredBanner";

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

  const [
    { data: orders, error: ordersError },
    { data: products },
    { data: settings },
  ] = await Promise.all([
    supabase.from("orders").select("*").order("created_at", { ascending: false }),
    supabase.from("products").select("*"),
    supabase
      .from("settings")
      .select("*")
      .eq("key", "lowStockThreshold")
      .single(),
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

  const paidOrders = (orders ?? []).filter(
    (o) => o.payment_status === "paid"
  );
  const revenue = paidOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);

  const byStatus = (orders ?? []).reduce<Record<string, number>>((acc, o) => {
    acc[o.order_status] = (acc[o.order_status] || 0) + 1;
    return acc;
  }, {});

  const lowStock = (products ?? []).filter(
    (p) => p.stock_qty <= lowStockThreshold
  );

  const stats = [
    { label: "Total Orders", value: String((orders ?? []).length) },
    { label: "Paid Revenue", value: currency(revenue) },
    { label: "Pending Orders", value: String(byStatus["pending"] || 0) },
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
          <h2 className="mb-3 text-lg font-semibold text-stone-800">
            Recent Orders
          </h2>
          {orders && orders.length > 0 ? (
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
                {orders.slice(0, 6).map((o) => (
                  <tr key={o.id} className="border-b border-stone-100">
                    <td className="py-2">#{o.order_no}</td>
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
