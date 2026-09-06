import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { formatOrderNo, parseOrderInput } from "@/lib/order-utils";
import { OrderStatusBadge } from "@/components/admin/OrderStatusBadge";

export const dynamic = "force-dynamic";

function price(n: number) {
  return "\u20B9" + Number(n).toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function OrderHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ phone?: string; order_id?: string }>;
}) {
  const { phone, order_id } = await searchParams;
  const trimmedPhone = phone?.trim().replace(/\s+/g, "") || "";
  const trimmedOrderId = order_id?.trim() || "";

  const searched = !!(trimmedPhone && trimmedOrderId);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let order: any = null;
  let errorMsg = "";

  if (searched && isSupabaseConfigured()) {
    const parsedNo = parseOrderInput(trimmedOrderId);
    if (!parsedNo) {
      errorMsg = "Invalid order ID format. Try something like SNR-10001 or just the number.";
    } else {
      const supabase = await createClient();
      const { data } = await supabase.rpc("get_order_by_phone_no", {
        p_phone: trimmedPhone,
        p_order_no: parsedNo,
      });
      const found = Array.isArray(data) ? data[0] : undefined;

      if (found) {
        order = found;
      } else {
        errorMsg = "No order found. Make sure both your phone number and order ID are correct.";
      }
    }
  }

  // Show error if only one field was provided
  const partialSearch = (!!trimmedPhone !== !!trimmedOrderId) && (!!trimmedPhone || !!trimmedOrderId);

  return (
    <div className="mx-auto max-w-3xl px-5 py-8 sm:px-8 sm:py-12 lg:px-8">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="text-brand-600">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <h1 className="font-display text-2xl font-bold text-stone-800 sm:text-3xl">Track Your Order</h1>
        <p className="mt-2 text-sm text-stone-500">
          Enter your phone number and order ID to view your order details.
        </p>
      </div>

      {/* Search form — both fields required */}
      <div className="mx-auto mb-10 max-w-md">
        <form action="/order-history" method="GET" className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-stone-400">Phone Number</label>
            <div className="relative">
              <svg className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <input
                name="phone"
                type="tel"
                defaultValue={trimmedPhone}
                placeholder="Enter your 10-digit phone number"
                required
                className="w-full rounded-2xl border border-stone-200 bg-stone-50/50 py-3.5 pl-11 pr-4 text-sm transition-all focus:border-brand-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-500/10"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-stone-400">Order ID</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-stone-400">SNR-</span>
              <input
                name="order_id"
                type="text"
                inputMode="numeric"
                defaultValue={trimmedOrderId}
                placeholder="e.g. SNR-10001"
                required
                className="w-full rounded-2xl border border-stone-200 bg-stone-50/50 py-3.5 pl-14 pr-4 text-sm transition-all focus:border-brand-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-500/10"
              />
            </div>
            <p className="mt-1 text-xs text-stone-400">
              You can find this in your WhatsApp order confirmation message.
            </p>
          </div>

          <button type="submit" className="w-full rounded-2xl bg-brand-600 px-5 py-3.5 text-sm font-semibold text-white shadow-md shadow-brand-600/20 transition-all hover:-translate-y-0.5 hover:bg-brand-700">
            Find My Order
          </button>
        </form>
      </div>

      {/* Partial search warning */}
      {partialSearch && (
        <div className="rounded-3xl border-2 border-dashed border-amber-200 bg-amber-50 p-8 text-center">
          <h2 className="text-lg font-semibold text-amber-700">Both fields required</h2>
          <p className="mt-1 text-sm text-amber-600">
            Please enter both your phone number and order ID to find your order.
          </p>
        </div>
      )}

      {/* Error */}
      {errorMsg && searched && (
        <div className="rounded-3xl border-2 border-dashed border-stone-200 bg-white p-12 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="text-red-400">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-stone-700">Order not found</h2>
          <p className="mt-1 text-sm text-stone-400">{errorMsg}</p>
        </div>
      )}

      {/* Order found */}
      {order && (
        <div className="animate-fade-in rounded-2xl border border-stone-100 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-bold text-stone-800">Order {formatOrderNo(order.order_no)}</h3>
                <OrderStatusBadge status={order.order_status} />
              </div>
              <p className="mt-0.5 text-xs text-stone-400">{formatDate(order.created_at)}</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-stone-800">{price(Number(order.total))}</p>
              {(() => {
                const itemList = Array.isArray(order.items) ? order.items : [];
                const itemCount = itemList.reduce((s: number, it: { qty?: number }) => s + (it.qty || 1), 0);
                return <p className="text-xs text-stone-400">{itemCount} item{itemCount === 1 ? "" : "s"}</p>;
              })()}
            </div>
          </div>

          {(() => {
            const itemList = Array.isArray(order.items) ? order.items : [];
            return (
              <p className="mt-3 text-sm text-stone-500">
                {itemList.map((it: { name?: string }) => it.name).filter(Boolean).join(", ")}
              </p>
            );
          })()}

          <div className="mt-3 flex items-center gap-2">
            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
              order.payment_status === "paid"
                ? "bg-green-50 text-green-700"
                : order.payment_status === "failed"
                ? "bg-red-50 text-red-700"
                : "bg-amber-50 text-amber-700"
            }`}>
              <span className={`h-1.5 w-1.5 rounded-full ${
                order.payment_status === "paid" ? "bg-green-500" : order.payment_status === "failed" ? "bg-red-500" : "bg-amber-500"
              }`} />
              {order.payment_status === "paid" ? "Paid" : order.payment_status === "failed" ? "Failed" : "Pending"}
            </span>
          </div>

          <div className="mt-4 flex flex-wrap gap-2 border-t border-stone-100 pt-4">
            <Link
              href={`/track/${order.order_token}`}
              className="inline-flex items-center gap-1.5 rounded-xl bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-100"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Track Order
            </Link>
          </div>
        </div>
      )}

      {/* Not searched yet */}
      {!searched && !partialSearch && (
        <div className="rounded-3xl border border-stone-100 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-stone-50">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.2} className="text-stone-400">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 className="mt-4 text-lg font-semibold text-stone-700">Find your order</h3>
          <p className="mt-1 text-sm text-stone-400">
            Enter your phone number and order ID (from your WhatsApp confirmation) to track your order. No login needed!
          </p>
        </div>
      )}
    </div>
  );
}
