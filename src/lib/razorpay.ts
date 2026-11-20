import Razorpay from "razorpay";
import crypto from "crypto";

let _instance: Razorpay | null = null;

function getRazorpay(): Razorpay {
  if (_instance) return _instance;

  const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error("Razorpay keys are not configured.");
  }

  _instance = new Razorpay({ key_id: keyId, key_secret: keySecret });
  return _instance;
}

export async function createRazorpayOrder(amountPaise: number, receipt: string) {
  const razorpay = getRazorpay();
  const order = await razorpay.orders.create({
    amount: amountPaise,
    currency: "INR",
    receipt,
  });
  return order;
}

export function verifyRazorpayPayment(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string
): boolean {
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) return false;

  const body = razorpayOrderId + "|" + razorpayPaymentId;
  const expectedSignature = crypto
    .createHmac("sha256", keySecret)
    .update(body)
    .digest("hex");

  return expectedSignature === razorpaySignature;
}

/**
 * Ask Razorpay directly whether our order (receipt = our order id) was paid.
 * Used when the browser never reported back after payment (e.g. the phone
 * dropped the connection while returning from a UPI app).
 * An "authorized" payment of the full amount is captured so the money settles.
 */
export async function findSuccessfulPayment(
  receipt: string,
  amountPaise: number
): Promise<{ paymentId: string; method?: string } | null> {
  const razorpay = getRazorpay();
  const orders = await razorpay.orders.all({ receipt, count: 10 });
  for (const order of orders.items ?? []) {
    if (order.receipt !== receipt || Number(order.amount) !== amountPaise) continue;
    const payments = await razorpay.orders.fetchPayments(order.id);
    for (const p of payments.items ?? []) {
      if (Number(p.amount) !== amountPaise) continue;
      if (p.status === "captured") return { paymentId: p.id, method: p.method };
      if (p.status === "authorized") {
        const captured = await razorpay.payments.capture(p.id, p.amount, p.currency);
        if (captured.status === "captured") return { paymentId: p.id, method: p.method };
      }
    }
  }
  return null;
}
