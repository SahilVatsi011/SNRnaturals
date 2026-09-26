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
import { normalizePhone } from "@/lib/phone";
import { calculateDeliveryFee } from "@/lib/delivery";
import type { DeliverySlab } from "@/lib/delivery";

function price(n: number) {
  return "\u20B9" + Number(n).toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

const inputClass = "w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm transition-all focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500";

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
  const [phoneError, setPhoneError] = useState<string | null>(null);
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

    // WhatsApp number is mandatory and must be a valid Indian mobile number
    const customerPhone = String(fd.get("customer_phone") || "").trim();
    if (!customerPhone || !normalizePhone(customerPhone)) {
      setPhoneError("Enter a valid 10-digit WhatsApp number (e.g. 9876543210).");
      setSubmitting(false);
      return;
    }
    setPhoneError(null);

    const result = await createOrder(fd);
    if (result.error) {
      setError(result.error);
      setSubmitting(false);
      return;
    }

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
        <div className="mx-auto w-fit rounded-full bg-gray-100 p-5">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.2} className="text-gray-400">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
        </div>
        <h1 className="mt-4 text-xl font-bold text-gray-800">Your cart is empty</h1>
        <p className="mt-1 text-sm text-gray-500">Add some products before checking out.</p>
        <Link href="/" className="mt-4 inline-flex items-center gap-2 rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700">
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10 lg:px-8">
      {/* Header */}
      <div className="mb-6">
        <Link href="/cart" className="mb-2 inline-flex items-center gap-1.5 text-sm font-medium text-gray-400 hover:text-brand-600">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 16l-4-4m0 0l4-4m-4 4h18" />
          </svg>
          Back to cart
        </Link>
        <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">Checkout</h1>
        <p className="mt-0.5 text-sm text-gray-400">{count} items &bull; {price(total)} total</p>
      </div>

      {/* Checkout steps indicator */}
      <div className="mb-6 flex items-center gap-3 text-sm font-medium">
        <span className="flex items-center gap-1.5 text-brand-600">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">1</span>
          Details
        </span>
        <div className="h-px flex-1 bg-gray-200" />
        <span className="flex items-center gap-1.5 text-gray-400">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-xs font-bold text-gray-500">2</span>
          Payment
        </span>
        <div className="h-px flex-1 bg-gray-200" />
        <span className="flex items-center gap-1.5 text-gray-400">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-xs font-bold text-gray-500">3</span>
          Confirmed
        </span>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-3">
        {/* Address form */}
        <div className="space-y-5 lg:col-span-2">
          <div className="rounded-lg border border-gray-200 bg-white p-5">
            <h2 className="mb-4 text-base font-bold text-gray-800">Your Details</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="customer_name" className="mb-1 block text-sm font-medium text-gray-700">Full Name *</label>
                <input id="customer_name" name="customer_name" required autoComplete="name" className={inputClass} />
              </div>
              <div>
                <label htmlFor="customer_phone" className="mb-1 block text-sm font-medium text-gray-700">WhatsApp Number *</label>
                <input
                  id="customer_phone"
                  name="customer_phone"
                  required
                  type="tel"
                  autoComplete="tel"
                  inputMode="tel"
                  maxLength={15}
                  placeholder="10-digit mobile e.g. 9876543210"
                  className={`${inputClass} ${phoneError ? "border-red-400" : ""}`}
                  onChange={() => setPhoneError(null)}
                />
                {phoneError && (
                  <p className="mt-1 text-xs text-red-600">{phoneError}</p>
                )}
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">Email <span className="text-gray-400">(optional)</span></label>
                <input id="email" name="email" type="email" autoComplete="email" className={inputClass} />
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-5">
            <h2 className="mb-4 text-base font-bold text-gray-800">Delivery Address</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="address_line1" className="mb-1 block text-sm font-medium text-gray-700">Address Line 1 *</label>
                <input id="address_line1" name="address_line1" required autoComplete="address-line1" placeholder="House no, street, area" className={inputClass} />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="address_line2" className="mb-1 block text-sm font-medium text-gray-700">Address Line 2 <span className="text-gray-400">(optional)</span></label>
                <input id="address_line2" name="address_line2" autoComplete="address-line2" className={inputClass} />
              </div>
              <div>
                <label htmlFor="city" className="mb-1 block text-sm font-medium text-gray-700">City *</label>
                <input id="city" name="city" required autoComplete="address-level2" className={inputClass} />
              </div>
              <div>
                <label htmlFor="state" className="mb-1 block text-sm font-medium text-gray-700">State *</label>
                <input id="state" name="state" required defaultValue="Himachal Pradesh" className={inputClass} />
              </div>
              <div>
                <label htmlFor="pincode" className="mb-1 block text-sm font-medium text-gray-700">PIN Code *</label>
                <input id="pincode" name="pincode" required inputMode="numeric" autoComplete="postal-code" className={inputClass} />
              </div>
            </div>
          </div>
        </div>

        {/* Order summary */}
        <div>
          <div className="sticky top-24 space-y-4">
            <div className="rounded-lg border border-gray-200 bg-white p-5">
              <h2 className="mb-3 text-base font-bold text-gray-800">Order Summary</h2>

              {/* Item list */}
              <div className="mb-3 max-h-48 space-y-2 overflow-y-auto no-scrollbar">
                {items.map((item) => (
                  <div key={item.product_id} className="flex items-center gap-3 text-sm">
                    {item.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.image} alt={item.name} className="h-10 w-10 rounded object-cover" />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded bg-gray-100">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1} className="text-gray-300">
                          <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-700">{item.name}</p>
                      <p className="text-xs text-gray-400">Qty: {item.qty}</p>
                    </div>
                    <span className="shrink-0 text-sm font-medium text-gray-700">{price(item.price * item.qty)}</span>
                  </div>
                ))}
              </div>

              {/* Coupon code */}
              <div className="mb-3 border-t border-gray-100 pt-3">
                {appliedCoupon ? (
                  <div className="flex items-center justify-between rounded-lg bg-green-50 px-3 py-2">
                    <div>
                      <span className="font-mono text-sm font-bold text-green-700">{appliedCoupon.code}</span>
                      <span className="ml-2 text-sm text-green-600">({appliedCoupon.percent}% off)</span>
                    </div>
                    <button type="button" onClick={handleRemoveCoupon} className="text-xs font-medium text-red-500 hover:text-red-700">
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
                        className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 font-mono text-sm uppercase focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                      />
                      <button
                        type="button"
                        onClick={handleApplyCoupon}
                        disabled={couponLoading || !couponInput.trim()}
                        className="shrink-0 rounded-lg bg-gray-800 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-700 disabled:opacity-50"
                      >
                        {couponLoading ? "..." : "Apply"}
                      </button>
                    </div>
                    {couponError && <p className="mt-1.5 text-xs text-red-500">{couponError}</p>}
                    <button type="button" onClick={() => setCouponOpen(false)} className="mt-1.5 text-xs text-gray-400 hover:text-gray-600">
                      Skip coupon
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => { setCouponOpen(true); setCouponError(null); }}
                    className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-gray-300 px-3 py-2 text-xs font-medium text-gray-400 transition-colors hover:border-brand-300 hover:text-brand-600"
                  >
                    Have a coupon code? (optional)
                  </button>
                )}
              </div>

              <div className="space-y-2 border-t border-gray-100 pt-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Subtotal ({count} items)</span>
                  <span className="font-medium">{price(subtotal)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount ({appliedCoupon?.percent}% off)</span>
                    <span className="font-medium">-{price(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">Delivery</span>
                  <span className="font-medium">{deliveryFee > 0 ? price(deliveryFee) : "Free"}</span>
                </div>
              </div>

              <div className="my-3 border-t border-dashed border-gray-200" />

              <div className="flex justify-between text-base">
                <span className="font-bold">Total</span>
                <span className="font-bold text-brand-700">{price(total)}</span>
              </div>
            </div>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Processing...
                </>
              ) : (
                <>
                  Proceed to Payment
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-1.5 text-xs text-gray-400">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
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
