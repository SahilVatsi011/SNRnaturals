"use server";

import { revalidateTag } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { CACHE_TAGS } from "@/lib/cache-tags";
import { getServiceRoleClient } from "@/lib/supabase/service";
import { isSupabaseConfigured } from "@/lib/env";
import { generateOrderToken } from "@/lib/order-utils";
import { calculateDeliveryFee, type DeliverySlab, type DeliveryZone } from "@/lib/delivery";
import { createRazorpayOrder, findSuccessfulPayment, verifyRazorpayPayment } from "@/lib/razorpay";
import { normalizePhone } from "@/lib/phone";

interface CartLine {
  product_id: string;
  name?: string;
  qty: number;
}

export async function createOrder(
  formData: FormData
): Promise<{ orderToken?: string; orderId?: string; razorpayOrderId?: string; amount?: number; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { error: "Store is not configured yet." };
  }

  const supabase = await createClient();

  const customerName = String(formData.get("customer_name") || "").trim();
  const customerPhone = String(formData.get("customer_phone") || "").trim();
  const customerWhatsapp = String(formData.get("customer_whatsapp") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const addressLine1 = String(formData.get("address_line1") || "").trim();
  const addressLine2 = String(formData.get("address_line2") || "").trim();
  const city = String(formData.get("city") || "").trim();
  const state = String(formData.get("state") || "").trim();
  const pincode = String(formData.get("pincode") || "").trim();

  if (!customerName || !customerPhone || !addressLine1 || !city || !state || !pincode) {
    return { error: "Please fill in all required fields." };
  }

  // Phone and WhatsApp numbers are both mandatory valid Indian mobile numbers
  if (!normalizePhone(customerPhone)) {
    return { error: "Enter a valid 10-digit phone number." };
  }
  if (!normalizePhone(customerWhatsapp)) {
    return { error: "Enter a valid 10-digit WhatsApp number." };
  }

  // Parse cart lines from JSON
  let cartLines: CartLine[] = [];
  try {
    cartLines = JSON.parse(String(formData.get("cart") || "[]"));
  } catch {
    return { error: "Invalid cart data." };
  }

  if (cartLines.length === 0) {
    return { error: "Your cart is empty." };
  }

  // Fetch live products to validate + get current prices/weights
  const ids = cartLines.map((l) => l.product_id);
  const { data: products, error: productError } = await supabase
    .from("products")
    .select("id,name,slug,price,weight_grams,stock_qty,active,images")
    .in("id", ids);

  if (productError) return { error: "Could not verify products." };

  const productMap = new Map((products ?? []).map((p) => [p.id, p]));

  // Build order items, check stock
  const items: {
    product_id: string;
    slug: string;
    name: string;
    price: number;
    qty: number;
    weight_grams: number;
    image?: string | null;
  }[] = [];

  let subtotal = 0;
  let totalWeight = 0;

  for (const line of cartLines) {
    const p = productMap.get(line.product_id);
    if (!p || !p.active) {
      return { error: "A product in your cart is no longer available." };
    }
    if (p.stock_qty < line.qty) {
      return { error: `Insufficient stock for ${p.name}.` };
    }
    items.push({
      product_id: p.id,
      slug: p.slug,
      name: p.name,
      price: Number(p.price),
      qty: line.qty,
      weight_grams: Number(p.weight_grams || 0),
      image: p.images?.[0] ?? null,
    });
    subtotal += Number(p.price) * line.qty;
    totalWeight += Number(p.weight_grams || 0) * line.qty;
  }

  // Delivery fee: PIN-code zone (if any matches) × cart weight.
  const [{ data: slabs }, { data: zones }] = await Promise.all([
    supabase.from("delivery_slabs").select("*").eq("active", true),
    // Missing table (migration not run yet) just means "no zones".
    supabase.from("delivery_zones").select("id,name,pin_prefixes,active").eq("active", true),
  ]);

  const { fee: deliveryFee } = calculateDeliveryFee(
    totalWeight,
    (slabs ?? []) as DeliverySlab[],
    { pincode, zones: (zones ?? []) as DeliveryZone[] }
  );

  // Handle coupon code
  const couponCode = String(formData.get("coupon_code") || "").trim().toUpperCase();
  let discountAmount = 0;

  if (couponCode) {
    const { data: coupon } = await supabase
      .from("coupons")
      .select("code,discount_percent,active")
      .eq("code", couponCode)
      .eq("active", true)
      .single();

    if (coupon) {
      discountAmount = Math.round((subtotal * Number(coupon.discount_percent)) / 100 * 100) / 100;
    }
  }

  const total = subtotal - discountAmount + deliveryFee;
  const orderToken = generateOrderToken();

  const order = {
    order_token: orderToken,
    customer_name: customerName,
    customer_phone: customerPhone,
    customer_whatsapp: customerWhatsapp,
    email: email || null,
    address_line1: addressLine1,
    address_line2: addressLine2 || null,
    city,
    state,
    pincode,
    items,
    subtotal,
    delivery_fee: deliveryFee,
    discount_amount: discountAmount,
    coupon_code: couponCode || null,
    total,
    payment_status: "pending",
    order_status: "pending",
  };

  // The `customer_whatsapp` column is added by migration 0006. Until that
  // migration runs on the live DB the insert above fails with a
  // "could not find the customer_whatsapp column" cache error — fall back
  // to inserting without it (store keeps working; once the column exists,
  // WhatsApp is captured on every new order).
  let orderToInsert: Record<string, unknown> = order;
  let { error: insertError } = await supabase
    .from("orders")
    .insert(orderToInsert);

  if (insertError && /customer_whatsapp/i.test(insertError.message)) {
    orderToInsert = { ...order };
    delete orderToInsert.customer_whatsapp;
    ({ error: insertError } = await supabase
      .from("orders")
      .insert(orderToInsert));
  }

  if (insertError) return { error: insertError.message };

  // Fetch the created order via the secure SECURITY DEFINER RPC.
  // (INSERT ... RETURNING is blocked by RLS for anon users, so the
  // row is read back by token instead.)
  const { data: fetched, error: fetchError } = await supabase.rpc("get_order_by_token", {
    p_token: orderToken,
  });

  if (fetchError) return { error: fetchError.message };

  const row = Array.isArray(fetched)
    ? (fetched[0] as { id: string; order_token: string })
    : null;
  if (!row) return { error: "Could not retrieve your order. Please try again." };

  // Create a Razorpay order (amount in paise)
  try {
    const amountPaise = Math.round(total * 100);
    const razorpayOrder = await createRazorpayOrder(amountPaise, row.id);
    return {
      orderId: row.id,
      orderToken: row.order_token,
      razorpayOrderId: razorpayOrder.id,
      amount: amountPaise,
    };
  } catch {
    return { error: "Failed to initialize payment. Please try again." };
  }
}

/**
 * Verify Razorpay payment signature, mark order as paid, and deduct stock.
 */
export async function verifyPayment(
  orderId: string,
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string
): Promise<{ orderToken?: string; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { error: "Store is not configured yet." };
  }

  // Verify the payment signature
  const isValid = verifyRazorpayPayment(razorpayOrderId, razorpayPaymentId, razorpaySignature);
  if (!isValid) {
    return { error: "Payment verification failed. Please contact support." };
  }

  // Payment signature verified above. Orders are admin-managed, so use the
  // service-role client for the update + stock deduction.
  const supabase = getServiceRoleClient();
  const { data: order, error: fetchError } = await supabase
    .from("orders")
    .select("id,order_token,payment_status,items")
    .eq("id", orderId)
    .single();
  if (fetchError || !order) return { error: "Order not found." };

  const marked = await markOrderPaid(supabase, order, razorpayPaymentId);
  if (marked.error) return { error: marked.error };
  return { orderToken: order.order_token };
}

type PayableOrder = { id: string; order_token: string; payment_status: string; items: unknown };

/**
 * Mark an order paid and deduct stock — exactly once, even if the browser's
 * verify call and a status check arrive at the same time.
 */
async function markOrderPaid(
  supabase: ReturnType<typeof getServiceRoleClient>,
  order: PayableOrder,
  paymentId: string,
  method = "Razorpay"
): Promise<{ error?: string }> {
  if (order.payment_status === "paid") return {};

  const { data: updated, error } = await supabase
    .from("orders")
    .update({
      payment_status: "paid",
      payment_id: paymentId,
      payment_method: method,
      order_status: "processing",
    })
    .eq("id", order.id)
    .neq("payment_status", "paid")
    .select("id");
  if (error) return { error: error.message };
  if (!updated || updated.length === 0) return {}; // someone else just marked it paid

  const items = order.items as { product_id: string; qty: number }[];
  for (const item of items) {
    const { data: product } = await supabase
      .from("products")
      .select("stock_qty")
      .eq("id", item.product_id)
      .single();
    if (product) {
      await supabase
        .from("products")
        .update({ stock_qty: Math.max(0, product.stock_qty - item.qty) })
        .eq("id", item.product_id);
    }
  }

  // Stock changed — refresh cached product pages so "Sold out" shows promptly.
  revalidateTag(CACHE_TAGS.products);
  return {};
}

/**
 * Has this order been paid? Checks our database first, then asks Razorpay
 * directly, so a payment is never lost if the browser couldn't report back.
 * Safe to call publicly: it only marks an order paid when Razorpay confirms it.
 */
export async function checkPaymentStatus(
  orderId: string
): Promise<{ paid: boolean; orderToken?: string; error?: string }> {
  if (!isSupabaseConfigured()) return { paid: false, error: "Store is not configured yet." };
  if (!/^[0-9a-f-]{36}$/i.test(orderId)) return { paid: false, error: "Order not found." };

  const supabase = getServiceRoleClient();
  const { data: order } = await supabase
    .from("orders")
    .select("id,order_token,payment_status,items,total")
    .eq("id", orderId)
    .single();
  if (!order) return { paid: false, error: "Order not found." };
  if (order.payment_status === "paid") return { paid: true, orderToken: order.order_token };

  try {
    const payment = await findSuccessfulPayment(order.id, Math.round(Number(order.total) * 100));
    if (!payment) return { paid: false };
    const marked = await markOrderPaid(supabase, order, payment.paymentId);
    if (marked.error) return { paid: false, error: marked.error };
    return { paid: true, orderToken: order.order_token };
  } catch (err) {
    console.error("[checkout] payment status check failed:", err);
    return { paid: false, error: "Could not reach the payment gateway. Please try again." };
  }
}
