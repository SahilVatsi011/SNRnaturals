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
