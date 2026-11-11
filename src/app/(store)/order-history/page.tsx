import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { formatOrderNo, parseOrderInput } from "@/lib/order-utils";
import { formatINR, formatINRExact } from "@/lib/format";
import { LogoMark } from "@/components/Logo";
import { OrderProgress, orderStatusMessage } from "@/components/store/OrderProgress";
import { ReorderButton } from "@/components/store/ReorderButton";

export const dynamic = "force-dynamic";

interface OrderItem {
  product_id?: string;
  slug?: string;
  name?: string;
  price?: number;
  qty?: number;
  weight_grams?: number;
  image?: string | null;
}

interface FoundOrder {
  order_no: number;
  order_token: string;
  created_at: string;
  customer_name: string;
  city: string;
  state: string;
  pincode: string;
  items: OrderItem[] | null;
  subtotal: number;
  delivery_fee: number;
  discount_amount?: number | null;
  coupon_code?: string | null;
  total: number;
  payment_status: string;
  order_status: string;
  courier_name?: string | null;
  tracking_id?: string | null;
  courier_tracking_url?: string | null;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });
}

const ICON = {
  phone:
    "M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z",
  hash: "M7 20l4-16m2 16l4-16M6 9h14M4 15h14",
  chat: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z",
  search: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
  truck:
    "M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0",
  pin: "M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z",
};

function Icon({ d, className = "", size = 18 }: { d: string; className?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d={d} />
    </svg>
  );
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
  let order: FoundOrder | null = null;
  let errorMsg = "";

  if (searched && isSupabaseConfigured()) {
    const parsedNo = parseOrderInput(trimmedOrderId);
    if (!parsedNo) {
      errorMsg = "That order ID doesn't look right. Try something like SNR-10001, or just the number.";
    } else {
      const supabase = await createClient();
      const { data } = await supabase.rpc("get_order_by_phone_no", {
        p_phone: trimmedPhone,
        p_order_no: parsedNo,
      });
      const found = Array.isArray(data) ? (data[0] as FoundOrder | undefined) : undefined;
      if (found) order = found;
      else errorMsg = "We couldn't find an order with these details. Please check your phone number and order ID.";
    }
  }

  const partialSearch = !!trimmedPhone !== !!trimmedOrderId;

  return (
    <div className="bg-white">
      {/* ── Header + search ── */}
      <section className="relative overflow-hidden bg-cream-50">
        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-honey-100/70 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-24 h-80 w-80 rounded-full bg-brand-50 blur-3xl" />

        <div className="relative mx-auto grid max-w-5xl items-center gap-8 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-[1fr_1.05fr] lg:gap-12 lg:px-8">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-medium text-gray-700 shadow-sm ring-1 ring-black/5">
              <LogoMark className="h-3.5 text-brand-700" />
              Order tracking
            </p>
            <h1 className="mt-4 text-3xl font-bold leading-tight tracking-tight text-ink sm:text-4xl">
              Where&apos;s my order?
            </h1>
            <p className="mt-3 max-w-md text-[15px] leading-relaxed text-gray-600">
              No account needed — just the phone number you ordered with and the order ID from
              your WhatsApp confirmation.
            </p>
            <ul className="mt-6 hidden space-y-3 lg:block">
              {[
                { d: ICON.chat, t: "Find your order ID in the WhatsApp confirmation" },
                { d: ICON.search, t: "Enter it here with your phone number" },
                { d: ICON.truck, t: "See live status, courier and tracking details" },
              ].map((s) => (
                <li key={s.t} className="flex items-center gap-3 text-sm text-gray-700">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-honey-700 shadow-sm ring-1 ring-black/5">
                    <Icon d={s.d} size={16} />
                  </span>
                  {s.t}
                </li>
              ))}
            </ul>
          </div>

          <form
            action="/order-history#result"
            method="GET"
            className="rounded-3xl bg-white p-5 shadow-xl shadow-black/5 ring-1 ring-black/5 sm:p-7"
          >
            <label htmlFor="phone" className="mb-1.5 block text-sm font-medium text-gray-700">
              Phone number
            </label>
            <div className="flex overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 transition focus-within:border-brand-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-brand-500/10">
              <span className="flex items-center gap-1.5 border-r border-gray-200 px-3 text-sm font-medium text-gray-500">
                <Icon d={ICON.phone} size={15} />
                +91
              </span>
              <input
                id="phone"
                name="phone"
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                defaultValue={trimmedPhone}
                placeholder="10-digit mobile number"
                required
                className="w-full bg-transparent px-3 py-3 text-sm text-ink placeholder:text-gray-400 focus:outline-none"
              />
            </div>

            <label htmlFor="order_id" className="mb-1.5 mt-4 block text-sm font-medium text-gray-700">
              Order ID
            </label>
            <div className="flex overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 transition focus-within:border-brand-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-brand-500/10">
              <span className="flex items-center border-r border-gray-200 px-3 text-gray-500">
                <Icon d={ICON.hash} size={15} />
              </span>
              <input
                id="order_id"
                name="order_id"
                type="text"
                defaultValue={trimmedOrderId}
                placeholder="e.g. SNR-10001"
                required
                className="w-full bg-transparent px-3 py-3 text-sm uppercase text-ink placeholder:normal-case placeholder:text-gray-400 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-ink px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-brand-800"
            >
              Find my order
              <Icon d="M17 8l4 4m0 0l-4 4m4-4H3" size={16} />
            </button>
            <p className="mt-3 text-center text-xs text-gray-500">
              Lost your order ID?{" "}
              <Link href="/contact" className="font-medium text-brand-700 underline-offset-2 hover:underline">
                Contact us
              </Link>
            </p>
          </form>
        </div>
      </section>

      {/* ── Result ── */}
      <section id="result" className="mx-auto max-w-3xl scroll-mt-24 px-4 py-10 sm:px-6 sm:py-14">
        {partialSearch && (
          <Notice tone="amber" title="Both fields are needed">
            Please enter your phone number <em>and</em> order ID to find your order.
          </Notice>
        )}

        {errorMsg && searched && (
          <Notice tone="red" title="Order not found">
            {errorMsg}
          </Notice>
        )}

        {order && <OrderResult order={order} />}

        {!searched && !partialSearch && (
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { d: ICON.chat, n: "1", t: "Check WhatsApp", s: "Your order ID (like SNR-10001) is in the confirmation message." },
              { d: ICON.search, n: "2", t: "Enter your details", s: "Use the same phone number you placed the order with." },
              { d: ICON.truck, n: "3", t: "Track it live", s: "See status, courier and tracking ID as soon as it ships." },
            ].map((c) => (
              <div key={c.n} className="rounded-2xl bg-cream-50 p-5 ring-1 ring-cream-200">
                <div className="flex items-center justify-between">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-honey-700 shadow-sm">
                    <Icon d={c.d} />
                  </span>
                  <span className="text-3xl font-bold text-cream-200">{c.n}</span>
                </div>
                <p className="mt-4 text-sm font-semibold text-ink">{c.t}</p>
                <p className="mt-1 text-xs leading-relaxed text-gray-600">{c.s}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Notice({
  tone,
  title,
  children,
}: {
  tone: "amber" | "red";
  title: string;
  children: React.ReactNode;
}) {
  const styles =
    tone === "amber"
      ? "bg-amber-50 text-amber-800 ring-amber-200"
      : "bg-red-50 text-red-800 ring-red-100";
  return (
    <div className={`flex items-start gap-4 rounded-2xl p-5 ring-1 ${styles}`}>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/80">
        <Icon d={tone === "amber" ? "M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" : ICON.search} />
      </span>
      <div>
        <p className="font-semibold">{title}</p>
        <p className="mt-0.5 text-sm opacity-90">{children}</p>
        {tone === "red" && (
          <Link href="/contact" className="mt-2 inline-block text-sm font-semibold underline underline-offset-2">
            Need help? Contact us
          </Link>
        )}
      </div>
    </div>
  );
}

function OrderResult({ order }: { order: FoundOrder }) {
  const items = Array.isArray(order.items) ? order.items : [];
  const itemCount = items.reduce((s, it) => s + (it.qty || 1), 0);
  const paid = order.payment_status === "paid";
  const paymentLabel = paid ? "Paid" : order.payment_status === "failed" ? "Payment failed" : "Payment pending";

  return (
    <article className="overflow-hidden rounded-3xl bg-white shadow-xl shadow-black/5 ring-1 ring-black/5">
      {/* Summary */}
      <header className="bg-ink px-5 py-5 text-white sm:px-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-white/50">Order</p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight">{formatOrderNo(order.order_no)}</h2>
            <p className="mt-1 text-sm text-white/60">
              Placed on {formatDate(order.created_at)} · {itemCount} item{itemCount === 1 ? "" : "s"}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-[0.18em] text-white/50">Total</p>
            <p className="mt-1 text-2xl font-bold">{formatINR(order.total)}</p>
            <span
              className={`mt-1 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                paid ? "bg-brand-500/20 text-brand-200" : order.payment_status === "failed" ? "bg-red-500/20 text-red-200" : "bg-honey-500/20 text-honey-100"
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${paid ? "bg-brand-300" : order.payment_status === "failed" ? "bg-red-300" : "bg-honey-500"}`} />
              {paymentLabel}
            </span>
          </div>
        </div>
      </header>

      <div className="space-y-6 p-5 sm:p-7">
        {/* Progress */}
        <div>
          <OrderProgress status={order.order_status} />
          {order.order_status !== "cancelled" && (
            <p className="mt-4 rounded-2xl bg-cream-50 px-4 py-3 text-center text-sm text-gray-700">
              {orderStatusMessage(order.order_status)}
            </p>
          )}
        </div>

        {/* Courier */}
        {order.courier_name && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-brand-50 px-4 py-3 ring-1 ring-brand-100">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-brand-700">
                <Icon d={ICON.truck} />
              </span>
              <div>
                <p className="text-sm font-semibold text-ink">{order.courier_name}</p>
                {order.tracking_id && <p className="text-xs text-gray-600">Tracking ID: {order.tracking_id}</p>}
              </div>
            </div>
            {order.courier_tracking_url && (
              <a
                href={order.courier_tracking_url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-brand-700 px-4 py-2 text-xs font-semibold text-white hover:bg-brand-800"
              >
                Track with courier ↗
              </a>
            )}
          </div>
        )}

        {/* Items */}
        <div>
          <h3 className="text-sm font-semibold text-ink">Items</h3>
          <ul className="mt-3 divide-y divide-gray-100">
            {items.map((it, i) => (
              <li key={i} className="flex items-center gap-3 py-3">
                <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-cream-100">
                  {it.image ? (
                    <Image src={it.image} alt={it.name || "Product"} fill sizes="56px" className="object-cover" />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center">
                      <LogoMark className="h-6 text-cream-200" />
                    </span>
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  {it.slug ? (
                    <Link href={`/products/${it.slug}`} className="line-clamp-1 text-sm font-medium text-ink hover:text-brand-700">
                      {it.name}
                    </Link>
                  ) : (
                    <p className="line-clamp-1 text-sm font-medium text-ink">{it.name}</p>
                  )}
                  <p className="text-xs text-gray-500">
                    {it.qty || 1} × {formatINR(Number(it.price || 0))}
                  </p>
                </div>
                <p className="text-sm font-semibold text-ink">
                  {formatINRExact(Number(it.price || 0) * Number(it.qty || 1))}
                </p>
              </li>
            ))}
          </ul>

          <dl className="mt-2 space-y-1.5 rounded-2xl bg-gray-50 p-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500">Subtotal</dt>
              <dd>{formatINRExact(order.subtotal)}</dd>
            </div>
            {Number(order.discount_amount) > 0 && (
              <div className="flex justify-between text-brand-700">
                <dt>Discount{order.coupon_code ? ` (${order.coupon_code})` : ""}</dt>
                <dd>−{formatINRExact(Number(order.discount_amount))}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-gray-500">Delivery</dt>
              <dd>{Number(order.delivery_fee) > 0 ? formatINRExact(order.delivery_fee) : "Free"}</dd>
            </div>
            <div className="flex justify-between border-t border-gray-200 pt-2 text-base font-bold text-ink">
              <dt>Total</dt>
              <dd>{formatINRExact(order.total)}</dd>
            </div>
          </dl>
        </div>

        {/* Delivery to */}
        <div className="flex items-start gap-3 text-sm text-gray-600">
          <Icon d={ICON.pin} className="mt-0.5 shrink-0 text-gray-400" />
          <p>
            Delivering to <span className="font-medium text-ink">{order.customer_name}</span>, {order.city},{" "}
            {order.state} – {order.pincode}
          </p>
        </div>

        {/* Actions */}
        <div className="grid gap-3 border-t border-gray-100 pt-5 sm:grid-cols-2">
          <Link
            href={`/track/${order.order_token}`}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-800"
          >
            <Icon d={ICON.truck} size={16} />
            Open tracking page
          </Link>
          <ReorderButton
            items={items}
            label="Order these again"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-gray-200 bg-white px-6 py-3 text-sm font-semibold text-ink transition-colors hover:border-ink"
          />
        </div>
      </div>
    </article>
  );
}
