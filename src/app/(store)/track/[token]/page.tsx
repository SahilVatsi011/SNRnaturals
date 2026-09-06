import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { STORE } from "@/lib/constants";
import { formatOrderNo } from "@/lib/order-utils";
import { OrderStatusBadge } from "@/components/admin/OrderStatusBadge";
import { ReorderButton } from "@/components/store/ReorderButton";

export const dynamic = "force-dynamic";

function price(n: number) {
  return "₹" + Number(n).toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

const progress: Record<string, number> = {
  pending: 1,
  processing: 2,
  shipped: 3,
  delivered: 4,
};

export default async function TrackPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let order: any = null;

  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { data } = await supabase.rpc("get_order_by_token", { p_token: token });
    order = Array.isArray(data) ? data[0] : undefined;
  }

  if (!order) notFound();

  const items: { name?: string; price?: number; qty?: number }[] =
    Array.isArray(order.items) ? order.items : [];
  const step = progress[order.order_status] ?? 1;
  const isCancelled = order.order_status === "cancelled";

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      {isCancelled ? (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          This order was cancelled.
        </div>
      ) : (
        <div className="mb-6">
          <p className="text-sm text-stone-500">Order status</p>
          <h1 className="text-2xl font-bold text-stone-800">
            Order {formatOrderNo(order.order_no)}
          </h1>
          {/* Progress steps */}
          <div className="mt-4 flex items-center">
            {["pending", "processing", "shipped", "delivered"].map(
              (s, i) => (
                <div key={s} className="flex flex-1 items-center last:flex-none">
                  <div className="flex flex-col items-center">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                        i < step
                          ? "bg-brand-600 text-white"
                          : "bg-stone-200 text-stone-400"
                      }`}
                    >
                      {i < step ? "✓" : i + 1}
                    </div>
                    <span className="mt-1 text-xs capitalize text-stone-500">
                      {s}
                    </span>
                  </div>
                  {i < 3 && (
                    <div
                      className={`h-1 flex-1 mx-1 ${
                        i < step - 1 ? "bg-brand-600" : "bg-stone-200"
                      }`}
                    />
                  )}
                </div>
              )
            )}
          </div>
        </div>
      )}

      <div className="rounded-lg border border-stone-200 bg-white p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-stone-800">Items</h2>
          <ReorderButton items={items} />
        </div>
        <table className="w-full text-sm">
          <tbody>
            {items.map((item, i) => (
              <tr key={i} className="border-b border-stone-100 last:border-0">
                <td className="py-2 text-stone-700">{item.name}</td>
                <td className="py-2 text-center">{item.qty}</td>
                <td className="py-2 text-right">
                  {price(Number(item.price) * Number(item.qty))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-3 space-y-1 border-t border-stone-200 pt-3 text-sm">
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
            <span>{price(Number(order.delivery_fee))}</span>
          </div>
          <div className="flex justify-between text-base font-bold">
            <span>Total</span>
            <span>{price(Number(order.total))}</span>
          </div>
        </div>
      </div>

      {order.courier_name && (
        <div className="mt-4 rounded-lg border border-stone-200 bg-white p-5 text-sm">
          <h3 className="mb-1 font-semibold text-stone-800">Dispatch details</h3>
          <p>
            Courier: {order.courier_name}
            {order.tracking_id ? ` / ${order.tracking_id}` : ""}
          </p>
        </div>
      )}

      <div className="mt-6 text-center text-sm text-stone-500">
        <StatusBadgeLegacy status={order.order_status} />
        <p className="mt-2 text-xs">
          Questions? Contact us at {STORE.phone || STORE.domain}
        </p>
        <Link href="/" className="mt-2 inline-block text-brand-600 hover:underline">
          Continue shopping
        </Link>
      </div>
    </div>
  );
}

function StatusBadgeLegacy({ status }: { status: string }) {
  return (
    <span className="inline-block">
      Status: <OrderStatusBadge status={status} />
    </span>
  );
}
