"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  getCart,
  saveCart,
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

export function CartView({ slabs }: { slabs: DeliverySlab[] }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    const t = window.setTimeout(() => setItems(getCart()), 0);
    return () => window.clearTimeout(t);
  }, []);

  const update = (next: CartItem[]) => {
    setItems(next);
    saveCart(next);
    window.dispatchEvent(new Event("snr:cart"));
  };

  const changeQty = (id: string, delta: number) => {
    update(
      items
        .map((i) => (i.product_id === id ? { ...i, qty: i.qty + delta } : i))
        .filter((i) => i.qty > 0)
    );
  };

  const remove = (id: string) => {
    update(items.filter((i) => i.product_id !== id));
  };

  const subtotal = useMemo(() => cartSubtotal(items), [items]);
  const weight = useMemo(() => cartWeight(items), [items]);
  const count = useMemo(() => cartCount(items), [items]);
  const { fee: deliveryFee } = useMemo(
    () => calculateDeliveryFee(weight, slabs),
    [weight, slabs]
  );
  const total = subtotal + deliveryFee;

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center sm:px-6 lg:px-8">
        <div className="mx-auto w-fit rounded-full bg-stone-100 p-6">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.2} className="text-stone-400">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
        </div>
        <h1 className="mt-5 font-display text-2xl font-bold text-stone-800">
          Your cart is empty
        </h1>
        <p className="mt-2 text-stone-500">
          Looks like you haven&apos;t added anything yet.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3 font-semibold text-white shadow-md shadow-brand-600/20 transition-all hover:-translate-y-0.5 hover:bg-brand-700 hover:shadow-lg"
        >
          Start Shopping
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-stone-800 sm:text-3xl">
            Shopping Cart
          </h1>
          <p className="mt-1 text-sm text-stone-400">
            {count} {count === 1 ? "item" : "items"} in your cart
          </p>
        </div>
        <Link
          href="/"
          className="hidden items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-700 sm:flex"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 16l-4-4m0 0l4-4m-4 4h18" />
          </svg>
          Continue Shopping
        </Link>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Cart items */}
        <div className="space-y-3 lg:col-span-2">
          {items.map((item, i) => (
            <div
              key={item.product_id}
              className="animate-fade-in flex gap-4 rounded-2xl border border-stone-100 bg-white p-4 shadow-sm transition-all hover:shadow-md sm:p-5"
              style={{ animationDelay: `${i * 60}ms`, opacity: 0 }}
            >
              {/* Image */}
              {item.image ? (
                <Link href={`/products/${item.slug}`} className="img-zoom shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.image}
                    alt={item.name}
                    className="h-24 w-24 rounded-xl object-cover sm:h-28 sm:w-28"
                  />
                </Link>
              ) : (
                <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-xl bg-stone-50 sm:h-28 sm:w-28">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1} className="text-stone-300">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
              )}

              {/* Info */}
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-start justify-between gap-3">
                  <Link
                    href={`/products/${item.slug}`}
                    className="line-clamp-2 font-semibold text-stone-800 transition-colors hover:text-brand-700"
                  >
                    {item.name}
                  </Link>
                  <button
                    onClick={() => remove(item.product_id)}
                    className="shrink-0 rounded-lg p-1.5 text-stone-300 transition-colors hover:bg-red-50 hover:text-red-500"
                    aria-label="Remove item"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>

                <div className="mt-1 text-sm text-stone-400">
                  {price(item.price)} each
                  {item.weight_grams > 0 && (
                    <span className="ml-2">
                      &middot; {item.weight_grams >= 1000 ? `${(item.weight_grams / 1000).toFixed(1)} kg` : `${item.weight_grams}g`}
                    </span>
                  )}
                </div>

                <div className="mt-auto flex items-center justify-between pt-3">
                  {/* Quantity controls */}
                  <div className="flex items-center overflow-hidden rounded-xl border border-stone-200">
                    <button
                      onClick={() => changeQty(item.product_id, -1)}
                      className="flex h-9 w-9 items-center justify-center text-stone-500 transition-colors hover:bg-stone-50 active:bg-stone-100"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" d="M5 12h14" />
                      </svg>
                    </button>
                    <span className="flex h-9 w-10 items-center justify-center border-x border-stone-200 text-sm font-semibold text-stone-800">
                      {item.qty}
                    </span>
                    <button
                      onClick={() => changeQty(item.product_id, 1)}
                      className="flex h-9 w-9 items-center justify-center text-stone-500 transition-colors hover:bg-stone-50 active:bg-stone-100"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" d="M12 5v14m7-7H5" />
                      </svg>
                    </button>
                  </div>

                  {/* Item total */}
                  <span className="text-lg font-bold text-stone-800">
                    {price(item.price * item.qty)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div>
          <div className="sticky top-28 rounded-2xl border border-stone-100 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-stone-800">Order Summary</h2>

            <div className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-stone-500">Subtotal ({count} items)</span>
                <span className="font-medium text-stone-700">{price(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Delivery</span>
                <span className="font-medium text-stone-700">
                  {deliveryFee > 0 ? price(deliveryFee) : "Free"}
                </span>
              </div>
              <div className="flex justify-between text-xs text-stone-400">
                <span>Total weight</span>
                <span>
                  {weight >= 1000
                    ? `${(weight / 1000).toFixed(1)} kg`
                    : `${weight} g`}
                </span>
              </div>
            </div>

            <div className="my-4 border-t border-dashed border-stone-200" />

            <div className="flex justify-between text-lg">
              <span className="font-bold text-stone-800">Total</span>
              <span className="font-bold text-brand-700">{price(total)}</span>
            </div>

            <Link
              href="/checkout"
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-6 py-3.5 font-semibold text-white shadow-md shadow-brand-600/20 transition-all hover:-translate-y-0.5 hover:bg-brand-700 hover:shadow-lg"
            >
              Proceed to Checkout
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>

            {/* Trust */}
            <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-stone-400">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Secure checkout &middot; UPI, Cards, Netbanking
            </div>

            <Link
              href="/"
              className="mt-3 block text-center text-sm font-medium text-stone-400 transition-colors hover:text-brand-600"
            >
              Continue shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
