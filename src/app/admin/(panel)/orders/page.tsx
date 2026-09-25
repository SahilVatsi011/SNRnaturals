import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { DEFAULTS } from "@/lib/constants";
import { formatOrderNo } from "@/lib/order-utils";
import { OrderStatusBadge } from "@/components/admin/OrderStatusBadge";
import OrdersExport from "@/components/admin/OrdersExport";
import NotConfiguredBanner from "@/components/admin/NotConfiguredBanner";

export const dynamic = "force-dynamic";

function currency(n: number) {
  return "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

const filters = ["", ...DEFAULTS.orderStatuses];

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const activeFilter = status && status !== "all" ? status : "";

  if (!isSupabaseConfigured()) {
    return (
      <div>
        <h1 className="mb-4 text-2xl font-bold text-stone-800">Orders</h1>
        <NotConfiguredBanner />
      </div>
    );
  }

  const supabase = await createClient();
  let query = supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });

  if (activeFilter) {
    query = query.eq("order_status", activeFilter);
  }

  const { data: orders } = await query;

  return (
    <div>
      <h1 className="mb-5 text-2xl font-bold text-stone-800">
        Orders{" "}
        <span className="text-base font-normal text-stone-400">
          ({orders?.length ?? 0})
        </span>
      </h1>

      <OrdersExport initialStatus={activeFilter} />

      {/* Status filter */}
      <div className="mb-4 flex flex-wrap gap-2">
        {filters.map((f) => {
          const isActive = activeFilter === f;
          return (
            <Link
              key={f || "all"}
              href={f ? `/admin/orders?status=${f}` : "/admin/orders"}
              className={`rounded-full px-3 py-1 text-sm font-medium capitalize transition-colors ${
                isActive
                  ? "bg-brand-600 text-white"
                  : "bg-white text-stone-600 hover:bg-stone-100"
              }`}
            >
              {f || "All"}
            </Link>
          );
        })}
      </div>

      <div className="overflow-hidden rounded-lg border border-stone-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-stone-200 bg-stone-50 text-left text-stone-500">
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Items</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Payment</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {(orders ?? []).length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-stone-400">
                  No orders{activeFilter ? ` with status "${activeFilter}"` : ""}.
                </td>
              </tr>
            )}
            {(orders ?? []).map((o) => {
              const items = (o.items ?? []) as { qty?: number }[];
              const itemCount = items.reduce((s, i) => s + (i.qty || 0), 0);
              return (
                <tr
                  key={o.id}
                  className="border-b border-stone-100 last:border-0 hover:bg-stone-50"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/orders/${o.id}`}
                      className="font-medium text-brand-600 hover:underline"
                    >
                      {formatOrderNo(o.order_no)}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-stone-600">
                    <div>
                      {new Date(o.created_at).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                      })}
                    </div>
                    <div className="text-xs text-stone-400">
                      {new Date(o.created_at).toLocaleTimeString("en-IN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-stone-800">
                      {o.customer_name}
                    </div>
                    <div className="text-xs text-stone-400">{o.customer_phone}</div>
                  </td>
                  <td className="px-4 py-3">{itemCount}</td>
                  <td className="px-4 py-3 font-medium">
                    {currency(Number(o.total))}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded px-2 py-0.5 text-xs capitalize ${
                        o.payment_status === "paid"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {o.payment_status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <OrderStatusBadge status={o.order_status} />
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/orders/${o.id}`}
                      className="inline-flex items-center gap-1 rounded-lg bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700 transition-colors hover:bg-brand-100"
                    >
                      View
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
