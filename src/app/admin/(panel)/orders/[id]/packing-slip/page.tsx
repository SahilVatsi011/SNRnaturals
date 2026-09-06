import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { STORE } from "@/lib/constants";
import { formatOrderNo } from "@/lib/order-utils";

export const dynamic = "force-dynamic";

function currency(n: number) {
  return "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

interface OrderItem {
  name?: string;
  price?: number;
  qty?: number;
  weight_grams?: number;
}

export default async function PackingSlipPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!isSupabaseConfigured()) {
    return <p className="p-6 text-sm text-stone-500">Supabase not configured.</p>;
  }

  const supabase = await createClient();
  const { data: order } = await supabase
    .from("orders")
    .select("*")
    .eq("id", id)
    .single();

  if (!order) notFound();

  const items: OrderItem[] = Array.isArray(order.items) ? order.items : [];

  return (
    <div className="min-h-screen bg-stone-200 p-6 print:bg-white print:p-0">
      <div className="mx-auto max-w-2xl rounded-lg bg-white p-8 shadow print:max-w-none print:rounded-none print:shadow-none">
        <div className="mb-6 flex items-start justify-between border-b border-stone-300 pb-4 print:hidden">
          <h1 className="text-xl font-bold text-stone-800">Packing Slip</h1>
          <button
            onClick={() => window.print()}
            className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            Print
          </button>
        </div>

        {/* Header */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-stone-900">
              {STORE.name}
            </h2>
            <p className="text-sm text-stone-600">
              {STORE.city}, {STORE.district}, {STORE.state}
            </p>
            {STORE.phone && (
              <p className="text-sm text-stone-600">Ph: {STORE.phone}</p>
            )}
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-stone-500">Packing Slip</p>
            <p className="text-2xl font-bold text-stone-900">{formatOrderNo(order.order_no)}</p>
            <p className="text-sm text-stone-500">
              {new Date(order.created_at).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </p>
            {order.courier_name && (
              <p className="mt-1 text-sm text-stone-600">
                Courier: {order.courier_name}
                {order.tracking_id ? ` / ${order.tracking_id}` : ""}
              </p>
            )}
          </div>
        </div>

        {/* Customer */}
        <div className="mb-6 rounded border border-stone-200 p-4">
          <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-stone-400">
            Ship To
          </h3>
          <p className="font-medium text-stone-800">{order.customer_name}</p>
          <p className="text-stone-600">{order.customer_phone}</p>
          <p className="text-stone-600">
            {order.address_line1}
            {order.address_line2 ? `, ${order.address_line2}` : ""}, {order.city},{" "}
            {order.state} — {order.pincode}
          </p>
        </div>

        {/* Items */}
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-stone-300 text-left text-stone-500">
              <th className="py-2">Item</th>
              <th className="py-2 text-center">Qty</th>
              <th className="py-2 text-right">Unit</th>
              <th className="py-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={i} className="border-b border-stone-200">
                <td className="py-2 text-stone-800">
                  {item.name}
                  {item.weight_grams ? (
                    <span className="ml-1 text-xs text-stone-400">
                      ({item.weight_grams}g)
                    </span>
                  ) : null}
                </td>
                <td className="py-2 text-center">{item.qty}</td>
                <td className="py-2 text-right">{currency(Number(item.price))}</td>
                <td className="py-2 text-right font-medium">
                  {currency(Number(item.price) * Number(item.qty))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-4 space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-stone-500">Subtotal</span>
            <span>{currency(Number(order.subtotal))}</span>
          </div>
          {Number(order.discount_amount) > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Discount {order.coupon_code ? `(${order.coupon_code})` : ""}</span>
              <span>-{currency(Number(order.discount_amount))}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-stone-500">Delivery</span>
            <span>{currency(Number(order.delivery_fee))}</span>
          </div>
          <div className="flex justify-between text-base font-bold">
            <span>Total</span>
            <span>{currency(Number(order.total))}</span>
          </div>
        </div>

        <div className="mt-8 border-t border-stone-300 pt-4 text-xs text-stone-400">
          <p>Items should be packed securely. Please verify contents before dispatch.</p>
          <p className="mt-1">Thank you — {STORE.name}</p>
        </div>
      </div>
    </div>
  );
}
