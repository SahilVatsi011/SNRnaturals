import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { DEFAULTS } from "@/lib/constants";
import { formatOrderNo } from "@/lib/order-utils";
import { OrderStatusBadge } from "@/components/admin/OrderStatusBadge";
import OrdersExport from "@/components/admin/OrdersExport";
import NotConfiguredBanner from "@/components/admin/NotConfiguredBanner";
import { formatINR } from "@/lib/format";

export const dynamic = "force-dynamic";

const filters = ["", ...DEFAULTS.orderStatuses];

function PaymentPill({ status }: { status: string }) {
  const paid = status === "paid";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ring-1 ring-inset ${
        paid ? "bg-brand-50 text-brand-700 ring-brand-600/20" : "bg-stone-100 text-stone-600 ring-stone-500/20"
      }`}
    >
      {paid ? "Paid" : `Payment ${status}`}
    </span>
  );
}

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
        <h1 className="mb-4 text-2xl font-bold tracking-tight text-ink">Orders</h1>
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
      <h1 className="mb-5 text-2xl font-bold tracking-tight text-ink">
        Orders{" "}
        <span className="text-base font-normal text-stone-400">
          ({orders?.length ?? 0})
        </span>
      </h1>

      <OrdersExport initialStatus={activeFilter} />

      {/* Status filter */}
      <div className="no-scrollbar -mx-4 mb-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
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

      {/* Mobile: order cards */}
      <ul className="space-y-3 md:hidden">
        {(orders ?? []).length === 0 && (
          <li className="rounded-2xl bg-white p-8 text-center text-sm text-stone-400 shadow-sm ring-1 ring-black/5">
            No orders{activeFilter ? ` with status "${activeFilter}"` : ""}.
          </li>
        )}
        {(orders ?? []).map((o) => {
          const items = (o.items ?? []) as { qty?: number }[];
          const itemCount = items.reduce((s, i) => s + (i.qty || 0), 0);
          return (
            <li key={o.id}>
              <Link
                href={`/admin/orders/${o.id}`}
                className="block rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5 active:bg-stone-50"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-ink">{o.customer_name}</p>
                    <p className="text-xs text-stone-500">
                      {formatOrderNo(o.order_no)} ·{" "}
                      {new Date(o.created_at).toLocaleString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <p className="text-base font-bold text-ink">{formatINR(Number(o.total))}</p>
                </div>
                <div className="mt-3 flex items-center justify-between gap-2 border-t border-stone-100 pt-3">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <OrderStatusBadge status={o.order_status} />
                    <PaymentPill status={o.payment_status} />
                  </div>
                  <span className="text-xs text-stone-500">
                    {itemCount} item{itemCount === 1 ? "" : "s"}
                  </span>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="hidden overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-black/5 md:block">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-stone-100 bg-stone-50/70 text-left text-xs font-medium uppercase tracking-wider text-stone-500">
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
                    {formatINR(Number(o.total))}
                  </td>
                  <td className="px-4 py-3">
                    <PaymentPill status={o.payment_status} />
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
