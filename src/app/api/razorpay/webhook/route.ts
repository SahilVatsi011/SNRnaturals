import { NextResponse, type NextRequest } from "next/server";
import { getReceiptForRazorpayOrder, verifyWebhookSignature } from "@/lib/razorpay";
import { checkPaymentStatus } from "@/app/(store)/checkout/actions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Razorpay → our site, server to server. Confirms an order as paid even if the
 * customer closed their browser right after paying.
 *
 * Set up in Razorpay Dashboard → Webhooks:
 *   URL:    https://www.snrnaturals.com/api/razorpay/webhook
 *   Secret: same value as RAZORPAY_WEBHOOK_SECRET in Vercel
 *   Events: payment.captured, payment.authorized, order.paid
 *
 * The webhook body is only used to find which order to check; the order is
 * marked paid only after Razorpay's API confirms the payment (checkPaymentStatus),
 * which is also safe to run twice.
 */
const HANDLED = new Set(["payment.captured", "payment.authorized", "order.paid"]);

export async function POST(request: NextRequest) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[razorpay-webhook] RAZORPAY_WEBHOOK_SECRET is not set");
    // 503 so Razorpay retries once the secret is configured.
    return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  }

  const raw = await request.text();
  const signature = request.headers.get("x-razorpay-signature") ?? "";
  if (!verifyWebhookSignature(raw, signature, secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let event: {
    event?: string;
    payload?: {
      payment?: { entity?: { order_id?: string } };
      order?: { entity?: { id?: string; receipt?: string } };
    };
  };
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Bad JSON" }, { status: 400 });
  }

  if (!event.event || !HANDLED.has(event.event)) {
    return NextResponse.json({ ok: true, ignored: event.event ?? null });
  }

  try {
    let orderId = event.payload?.order?.entity?.receipt ?? null;
    const rzpOrderId = event.payload?.payment?.entity?.order_id ?? event.payload?.order?.entity?.id;
    if (!orderId && rzpOrderId) orderId = await getReceiptForRazorpayOrder(rzpOrderId);
    if (!orderId) return NextResponse.json({ ok: true, ignored: "no order" });

    const result = await checkPaymentStatus(orderId);
    if (result.error && result.error !== "Order not found.") {
      // Temporary problem (e.g. gateway unreachable) — 500 makes Razorpay retry.
      console.error("[razorpay-webhook]", event.event, orderId, result.error);
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
    return NextResponse.json({ ok: true, paid: result.paid });
  } catch (err) {
    console.error("[razorpay-webhook] failed:", err);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}
