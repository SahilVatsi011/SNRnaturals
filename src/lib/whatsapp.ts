import { STORE } from "./constants";

/**
 * Build a wa.me deep link with a pre-filled dispatch message.
 * NOT the WhatsApp Business API — just a deep link the admin taps once.
 */
export function buildWhatsAppDispatchLink(opts: {
  phone: string;
  customerName?: string;
  orderNo?: number;
  courierName?: string;
  trackingId?: string;
  trackingUrl?: string;
}) {
  const parts: string[] = [];
  parts.push(`Hello ${opts.customerName || "there"}!`);

  if (opts.orderNo) parts.push(`Your order #${opts.orderNo} from ${STORE.name}.`);
  parts.push("Thank you for shopping with us!");

  if (opts.courierName || opts.trackingId) {
    parts.push("");
    parts.push("📦 Dispatch details:");
    if (opts.courierName) parts.push(`Courier: ${opts.courierName}`);
    if (opts.trackingId) parts.push(`Tracking ID: ${opts.trackingId}`);
  }
  if (opts.trackingUrl) {
    parts.push(`Track your order: ${opts.trackingUrl}`);
  }

  const text = parts.join("\n");
  const url = new URL("https://wa.me/" + opts.phone.replace(/\D/g, ""));
  url.searchParams.set("text", text);
  return url.toString();
}
