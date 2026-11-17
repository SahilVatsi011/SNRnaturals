"use client";

import { startNavProgress } from "@/components/ui/NavProgress";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
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
import { calculateDeliveryFee, cleanPincode } from "@/lib/delivery";
import type { DeliverySlab, DeliveryZone } from "@/lib/delivery";
import { formatINR } from "@/lib/format";
import { LogoMark } from "@/components/Logo";

const STATES = [
  "Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar",
  "Chandigarh", "Chhattisgarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Goa",
  "Gujarat", "Haryana", "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand", "Karnataka",
  "Kerala", "Ladakh", "Lakshadweep", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya",
  "Mizoram", "Nagaland", "Odisha", "Puducherry", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
];

// text-base (16px) on phones stops iOS Safari from zooming in when a field is tapped.
const field =
  "block w-full rounded-xl border border-stone-200 bg-white px-3.5 py-3 text-base text-ink shadow-sm transition placeholder:text-stone-400 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10 sm:text-sm";
const labelCls = "mb-1.5 block text-sm font-medium text-stone-700";

function Icon({ d, size = 18, className = "" }: { d: string; size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d={d} />
    </svg>
  );
}

const ICON = {
  user: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
  pin: "M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z",
  lock: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z",
  back: "M15 18l-6-6 6-6",
  tag: "M7 7h.01M7 3h5a1.99 1.99 0 011.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z",
  chevron: "M6 9l6 6 6-6",
  arrow: "M5 12h14m-6-6l6 6-6 6",
  info: "M12 16v-4m0-4h.01M22 12a10 10 0 11-20 0 10 10 0 0120 0z",
};

function Card({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5 sm:p-6">
      <h2 className="mb-4 flex items-center gap-2.5 text-base font-semibold text-ink">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-50 text-brand-700">
          <Icon d={icon} size={16} />
        </span>
        {title}
      </h2>
      {children}
    </section>
  );
}

/** 10-digit Indian mobile field with a fixed +91 prefix. */
function PhoneField({
  id,
  label,
  value,
  onChange,
  error,
  disabled,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string | null;
  disabled?: boolean;
}) {
  return (
    <div>
      <label htmlFor={id} className={labelCls}>{label}</label>
      <div
        className={`flex overflow-hidden rounded-xl border bg-white shadow-sm transition focus-within:border-brand-500 focus-within:ring-4 focus-within:ring-brand-500/10 ${
          error ? "border-red-400" : "border-stone-200"
        } ${disabled ? "bg-stone-50" : ""}`}
      >
        <span className="flex items-center border-r border-stone-200 bg-stone-50 px-3 text-base text-stone-500 sm:text-sm">+91</span>
        <input
          id={id}
          name={id}
          type="tel"
          inputMode="numeric"
          autoComplete={disabled ? "off" : "tel-national"}
          maxLength={10}
          required
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 10))}
          placeholder="98765 43210"
          className="w-full min-w-0 bg-transparent px-3 py-3 text-base text-ink placeholder:text-stone-400 focus:outline-none disabled:text-stone-500 sm:text-sm"
        />
      </div>
      {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
    </div>
  );
}

export function CheckoutForm({
  slabs,
  zones = [],
  createOrder,
  validateCoupon,
}: {
  slabs: DeliverySlab[];
  zones?: DeliveryZone[];
  createOrder: (
    formData: FormData
  ) => Promise<{ orderToken?: string; orderId?: string; razorpayOrderId?: string; amount?: number; error?: string }>;
  validateCoupon: (
    code: string
  ) => Promise<{ valid: boolean; discount_percent?: number; coupon_code?: string; error?: string }>;
}) {
  const router = useRouter();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [whatsappError, setWhatsappError] = useState<string | null>(null);
  const [phoneValue, setPhoneValue] = useState("");
  const [whatsappValue, setWhatsappValue] = useState("");
  const [whatsappSame, setWhatsappSame] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [pincode, setPincode] = useState("");

  // Coupon state
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; percent: number } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponOpen, setCouponOpen] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => {
      setItems(getCart());
      setLoaded(true);
    }, 0);
    return () => window.clearTimeout(t);
  }, []);

  const subtotal = useMemo(() => cartSubtotal(items), [items]);
  const weight = useMemo(() => cartWeight(items), [items]);
  const count = useMemo(() => cartCount(items), [items]);
  const pinOk = cleanPincode(pincode) !== null;
  const { fee: deliveryFee } = useMemo(
    () => calculateDeliveryFee(weight, slabs, { pincode, zones }),
    [weight, slabs, pincode, zones]
  );
  // With zones, the charge depends on the PIN; until it's entered we show the standard rate as an estimate.
  const deliveryPending = zones.length > 0 && !pinOk;

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

    // Phone number is mandatory and must be a valid Indian mobile number
    const phone = phoneValue.trim();
    if (!phone || !normalizePhone(phone)) {
      setPhoneError("Enter a valid 10-digit mobile number.");
      setSubmitting(false);
      document.getElementById("customer_phone")?.focus();
      return;
    }
    setPhoneError(null);

    // WhatsApp number is mandatory too, auto-filled from phone when "same"
    const whatsapp = whatsappSame ? phone : whatsappValue.trim();
    if (!whatsapp || !normalizePhone(whatsapp)) {
      setWhatsappError("Enter a valid 10-digit WhatsApp number.");
      setSubmitting(false);
      document.getElementById("customer_whatsapp")?.focus();
      return;
    }
    setWhatsappError(null);

    fd.set("customer_phone", phone);
    fd.set("customer_whatsapp", whatsapp);

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
    startNavProgress();
    router.push(`/checkout/payment?${params.toString()}`);
  }

  if (!loaded) {
    return <div className="min-h-[60vh] bg-canvas" aria-busy="true" />;
  }

  if (items.length === 0) {
    return (
      <div className="bg-canvas px-4 py-20 text-center">
        <LogoMark className="mx-auto h-12 text-stone-300" />
        <h1 className="mt-4 text-xl font-bold text-ink">Your cart is empty</h1>
        <p className="mt-1 text-sm text-stone-500">Add some products before checking out.</p>
        <Link href="/" className="mt-5 inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white hover:bg-brand-800">
          Browse products
        </Link>
      </div>
    );
  }

  const payLabel = `Pay ${formatINR(total)}`;

  const itemList = (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.product_id} className="flex items-center gap-3">
          <span className="relative h-14 w-14 shrink-0">
            {item.image ? (
              <Image src={item.image} alt={item.name} fill sizes="56px" className="rounded-xl object-cover ring-1 ring-black/5" />
            ) : (
              <span className="flex h-full w-full items-center justify-center rounded-xl bg-cream-100">
                <LogoMark className="h-6 text-cream-200" />
              </span>
            )}
            <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-ink px-1 text-[11px] font-semibold text-white">
              {item.qty}
            </span>
          </span>
          <p className="min-w-0 flex-1 text-sm font-medium leading-snug text-ink line-clamp-2">{item.name}</p>
          <span className="shrink-0 text-sm font-semibold text-ink">{formatINR(item.price * item.qty)}</span>
        </li>
      ))}
    </ul>
  );

  const totals = (
    <dl className="space-y-2 text-sm">
      <div className="flex justify-between">
        <dt className="text-stone-500">Subtotal · {count} {count === 1 ? "item" : "items"}</dt>
        <dd className="font-medium text-ink">{formatINR(subtotal)}</dd>
      </div>
      {discountAmount > 0 && (
        <div className="flex justify-between text-brand-700">
          <dt>Discount ({appliedCoupon?.percent}% off)</dt>
          <dd className="font-medium">−{formatINR(discountAmount)}</dd>
        </div>
      )}
      <div className="flex justify-between">
        <dt className="text-stone-500">Delivery</dt>
        <dd className="text-right font-medium text-ink">
          {deliveryFee > 0 ? formatINR(deliveryFee) : "Free"}
          {deliveryPending && <span className="block text-[11px] font-normal text-stone-400">Enter PIN code for exact charge</span>}
        </dd>
      </div>
      <div className="flex items-baseline justify-between border-t border-dashed border-stone-200 pt-3">
        <dt className="text-base font-semibold text-ink">Total</dt>
        <dd className="text-lg font-bold text-ink">{formatINR(total)}</dd>
      </div>
    </dl>
  );

  const coupon = appliedCoupon ? (
    <div className="flex items-center justify-between rounded-xl bg-brand-50 px-3.5 py-2.5 ring-1 ring-brand-100">
      <span className="flex items-center gap-2 text-sm text-brand-800">
        <Icon d={ICON.tag} size={15} />
        <span className="font-mono font-bold">{appliedCoupon.code}</span>
        <span>· {appliedCoupon.percent}% off</span>
      </span>
      <button type="button" onClick={handleRemoveCoupon} className="text-xs font-semibold text-red-600 hover:text-red-700">
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
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleApplyCoupon();
            }
          }}
          placeholder="Coupon code"
          autoCapitalize="characters"
          className={`${field} font-mono uppercase`}
        />
        <button
          type="button"
          onClick={handleApplyCoupon}
          disabled={couponLoading || !couponInput.trim()}
          className="shrink-0 rounded-xl bg-ink px-4 text-sm font-semibold text-white transition hover:bg-brand-800 disabled:opacity-40"
        >
          {couponLoading ? "…" : "Apply"}
        </button>
      </div>
      {couponError && <p className="mt-1.5 text-xs text-red-600">{couponError}</p>}
    </div>
  ) : (
    <button
      type="button"
      onClick={() => { setCouponOpen(true); setCouponError(null); }}
      className="flex w-full items-center gap-2 rounded-xl border border-dashed border-stone-300 px-3.5 py-2.5 text-sm font-medium text-stone-600 transition hover:border-brand-400 hover:text-brand-700"
    >
      <Icon d={ICON.tag} size={15} />
      Have a coupon code?
    </button>
  );

  return (
    <div className="bg-canvas pb-28 lg:pb-16">
      <div className="mx-auto max-w-6xl px-4 pt-5 sm:px-6 sm:pt-8 lg:px-8">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link
            href="/cart"
            aria-label="Back to cart"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-ink shadow-sm ring-1 ring-black/5 hover:bg-stone-50"
          >
            <Icon d={ICON.back} />
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-ink sm:text-2xl">Checkout</h1>
            <p className="text-xs text-stone-500 sm:text-sm">Step 1 of 2 · Delivery details</p>
          </div>
        </div>

        {/* Mobile: collapsible order summary */}
        <div className="mt-5 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5 lg:hidden">
          <button
            type="button"
            onClick={() => setSummaryOpen((o) => !o)}
            aria-expanded={summaryOpen}
            className="flex w-full items-center justify-between gap-3 px-4 py-3.5"
          >
            <span className="flex items-center gap-2 text-sm font-medium text-brand-700">
              {summaryOpen ? "Hide" : "Show"} order summary
              <Icon d={ICON.chevron} size={16} className={`transition-transform ${summaryOpen ? "rotate-180" : ""}`} />
            </span>
            <span className="text-base font-bold text-ink">{formatINR(total)}</span>
          </button>
          {summaryOpen && (
            <div className="space-y-4 border-t border-stone-100 px-4 pb-4 pt-4">
              {itemList}
              <div className="border-t border-stone-100 pt-4">{totals}</div>
            </div>
          )}
        </div>

        <form id="checkout-form" onSubmit={handleSubmit} className="mt-5 grid gap-5 lg:mt-8 lg:grid-cols-[1fr_380px] lg:gap-8">
          <div className="space-y-4 sm:space-y-5">
            <Card icon={ICON.user} title="Contact details">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label htmlFor="customer_name" className={labelCls}>Full name</label>
                  <input id="customer_name" name="customer_name" required autoComplete="name" autoCapitalize="words" placeholder="Your name" className={field} />
                </div>
                <PhoneField
                  id="customer_phone"
                  label="Mobile number"
                  value={phoneValue}
                  onChange={(v) => { setPhoneValue(v); setPhoneError(null); }}
                  error={phoneError}
                />
                <div>
                  <PhoneField
                    id="customer_whatsapp"
                    label="WhatsApp number"
                    value={whatsappSame ? phoneValue : whatsappValue}
                    onChange={(v) => { setWhatsappValue(v); setWhatsappError(null); }}
                    error={whatsappError}
                    disabled={whatsappSame}
                  />
                  <label className="mt-2 flex cursor-pointer items-center gap-2 text-sm text-stone-600">
                    <input
                      type="checkbox"
                      checked={whatsappSame}
                      onChange={(e) => { setWhatsappSame(e.target.checked); setWhatsappError(null); }}
                      className="h-4 w-4 rounded border-stone-300 accent-brand-700"
                    />
                    Same as mobile number
                  </label>
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="email" className={labelCls}>
                    Email <span className="font-normal text-stone-400">(optional)</span>
                  </label>
                  <input id="email" name="email" type="email" inputMode="email" autoComplete="email" autoCapitalize="none" placeholder="you@example.com" className={field} />
                </div>
              </div>
              <p className="mt-4 flex items-start gap-2 rounded-xl bg-cream-50 px-3 py-2.5 text-xs leading-relaxed text-stone-600 ring-1 ring-cream-200">
                <Icon d={ICON.info} size={15} className="mt-px shrink-0 text-honey-700" />
                Order updates and tracking are sent on WhatsApp, so please double-check the number.
              </p>
            </Card>

            <Card icon={ICON.pin} title="Delivery address">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label htmlFor="address_line1" className={labelCls}>House no., street, area</label>
                  <input id="address_line1" name="address_line1" required autoComplete="address-line1" placeholder="e.g. 12, Main Bazaar" className={field} />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="address_line2" className={labelCls}>
                    Landmark <span className="font-normal text-stone-400">(optional)</span>
                  </label>
                  <input id="address_line2" name="address_line2" autoComplete="address-line2" placeholder="Near…" className={field} />
                </div>
                <div className="grid grid-cols-2 gap-3 sm:col-span-2 sm:gap-4">
                  <div>
                    <label htmlFor="city" className={labelCls}>City</label>
                    <input id="city" name="city" required autoComplete="address-level2" autoCapitalize="words" className={field} />
                  </div>
                  <div>
                    <label htmlFor="pincode" className={labelCls}>PIN code</label>
                    <input
                      id="pincode"
                      name="pincode"
                      required
                      inputMode="numeric"
                      autoComplete="postal-code"
                      maxLength={6}
                      pattern="[1-9][0-9]{5}"
                      title="6-digit PIN code"
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      className={field}
                    />
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="state" className={labelCls}>State</label>
                  <div className="relative">
                    <select id="state" name="state" required defaultValue="Himachal Pradesh" autoComplete="address-level1" className={`${field} appearance-none pr-10`}>
                      {STATES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    <Icon d={ICON.chevron} size={16} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                  </div>
                </div>
              </div>
            </Card>

            {/* Mobile: coupon + totals + pay */}
            <section className="space-y-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5 lg:hidden">
              {coupon}
              {totals}
              {error && <p className="rounded-xl bg-red-50 px-3.5 py-3 text-sm text-red-700 ring-1 ring-red-100">{error}</p>}
              <PolicyNote />
            </section>
          </div>

          {/* Desktop: sticky summary */}
          <aside className="hidden lg:block">
            <div className="sticky top-24 space-y-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
              <h2 className="text-base font-semibold text-ink">Order summary</h2>
              <div className="no-scrollbar max-h-72 overflow-y-auto pr-1 pt-1.5">{itemList}</div>
              <div className="border-t border-stone-100 pt-4">{coupon}</div>
              {totals}
              {error && <p className="rounded-xl bg-red-50 px-3.5 py-3 text-sm text-red-700 ring-1 ring-red-100">{error}</p>}
              <PayButton submitting={submitting} label={payLabel} />
              <SecureNote />
              <PolicyNote />
            </div>
          </aside>
        </form>
      </div>

      {/* Mobile: pay bar pinned above the bottom tab bar */}
      <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-30 border-t border-stone-200 bg-white/95 px-4 py-3 backdrop-blur-md lg:hidden">
        <div className="mx-auto flex max-w-xl items-center gap-3">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-wider text-stone-500">Total</p>
            <p className="text-lg font-bold leading-tight text-ink">{formatINR(total)}</p>
          </div>
          <PayButton submitting={submitting} label={payLabel} form="checkout-form" className="flex-1" />
        </div>
      </div>
    </div>
  );
}

function PayButton({ submitting, label, form, className = "" }: { submitting: boolean; label: string; form?: string; className?: string }) {
  return (
    <button
      type="submit"
      form={form}
      disabled={submitting}
      className={`flex w-full items-center justify-center gap-2 rounded-full bg-ink px-6 py-3.5 text-[15px] font-semibold text-white shadow-sm transition hover:bg-brand-800 active:bg-brand-900 disabled:cursor-wait disabled:opacity-70 ${className}`}
    >
      {submitting ? (
        <>
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent" aria-hidden />
          Please wait…
        </>
      ) : (
        <>
          <Icon d={ICON.lock} size={16} />
          {label}
        </>
      )}
    </button>
  );
}

function SecureNote() {
  return (
    <p className="flex items-center justify-center gap-1.5 text-xs text-stone-500">
      <Icon d={ICON.lock} size={13} />
      Secure payment by Razorpay · UPI, cards, net banking
    </p>
  );
}

function PolicyNote() {
  return (
    <p className="text-center text-[11px] leading-relaxed text-stone-400">
      By placing this order you agree to our{" "}
      <a href="/terms" target="_blank" className="underline underline-offset-2 hover:text-stone-600">Terms</a>,{" "}
      <a href="/refund-policy" target="_blank" className="underline underline-offset-2 hover:text-stone-600">Refund</a> and{" "}
      <a href="/shipping-policy" target="_blank" className="underline underline-offset-2 hover:text-stone-600">Shipping</a> policies.
    </p>
  );
}
