"use client";

/**
 * Guest cart backed by localStorage. No login required.
 */
export interface CartItem {
  product_id: string;
  slug: string;
  name: string;
  price: number;
  weight_grams: number;
  image?: string;
  qty: number;
}

const KEY = "snr_cart";

export function getCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
}

export function saveCart(items: CartItem[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(items));
}

export function cartCount(items: CartItem[]) {
  return items.reduce((s, i) => s + i.qty, 0);
}

export function cartSubtotal(items: CartItem[]) {
  return items.reduce((s, i) => s + i.price * i.qty, 0);
}

export function cartWeight(items: CartItem[]) {
  return items.reduce((s, i) => s + i.weight_grams * i.qty, 0);
}
