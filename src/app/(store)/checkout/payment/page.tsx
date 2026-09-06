"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { verifyPayment } from "../actions";

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
        <div className="flex min-h-[70vh] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-stone-200 border-t-blue-600" />
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
        setStage("success");
        setTimeout(() => {
          router.push(`/checkout/confirmed?token=${result.orderToken}`);
        }, 2000);
      },
      prefill: {
        name: customerName,
        contact: customerPhone,
      },
      theme: {
        color: "#059669",
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

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        {/* Step indicator */}
        <div className="mb-8 flex items-center gap-3 text-sm font-medium">
          <span className="flex items-center gap-1.5 text-brand-600">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </span>
            Details
          </span>
          <div className="h-px flex-1 bg-brand-200" />
          <span className="flex items-center gap-1.5 text-brand-600">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">2</span>
            Payment
          </span>
          <div className="h-px flex-1 bg-stone-200" />
          <span className="flex items-center gap-1.5 text-stone-400">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-stone-200 text-xs font-bold text-stone-500">3</span>
            Confirmed
          </span>
        </div>

        {/* Payment card */}
        <div className="overflow-hidden rounded-3xl border border-stone-100 bg-white shadow-xl">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
                <span className="text-sm font-bold text-white">Razorpay</span>
              </div>
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-blue-100">
                Test Mode
              </span>
            </div>
          </div>

          {/* Body */}
          <div className="p-6">
            {(stage === "loading" || stage === "ready") && (
              <div className="py-12 text-center">
                <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-stone-200 border-t-blue-600" />
                <p className="mt-4 text-sm text-stone-500">Opening Razorpay payment...</p>
                <p className="mt-1 text-xs text-stone-400">Complete payment in the popup window</p>
              </div>
            )}

            {stage === "processing" && (
              <div className="py-12 text-center">
                <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
                <p className="mt-4 font-medium text-stone-700">Verifying payment...</p>
                <p className="mt-1 text-sm text-stone-400">Please wait, do not close this page</p>
              </div>
            )}

            {stage === "success" && (
              <div className="animate-scale-in py-10 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="animate-bounce-in text-green-600">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="mt-4 text-xl font-bold text-stone-800">Payment Successful!</h2>
                <p className="mt-1 text-sm text-stone-500">Redirecting to your order...</p>
              </div>
            )}

            {stage === "error" && (
              <div className="py-10 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="text-red-600">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h2 className="mt-4 text-xl font-bold text-stone-800">Payment Issue</h2>
                <p className="mt-1 text-sm text-red-600">{error}</p>
                <div className="mt-6 flex gap-3 justify-center">
                  <button
                    onClick={() => {
                      setError(null);
                      setStage("loading");
                      openRazorpay();
                    }}
                    className="rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                  >
                    Retry Payment
                  </button>
                  <button
                    onClick={() => router.push("/cart")}
                    className="rounded-xl bg-stone-100 px-6 py-2.5 text-sm font-semibold text-stone-700 hover:bg-stone-200"
                  >
                    Return to Cart
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
