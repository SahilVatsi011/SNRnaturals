import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { STORE } from "@/lib/constants";
import { buildWhatsAppDispatchLink } from "@/lib/whatsapp";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { OrderStatusBadge } from "@/components/admin/OrderStatusBadge";
import {
  OrderStatusManager,
  CourierForm,
} from "@/components/admin/OrderActions";
import {
  updateOrderStatus,
  updateCourier,
} from "../actions";

export const dynamic = "force-dynamic";

function currency(n: number) {
  return "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

interface OrderItem {
  product_id?: string;
  name?: string;
  price?: number;
  qty?: number;
  weight_grams?: number;
}

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!isSupabaseConfigured()) {
    return (
      <div>
        <h1 className="mb-4 text-2xl font-bold text-stone-800">Order</h1>
        <p className="text-sm text-stone-500">
          Supabase is not configured. Add your keys to view orders.
        </p>
      </div>
    );
  }

  const supabase = await createClient();
  const { data: order } = await supabase
    .from("orders")
    .select("*")
    .eq("id", id)
    .single();

  if (!order) notFound();

  const items: OrderItem[] = Array.isArray(order.items) ? order.items : [];
  const trackingUrl = `${STORE.appUrl}/track/${order.order_token}`;
  const whatsappLink = buildWhatsAppDispatchLink({
    phone: order.customer_phone,
    customerName: order.customer_name,
    orderNo: order.order_no,
    courierName: order.courier_name,
    trackingId: order.tracking_id,
    trackingUrl,
  });

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">
            Order #{order.order_no}
          </h1>
          <p className="text-sm text-stone-500">
            Placed{" "}
            {new Date(order.created_at).toLocaleString("en-IN", {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href={`/admin/orders/${id}/packing-slip`}>
            <Button variant="secondary" size="sm">
              🖨️ Packing Slip
            </Button>
          </Link>
          <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
            <Button variant="secondary" size="sm">📱 WhatsApp Dispatch</Button>
          </a>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Items */}
          <Card>
            <h2 className="mb-3 text-lg font-semibold text-stone-800">Items</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-200 text-left text-stone-500">
                  <th className="pb-2">Product</th>
                  <th className="pb-2">Qty</th>
                  <th className="pb-2">Price</th>
                  <th className="pb-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={i} className="border-b border-stone-100">
                    <td className="py-2 text-stone-700">{item.name}</td>
                    <td className="py-2">{item.qty}</td>
                    <td className="py-2">{currency(Number(item.price))}</td>
                    <td className="py-2 text-right font-medium">
                      {currency(Number(item.price) * Number(item.qty))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-3 space-y-1 border-t border-stone-200 pt-3 text-sm">
              <div className="flex justify-between">
                <span className="text-stone-500">Subtotal</span>
                <span>{currency(Number(order.subtotal))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Delivery fee</span>
                <span>{currency(Number(order.delivery_fee))}</span>
              </div>
              <div className="flex justify-between text-base font-semibold">
                <span>Total</span>
                <span className="text-brand-700">
                  {currency(Number(order.total))}
                </span>
              </div>
            </div>
          </Card>

          {/* Courier */}
          <Card>
            <h2 className="mb-3 text-lg font-semibold text-stone-800">
              Courier / Tracking
            </h2>
            <CourierForm
              orderId={order.id}
              courierName={order.courier_name}
              trackingId={order.tracking_id}
              updateCourier={updateCourier}
            />
          </Card>
        </div>

        <div className="space-y-6">
          {/* Status */}
          <Card>
            <h2 className="mb-3 text-lg font-semibold text-stone-800">Status</h2>
            <div className="mb-3">
              <OrderStatusBadge status={order.order_status} />
            </div>
            <OrderStatusManager
              orderId={order.id}
              currentStatus={order.order_status}
              updateStatus={updateOrderStatus}
            />
          </Card>

          {/* Customer */}
          <Card>
            <h2 className="mb-3 text-lg font-semibold text-stone-800">
              Customer & Delivery
            </h2>
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-stone-500">Name</dt>
                <dd className="font-medium text-stone-800">
                  {order.customer_name}
                </dd>
              </div>
              <div>
                <dt className="text-stone-500">Phone</dt>
                <dd className="font-medium text-stone-800">
                  {order.customer_phone}
                </dd>
              </div>
              {order.email && (
                <div>
                  <dt className="text-stone-500">Email</dt>
                  <dd className="text-stone-800">{order.email}</dd>
                </div>
              )}
              <div>
                <dt className="text-stone-500">Address</dt>
                <dd className="text-stone-800">
                  {order.address_line1}
                  {order.address_line2 ? `, ${order.address_line2}` : ""},{" "}
                  {order.city}, {order.state} — {order.pincode}
                </dd>
              </div>
            </dl>
          </Card>

          {/* Payment */}
          <Card>
            <h2 className="mb-3 text-lg font-semibold text-stone-800">Payment</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-stone-500">Status</dt>
                <dd className="font-medium capitalize text-stone-800">
                  {order.payment_status}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-stone-500">Method</dt>
                <dd className="capitalize text-stone-800">
                  {order.payment_method || "—"}
                </dd>
              </div>
              {order.payment_id && (
                <div>
                  <dt className="text-stone-500">Payment ID</dt>
                  <dd className="break-all text-xs text-stone-600">
                    {order.payment_id}
                  </dd>
                </div>
              )}
            </dl>
          </Card>
        </div>
      </div>
    </div>
  );
}
