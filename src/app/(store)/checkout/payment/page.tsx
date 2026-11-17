"use client";

import { startNavProgress } from "@/components/ui/NavProgress";
import { Suspense, useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { verifyPayment } from "../actions";
import { saveCart } from "@/lib/cart";
import { formatINRExact } from "@/lib/format";
import { LogoMark } from "@/components/Logo";

function clearCart() {
  saveCart([]);
  window.dispatchEvent(new Event("snr:cart"));
}

type Stage = "loading" | "ready" | "processing" | "success" | "error";

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]')) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function PaymentPageWrapper() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[70vh] items-center justify-center bg-canvas">
          <span className="h-10 w-10 animate-spin rounded-full border-[3px] border-brand-100 border-t-brand-700" />
        </div>
      }
    >
      <RazorpayPaymentPage />
    </Suspense>
  );
}

function RazorpayPaymentPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const orderId = searchParams.get("orderId");
  const razorpayOrderId = searchParams.get("razorpayOrderId");
  const amount = searchParams.get("amount");
  const customerName = searchParams.get("name") || "";
  const customerPhone = searchParams.get("phone") || "";

  const [stage, setStage] = useState<Stage>("loading");
  const [error, setError] = useState<string | null>(null);

  const openRazorpay = useCallback(async () => {
    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded) {
      setError("Failed to load payment gateway. Please try again.");
      setStage("error");
      return;
    }

    setStage("ready");

    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    if (!keyId || !razorpayOrderId || !amount || !orderId) {
      setError("Payment configuration error.");
      setStage("error");
      return;
    }

    const options: RazorpayOptions = {
      key: keyId,
      amount: Number(amount),
      currency: "INR",
      name: "SNR Naturals",
      order_id: razorpayOrderId,
      handler: async (response: RazorpayResponse) => {
        setStage("processing");
        const result = await verifyPayment(
          orderId,
          response.razorpay_order_id,
          response.razorpay_payment_id,
          response.razorpay_signature
        );
        if (result.error) {
          setError(result.error);
          setStage("error");
          return;
        }
        clearCart();
        setStage("success");
        setTimeout(() => {
          startNavProgress();
          router.push(`/checkout/confirmed?token=${result.orderToken}`);
        }, 2000);
      },
      prefill: {
        name: customerName,
        contact: customerPhone,
      },
      theme: {
        color: "#1a620a",
      },
      modal: {
        ondismiss: () => {
          setError("Payment was cancelled. You can retry or return to cart.");
          setStage("error");
        },
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  }, [orderId, razorpayOrderId, amount, customerName, customerPhone, router]);

  useEffect(() => {
    if (!orderId || !razorpayOrderId || !amount) {
      const t = setTimeout(() => {
        setError("Invalid payment session. Please start checkout again.");
        setStage("error");
      }, 0);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => {
      openRazorpay();
    }, 0);
    return () => clearTimeout(t);
  }, [orderId, razorpayOrderId, amount, openRazorpay]);

  const isTest = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID?.startsWith("rzp_test_");
  const rupees = amount ? formatINRExact(Number(amount) / 100) : null;

  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-canvas px-4 py-10 sm:py-16">
      <div className="w-full max-w-md">
        <div className="overflow-hidden rounded-3xl bg-white shadow-xl shadow-black/5 ring-1 ring-black/5">
          {/* Header */}
          <div className="flex items-center justify-between gap-3 bg-ink px-5 py-4 text-white">
            <span className="flex items-center gap-2.5">
              <LogoMark className="h-7 text-white" />
              <span>
                <span className="block text-sm font-semibold leading-tight">SNR Naturals</span>
                <span className="block text-[11px] text-white/60">Step 2 of 2 · Payment</span>
              </span>
            </span>
            {isTest ? (
              <span className="rounded-full bg-honey-500/20 px-2.5 py-1 text-[11px] font-semibold text-honey-100">Test mode</span>
            ) : (
              <span className="flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-medium text-white/80">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Secure payment
              </span>
            )}
          </div>

          {rupees && stage !== "success" && (
            <div className="border-b border-stone-100 px-5 py-4 text-center">
              <p className="text-xs uppercase tracking-wider text-stone-500">Amount to pay</p>
              <p className="mt-0.5 text-3xl font-bold tracking-tight text-ink">{rupees}</p>
            </div>
          )}

          <div className="px-6 py-8">
            {(stage === "loading" || stage === "ready") && (
              <div className="text-center">
                <span className="mx-auto block h-10 w-10 animate-spin rounded-full border-[3px] border-brand-100 border-t-brand-700" />
                <p className="mt-4 font-medium text-ink">Opening secure payment…</p>
                <p className="mt-1 text-sm text-stone-500">Pay with UPI, card or net banking in the Razorpay window.</p>
              </div>
            )}

            {stage === "processing" && (
              <div className="text-center">
                <span className="mx-auto block h-10 w-10 animate-spin rounded-full border-[3px] border-brand-100 border-t-brand-700" />
                <p className="mt-4 font-medium text-ink">Confirming your payment…</p>
                <p className="mt-1 text-sm text-stone-500">Please don&apos;t close or refresh this page.</p>
              </div>
            )}

            {stage === "success" && (
              <div className="text-center">
                <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-50 text-brand-700 ring-8 ring-brand-50/50">
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </span>
                <h2 className="mt-4 text-xl font-bold text-ink">Payment successful</h2>
                <p className="mt-1 text-sm text-stone-500">Taking you to your order…</p>
              </div>
            )}

            {stage === "error" && (
              <div className="text-center">
                <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-600">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                  </svg>
                </span>
                <h2 className="mt-4 text-lg font-bold text-ink">Payment not completed</h2>
                <p className="mt-1 text-sm text-stone-600">{error}</p>
                <p className="mt-2 text-xs text-stone-400">If money was deducted, please contact us with your phone number and we&apos;ll sort it out.</p>
                <div className="mt-6 flex flex-col gap-2.5 sm:flex-row-reverse">
                  <button
                    onClick={() => {
                      setError(null);
                      setStage("loading");
                      openRazorpay();
                    }}
                    className="flex-1 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-800"
                  >
                    Try again
                  </button>
                  <button
                    onClick={() => {
                      startNavProgress();
                      router.push("/cart");
                    }}
                    className="flex-1 rounded-full bg-white px-5 py-3 text-sm font-semibold text-stone-700 ring-1 ring-stone-200 transition hover:bg-stone-50"
                  >
                    Back to cart
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        <p className="mt-4 text-center text-xs text-stone-400">Payments are processed securely by Razorpay.</p>
      </div>
    </div>
  );
}
