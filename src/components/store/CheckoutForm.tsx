"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  getCart,
  cartSubtotal,
  cartWeight,
  cartCount,
  type CartItem,
} from "@/lib/cart";
import { calculateDeliveryFee } from "@/lib/delivery";
import type { DeliverySlab } from "@/lib/delivery";

function price(n: number) {
  return "\u20B9" + Number(n).toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

export function CheckoutForm({
  slabs,
  createOrder,
  validateCoupon,
}: {
  slabs: DeliverySlab[];
  createOrder: (
    formData: FormData
  ) => Promise<{ orderToken?: string; orderId?: string; razorpayOrderId?: string; amount?: number; error?: string }>;
  validateCoupon: (
    code: string
  ) => Promise<{ valid: boolean; discount_percent?: number; coupon_code?: string; error?: string }>;
}) {
  const router = useRouter();
  const [items, setItems] = useState<CartItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Coupon state
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; percent: number } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponOpen, setCouponOpen] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setItems(getCart()), 0);
    return () => window.clearTimeout(t);
  }, []);

  const subtotal = useMemo(() => cartSubtotal(items), [items]);
  const weight = useMemo(() => cartWeight(items), [items]);
  const count = useMemo(() => cartCount(items), [items]);
  const { fee: deliveryFee } = useMemo(
    () => calculateDeliveryFee(weight, slabs),
    [weight, slabs]
  );

  const discountAmount = appliedCoupon
    ? Math.round((subtotal * appliedCoupon.percent) / 100)
    : 0;
  const total = subtotal - discountAmount + deliveryFee;

  async function handleApplyCoupon() {
    const code = couponInput.trim().toUpperCase();
    if (!code) return;
    setCouponLoading(true);
    setCouponError(null);
    const result = await validateCoupon(code);
    setCouponLoading(false);
    if (result.valid && result.discount_percent && result.coupon_code) {
      setAppliedCoupon({ code: result.coupon_code, percent: result.discount_percent });
      setCouponError(null);
    } else {
      setCouponError(result.error || "Invalid coupon code.");
      setAppliedCoupon(null);
    }
  }

  function handleRemoveCoupon() {
    setAppliedCoupon(null);
    setCouponInput("");
    setCouponError(null);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const fd = new FormData(e.currentTarget);
    fd.set("cart", JSON.stringify(items));
    if (appliedCoupon) {
      fd.set("coupon_code", appliedCoupon.code);
    }

    const result = await createOrder(fd);
    if (result.error) {
      setError(result.error);
      setSubmitting(false);
      return;
    }

    // Redirect to payment page with Razorpay order details.
    // The cart is NOT cleared here — if the customer cancels
    // payment it must survive. It is cleared only after the
    // payment is verified successfully on the payment page.
    const params = new URLSearchParams({
      orderId: result.orderId!,
      razorpayOrderId: result.razorpayOrderId!,
      amount: String(result.amount),
    });
    router.push(`/checkout/payment?${params.toString()}`);
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-5 py-20 text-center sm:px-8 lg:px-8">
        <div className="mx-auto w-fit rounded-full bg-stone-100 p-6">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.2} className="text-stone-400">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
        </div>
        <h1 className="mt-5 font-display text-2xl font-bold text-stone-800">Your cart is empty</h1>
        <p className="mt-2 text-stone-500">Add some products before checking out.</p>
        <Link href="/" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3 font-semibold text-white shadow-md shadow-brand-600/20 hover:bg-brand-700">
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <Link href="/cart" className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-stone-400 hover:text-brand-600">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 16l-4-4m0 0l4-4m-4 4h18" />
          </svg>
          Back to cart
        </Link>
        <h1 className="font-display text-2xl font-bold text-stone-800 sm:text-3xl">Checkout</h1>
        <p className="mt-1 text-sm text-stone-400">{count} items &bull; {price(total)} total</p>
      </div>

      {/* Checkout steps indicator */}
      <div className="mb-8 flex items-center gap-3 text-sm font-medium">
        <span className="flex items-center gap-1.5 text-brand-600">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">1</span>
          Details
        </span>
        <div className="h-px flex-1 bg-stone-200" />
        <span className="flex items-center gap-1.5 text-stone-400">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-stone-200 text-xs font-bold text-stone-500">2</span>
          Payment
        </span>
        <div className="h-px flex-1 bg-stone-200" />
        <span className="flex items-center gap-1.5 text-stone-400">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-stone-200 text-xs font-bold text-stone-500">3</span>
          Confirmed
        </span>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-3">
        {/* Address form */}
        <div className="space-y-5 lg:col-span-2">
          <div className="rounded-2xl border border-stone-100 bg-white p-6 shadow-sm">
            <h2 className="mb-5 flex items-center gap-2 text-lg font-bold text-stone-800">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="text-brand-600">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Your Details
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="customer_name" className="mb-1 block text-sm font-medium text-stone-700">Full Name *</label>
                <input id="customer_name" name="customer_name" required autoComplete="name"
                  className="w-full rounded-xl border border-stone-200 bg-stone-50/50 px-4 py-3 text-sm transition-all focus:border-brand-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-500/10" />
              </div>
              <div>
                <label htmlFor="customer_phone" className="mb-1 block text-sm font-medium text-stone-700">Phone Number *</label>
                <input id="customer_phone" name="customer_phone" required type="tel" autoComplete="tel" placeholder="10-digit mobile"
                  className="w-full rounded-xl border border-stone-200 bg-stone-50/50 px-4 py-3 text-sm transition-all focus:border-brand-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-500/10" />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="email" className="mb-1 block text-sm font-medium text-stone-700">Email <span className="text-stone-400">(optional)</span></label>
                <input id="email" name="email" type="email" autoComplete="email"
                  className="w-full rounded-xl border border-stone-200 bg-stone-50/50 px-4 py-3 text-sm transition-all focus:border-brand-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-500/10" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-stone-100 bg-white p-6 shadow-sm">
            <h2 className="mb-5 flex items-center gap-2 text-lg font-bold text-stone-800">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="text-brand-600">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Delivery Address
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="address_line1" className="mb-1 block text-sm font-medium text-stone-700">Address Line 1 *</label>
                <input id="address_line1" name="address_line1" required autoComplete="address-line1" placeholder="House no, street, area"
                  className="w-full rounded-xl border border-stone-200 bg-stone-50/50 px-4 py-3 text-sm transition-all focus:border-brand-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-500/10" />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="address_line2" className="mb-1 block text-sm font-medium text-stone-700">Address Line 2 <span className="text-stone-400">(optional)</span></label>
                <input id="address_line2" name="address_line2" autoComplete="address-line2"
                  className="w-full rounded-xl border border-stone-200 bg-stone-50/50 px-4 py-3 text-sm transition-all focus:border-brand-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-500/10" />
              </div>
              <div>
                <label htmlFor="city" className="mb-1 block text-sm font-medium text-stone-700">City *</label>
                <input id="city" name="city" required autoComplete="address-level2"
                  className="w-full rounded-xl border border-stone-200 bg-stone-50/50 px-4 py-3 text-sm transition-all focus:border-brand-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-500/10" />
              </div>
              <div>
                <label htmlFor="state" className="mb-1 block text-sm font-medium text-stone-700">State *</label>
                <input id="state" name="state" required defaultValue="Himachal Pradesh"
                  className="w-full rounded-xl border border-stone-200 bg-stone-50/50 px-4 py-3 text-sm transition-all focus:border-brand-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-500/10" />
              </div>
              <div>
                <label htmlFor="pincode" className="mb-1 block text-sm font-medium text-stone-700">PIN Code *</label>
                <input id="pincode" name="pincode" required inputMode="numeric" autoComplete="postal-code"
                  className="w-full rounded-xl border border-stone-200 bg-stone-50/50 px-4 py-3 text-sm transition-all focus:border-brand-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-500/10" />
              </div>
            </div>
          </div>
        </div>

        {/* Order summary */}
        <div>
          <div className="sticky top-28 space-y-4">
            <div className="rounded-2xl border border-stone-100 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-bold text-stone-800">Order Summary</h2>

              {/* Item list */}
              <div className="mb-4 max-h-48 space-y-2 overflow-y-auto no-scrollbar">
                {items.map((item) => (
                  <div key={item.product_id} className="flex items-center gap-3 text-sm">
                    {item.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.image} alt={item.name} className="h-10 w-10 rounded-lg object-cover" />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-stone-100">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1} className="text-stone-300">
                          <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-stone-700">{item.name}</p>
                      <p className="text-xs text-stone-400">Qty: {item.qty}</p>
                    </div>
                    <span className="shrink-0 font-medium text-stone-700">{price(item.price * item.qty)}</span>
                  </div>
                ))}
              </div>

              {/* Coupon code (optional) */}
              <div className="mb-3 border-t border-stone-100 pt-3">
                {appliedCoupon ? (
                  <div className="flex items-center justify-between rounded-xl bg-green-50 px-3 py-2">
                    <div>
                      <span className="font-mono text-sm font-bold text-green-700">{appliedCoupon.code}</span>
                      <span className="ml-2 text-sm text-green-600">({appliedCoupon.percent}% off)</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      className="text-xs font-medium text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                ) : couponOpen ? (
                  <div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                        placeholder="Coupon code"
                        className="flex-1 rounded-xl border border-stone-200 bg-stone-50/50 px-3 py-2 font-mono text-sm uppercase transition-all focus:border-brand-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-500/10"
                      />
                      <button
                        type="button"
                        onClick={handleApplyCoupon}
                        disabled={couponLoading || !couponInput.trim()}
                        className="shrink-0 rounded-xl bg-stone-800 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-stone-700 disabled:opacity-50"
                      >
                        {couponLoading ? "..." : "Apply"}
                      </button>
                    </div>
                    {couponError && (
                      <p className="mt-1.5 text-xs text-red-500">{couponError}</p>
                    )}
                    <button
                      type="button"
                      onClick={() => setCouponOpen(false)}
                      className="mt-1.5 text-xs text-stone-400 hover:text-stone-600"
                    >
                      Skip coupon
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setCouponOpen(true);
                      setCouponError(null);
                    }}
                    className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-stone-200 px-3 py-2 text-xs font-medium text-stone-400 transition-colors hover:border-brand-200 hover:text-brand-600"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                    Have a coupon code? (optional)
                  </button>
                )}
              </div>

              <div className="space-y-2 border-t border-stone-100 pt-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-stone-500">Subtotal ({count} items)</span>
                  <span className="font-medium">{price(subtotal)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount ({appliedCoupon?.percent}% off)</span>
                    <span className="font-medium">-{price(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-stone-500">Delivery</span>
                  <span className="font-medium">{deliveryFee > 0 ? price(deliveryFee) : "Free"}</span>
                </div>
              </div>

              <div className="my-3 border-t border-dashed border-stone-200" />

              <div className="flex justify-between text-lg">
                <span className="font-bold">Total</span>
                <span className="font-bold text-brand-700">{price(total)}</span>
              </div>
            </div>

            {error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-600 px-6 py-4 text-base font-semibold text-white shadow-lg shadow-brand-600/20 transition-all hover:-translate-y-0.5 hover:bg-brand-700 hover:shadow-xl disabled:translate-y-0 disabled:opacity-60 disabled:shadow-none"
            >
              {submitting ? (
                <>
                  <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Processing...
                </>
              ) : (
                <>
                  Proceed to Payment
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-1.5 text-xs text-stone-400">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Your information is secure
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
