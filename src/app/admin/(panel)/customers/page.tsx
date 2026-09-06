import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { Card, CardHeader } from "@/components/ui/Card";
import NotConfiguredBanner from "@/components/admin/NotConfiguredBanner";
import { buildWhatsAppPromoLink } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

function currency(n: number) {
  return "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

interface CustomerSummary {
  phone: string;
  name: string;
  totalSpent: number;
  orderCount: number;
}

export default async function CustomersPage() {
  if (!isSupabaseConfigured()) {
    return (
      <div>
        <h1 className="mb-4 text-2xl font-bold text-stone-800">Top Customers</h1>
        <NotConfiguredBanner />
      </div>
    );
  }

  const supabase = await createClient();
  const { data: orders } = await supabase
    .from("orders")
    .select("customer_phone,customer_name,total,payment_status")
    .eq("payment_status", "paid");

  // Aggregate by phone number
  const customerMap = new Map<string, CustomerSummary>();

  for (const o of orders ?? []) {
    const existing = customerMap.get(o.customer_phone);
    if (existing) {
      existing.totalSpent += Number(o.total);
      existing.orderCount += 1;
      // Keep the most recent name
      if (o.customer_name) existing.name = o.customer_name;
    } else {
      customerMap.set(o.customer_phone, {
        phone: o.customer_phone,
        name: o.customer_name || "Unknown",
        totalSpent: Number(o.total),
        orderCount: 1,
      });
    }
  }

  // Sort by total spent descending
  const topCustomers = Array.from(customerMap.values())
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, 50);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-stone-800">
        Top Customers{" "}
        <span className="text-base font-normal text-stone-400">
          ({topCustomers.length})
        </span>
      </h1>

      <Card>
        <CardHeader
          title="Prime Customers"
          subtitle="Ranked by total lifetime spend. Send them promo codes via WhatsApp."
        />

        <div className="overflow-hidden rounded border border-stone-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50 text-left text-stone-500">
                <th className="px-4 py-3 w-12">#</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Orders</th>
                <th className="px-4 py-3">Total Spent</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {topCustomers.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-stone-400">
                    No paid orders yet. Customers will appear here once orders are placed.
                  </td>
                </tr>
              )}
              {topCustomers.map((c, i) => {
                const waLink = buildWhatsAppPromoLink({
                  phone: c.phone,
                  customerName: c.name,
                });
                return (
                  <tr
                    key={c.phone}
                    className="border-b border-stone-100 last:border-0 hover:bg-stone-50"
                  >
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                          i < 3
                            ? "bg-amber-100 text-amber-700"
                            : "bg-stone-100 text-stone-500"
                        }`}
                      >
                        {i + 1}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-stone-800">{c.name}</div>
                    </td>
                    <td className="px-4 py-3 text-stone-600">{c.phone}</td>
                    <td className="px-4 py-3">
                      <span className="rounded bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-700">
                        {c.orderCount}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-stone-800">
                      {currency(c.totalSpent)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <a
                        href={waLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700 transition-colors hover:bg-green-100"
                      >
                        📱 WhatsApp
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
