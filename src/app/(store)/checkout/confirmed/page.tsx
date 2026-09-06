import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { STORE } from "@/lib/constants";
import { formatOrderNo } from "@/lib/order-utils";

export const dynamic = "force-dynamic";

function price(n: number) {
  return "\u20B9" + Number(n).toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

export default async function OrderConfirmedPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  if (!token || !isSupabaseConfigured()) notFound();

  const supabase = await createClient();
  const { data } = await supabase.rpc("get_order_by_token", { p_token: token });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const order: any = Array.isArray(data) ? data[0] : undefined;

  if (!order) notFound();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const items: any[] = Array.isArray(order.items) ? order.items : [];

  return (
    <div className="mx-auto max-w-3xl px-5 py-10 sm:px-8 sm:py-16 lg:px-8">
      {/* Step indicator */}
      <div className="mb-10 flex items-center gap-3 text-sm font-medium">
        <span className="flex items-center gap-1.5 text-brand-600">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </span>
          Details
        </span>
        <div className="h-px flex-1 bg-brand-200" />
        <span className="flex items-center gap-1.5 text-brand-600">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </span>
          Payment
        </span>
        <div className="h-px flex-1 bg-brand-200" />
        <span className="flex items-center gap-1.5 text-brand-600">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </span>
          Confirmed
        </span>
      </div>

      {/* Success header */}
      <div className="animate-fade-in-up mb-8 text-center">
        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="text-green-600">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="font-display text-3xl font-bold text-stone-800">
          Order Confirmed!
        </h1>
        <p className="mt-2 text-stone-500">
          Thank you for your order, {order.customer_name}! We&apos;ll start processing it right away.
        </p>
      </div>

      {/* Order details card */}
      <div className="animate-fade-in delay-200 rounded-3xl border border-stone-100 bg-white p-6 shadow-sm sm:p-8">
        {/* Order info header */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-brand-50 p-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">Order Number</p>
            <p className="text-2xl font-bold text-brand-800">{formatOrderNo(order.order_no)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-stone-400">Payment Status</p>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-700">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
              Paid
            </span>
          </div>
        </div>

        {/* Items */}
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-stone-400">Items Ordered</h3>
        <div className="space-y-3">
          {items.map((item, i) => (
            <div key={i} className="flex items-center gap-3">
              {item.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.image} alt={item.name} className="h-12 w-12 rounded-xl object-cover" />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-stone-100">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1} className="text-stone-300">
                    <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="font-medium text-stone-700">{item.name}</p>
                <p className="text-xs text-stone-400">Qty: {item.qty} &times; {price(Number(item.price))}</p>
              </div>
              <span className="font-semibold text-stone-800">{price(Number(item.price) * Number(item.qty))}</span>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="mt-4 space-y-2 border-t border-stone-100 pt-4 text-sm">
          <div className="flex justify-between">
            <span className="text-stone-500">Subtotal</span>
            <span>{price(Number(order.subtotal))}</span>
          </div>
          {Number(order.discount_amount) > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Discount {order.coupon_code ? `(${order.coupon_code})` : ""}</span>
              <span>-{price(Number(order.discount_amount))}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-stone-500">Delivery</span>
            <span>{Number(order.delivery_fee) > 0 ? price(Number(order.delivery_fee)) : "Free"}</span>
          </div>
          <div className="flex justify-between border-t border-dashed border-stone-200 pt-2 text-lg font-bold">
            <span>Total Paid</span>
            <span className="text-brand-700">{price(Number(order.total))}</span>
          </div>
        </div>

        {/* Delivery address */}
        <div className="mt-5 rounded-2xl bg-stone-50 p-4">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-stone-400">Delivering To</p>
          <p className="font-medium text-stone-700">{order.customer_name}</p>
          <p className="text-sm text-stone-500">
            {order.address_line1}
            {order.address_line2 ? `, ${order.address_line2}` : ""}<br />
            {order.city}, {order.state} — {order.pincode}
          </p>
          <p className="mt-1 text-sm text-stone-500">{order.customer_phone}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="animate-fade-in delay-300 mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <Link
          href={`/track/${order.order_token}`}
          className="inline-flex items-center gap-2 rounded-2xl bg-brand-600 px-6 py-3 font-semibold text-white shadow-md shadow-brand-600/20 transition-all hover:-translate-y-0.5 hover:bg-brand-700"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          Track Order
        </Link>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-2xl border border-stone-200 bg-white px-6 py-3 font-semibold text-stone-700 transition-all hover:-translate-y-0.5 hover:shadow-md"
        >
          Continue Shopping
        </Link>
      </div>

      {/* Contact info */}
      <p className="mt-8 text-center text-xs text-stone-400">
        Questions about your order? Contact us at{" "}
        {STORE.phone ? (
          <a href={`tel:${STORE.phone}`} className="text-brand-600 hover:underline">{STORE.phone}</a>
        ) : (
          <span className="text-brand-600">{STORE.domain}</span>
        )}
      </p>
    </div>
  );
}

