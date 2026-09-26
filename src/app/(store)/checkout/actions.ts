"use server";

import { createClient } from "@/lib/supabase/server";
import { getServiceRoleClient } from "@/lib/supabase/service";
import { isSupabaseConfigured } from "@/lib/env";
import { generateOrderToken } from "@/lib/order-utils";
import { calculateDeliveryFee, type DeliverySlab } from "@/lib/delivery";
import { createRazorpayOrder, verifyRazorpayPayment } from "@/lib/razorpay";
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
  const email = String(formData.get("email") || "").trim();
  const addressLine1 = String(formData.get("address_line1") || "").trim();
  const addressLine2 = String(formData.get("address_line2") || "").trim();
  const city = String(formData.get("city") || "").trim();
  const state = String(formData.get("state") || "").trim();
  const pincode = String(formData.get("pincode") || "").trim();

  if (!customerName || !customerPhone || !addressLine1 || !city || !state || !pincode) {
    return { error: "Please fill in all required fields." };
  }

  // WhatsApp number is mandatory and must be a valid Indian mobile number
  if (!normalizePhone(customerPhone)) {
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

  // Fetch active delivery slabs and compute fee
  const { data: slabs } = await supabase
    .from("delivery_slabs")
    .select("id,min_weight_grams,max_weight_grams,price,active")
    .eq("active", true);

  const { fee: deliveryFee } = calculateDeliveryFee(
    totalWeight,
    (slabs ?? []) as DeliverySlab[]
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

  const { error: insertError } = await supabase.from("orders").insert(order);

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

  // Payment signature verified above. Use the service-role client
  // for the update + stock deduction (orders are admin-managed, and
  // anon users must not be able to mutate orders directly).
  const supabase = getServiceRoleClient();

  // Fetch the order
  const { data: order, error: fetchError } = await supabase
    .from("orders")
    .select("id,order_token,payment_status,items")
    .eq("id", orderId)
    .single();

  if (fetchError || !order) return { error: "Order not found." };

  // Don't double-process
  if (order.payment_status === "paid") {
    return { orderToken: order.order_token };
  }

  // Mark payment as paid
  const { error: updateError } = await supabase
    .from("orders")
    .update({
      payment_status: "paid",
      payment_id: razorpayPaymentId,
      payment_method: "Razorpay",
      order_status: "processing",
    })
    .eq("id", orderId);

  if (updateError) return { error: updateError.message };

  // Deduct stock for each item
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

  return { orderToken: order.order_token };
}
