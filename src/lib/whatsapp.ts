import { STORE } from "./constants";
import { formatOrderNo } from "./order-utils";

/**
 * Build WhatsApp deep links with pre-filled messages.
 * NOT the WhatsApp Business API — just api.whatsapp.com links the admin taps.
 */

function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return "91" + digits;
  if (digits.startsWith("0")) return "91" + digits.slice(1);
  return digits;
}

function makeWaLink(phone: string, text: string) {
  const url = new URL("https://api.whatsapp.com/send");
  url.searchParams.set("phone", formatPhone(phone));
  url.searchParams.set("text", text);
  return url.toString();
}

/** Append the "how to track your order" steps + direct link to a message. */
function appendTrackingSteps(
  lines: string[],
  o: { orderId: string; phone?: string; trackingUrl?: string }
) {
  if (lines[lines.length - 1] !== "") {
    lines.push("");
  }
  lines.push("🔎 *Track Your Order Status:*");
  lines.push(`   Order ID: ${o.orderId}`);
  if (o.phone) {
    lines.push(`   Phone Number: ${o.phone}`);
  }
  lines.push("");
  lines.push("Steps:");
  lines.push(`1. Open ${STORE.appUrl}/order-history`);
  lines.push("2. Tap \"Track Your Order\"");
  lines.push(`3. Enter Order ID: ${o.orderId}`);
  if (o.phone) {
    lines.push(`4. Enter Phone Number: ${o.phone}`);
  }
  lines.push("5. Tap Track");
  if (o.trackingUrl) {
    lines.push("");
    lines.push("⚡ For instant status, tap here:");
    lines.push(o.trackingUrl);
  }
}

/** Message sent when a new order is placed (order received confirmation) */
export function buildWhatsAppOrderReceivedLink(opts: {
  phone: string;
  customerName?: string;
  orderNo?: number;
  total?: number;
  trackingUrl?: string;
}) {
  const orderId = opts.orderNo ? formatOrderNo(opts.orderNo) : "";
  const lines: string[] = [];
  lines.push(`Hi ${opts.customerName || "there"}! 👋`);
  lines.push("");
  lines.push(`✅ *Your order ${orderId} has been received!*`);
  lines.push(`Thank you for ordering from ${STORE.name}.`);
  lines.push("");
  if (opts.total) {
    lines.push(`💰 Total: ₹${Number(opts.total).toLocaleString("en-IN")}`);
  }
  lines.push(`📋 Order ID: *${orderId}*`);
  lines.push(`📞 Phone Number: ${opts.phone}`);
  lines.push(`📋 Status: Being processed`);
  appendTrackingSteps(lines, {
    orderId,
    phone: opts.phone,
    trackingUrl: opts.trackingUrl,
  });
  lines.push("");
  lines.push(`We'll notify you once it's dispatched. 📦`);
  lines.push("");
  lines.push(`— ${STORE.name}, ${STORE.city}`);

  return makeWaLink(opts.phone, lines.join("\n"));
}

/** Message sent when order is dispatched with courier details */
export function buildWhatsAppDispatchLink(opts: {
  phone: string;
  customerName?: string;
  orderNo?: number;
  courierName?: string;
  trackingId?: string;
  trackingUrl?: string;
  courierTrackingUrl?: string;
}) {
  const orderId = opts.orderNo ? formatOrderNo(opts.orderNo) : "";
  const lines: string[] = [];
  lines.push(`Hi ${opts.customerName || "there"}! 👋`);
  lines.push("");
  lines.push(`🚚 *Your order ${orderId} has been dispatched!*`);
  lines.push(`📞 Phone Number: ${opts.phone}`);
  lines.push("");

  if (opts.courierName || opts.trackingId) {
    lines.push("📦 *Dispatch Details:*");
    if (opts.courierName) lines.push(`  Courier: ${opts.courierName}`);
    if (opts.trackingId) lines.push(`  Tracking ID: ${opts.trackingId}`);
    lines.push("");
  }

  if (opts.courierTrackingUrl) {
    lines.push(`🔗 Track on courier website:`);
    lines.push(opts.courierTrackingUrl);
    lines.push("");
  }

  appendTrackingSteps(lines, {
    orderId,
    phone: opts.phone,
    trackingUrl: opts.trackingUrl,
  });
  lines.push("");
  lines.push(`Thank you for shopping with ${STORE.name}! 🙏`);
  lines.push(`— ${STORE.name}, ${STORE.city}`);

  return makeWaLink(opts.phone, lines.join("\n"));
}

/** Message sent when an order is delivered (thank-you / feedback) */
export function buildWhatsAppDeliveredLink(opts: {
  phone: string;
  customerName?: string;
  orderNo?: number;
  trackingUrl?: string;
}) {
  const orderId = opts.orderNo ? formatOrderNo(opts.orderNo) : "";
  const lines: string[] = [];
  lines.push(`Hi ${opts.customerName || "there"}! 👋`);
  lines.push("");
  lines.push(`🎉 *Your order ${orderId} has been delivered!*`);
  lines.push(`🙏 Thank you for shopping with ${STORE.name}.`);
  lines.push("");
  lines.push(`📋 Order ID: *${orderId}*`);
  lines.push(`📞 Phone Number: ${opts.phone}`);
  appendTrackingSteps(lines, {
    orderId,
    phone: opts.phone,
    trackingUrl: opts.trackingUrl,
  });
  lines.push("");
  lines.push("We'd love to hear your feedback — please share a review or rating!");
  lines.push("");
  lines.push(`— ${STORE.name}, ${STORE.city}`);

  return makeWaLink(opts.phone, lines.join("\n"));
}

/** Promo message for top customers */
export function buildWhatsAppPromoLink(opts: {
  phone: string;
  customerName?: string;
}) {
  const lines: string[] = [];
  lines.push(`Hi ${opts.customerName || "there"}! 👋`);
  lines.push("");
  lines.push(`🌿 Thank you for being a valued customer of ${STORE.name}!`);
  lines.push("");
  lines.push(`We have a special offer just for you! 🎉`);
  lines.push("");
  lines.push(`Use code: *[COUPON_CODE]* to get *[X]% OFF* on your next order!`);
  lines.push("");
  lines.push(`Shop now: ${STORE.appUrl}`);
  lines.push("");
  lines.push(`— ${STORE.name}, ${STORE.city}`);

  return makeWaLink(opts.phone, lines.join("\n"));
}
