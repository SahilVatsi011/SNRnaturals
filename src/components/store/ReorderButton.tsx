"use client";

import { useRouter } from "next/navigation";
import { getCart, saveCart, type CartItem } from "@/lib/cart";

interface OrderItem {
  product_id?: string;
  slug?: string;
  name?: string;
  price?: number;
  qty?: number;
  weight_grams?: number;
  image?: string | null;
}

export function ReorderButton({ items }: { items: OrderItem[] }) {
  const router = useRouter();

  function reorder() {
    const cart = getCart();
    const merged = [...cart];

    for (const it of items) {
      const id = it.product_id || it.slug || "";
      if (!id) continue;
      const existing = merged.find((i) => i.product_id === id);
      if (existing) {
        existing.qty += it.qty || 1;
      } else {
        const item: CartItem = {
          product_id: id,
          slug: it.slug || id,
          name: it.name || "Product",
          price: Number(it.price || 0),
          weight_grams: Number(it.weight_grams || 0),
          image: it.image || undefined,
          qty: it.qty || 1,
        };
        merged.push(item);
      }
    }

    saveCart(merged);
    window.dispatchEvent(new Event("snr:cart"));
    router.push("/cart");
  }

  return (
    <button
      type="button"
      onClick={reorder}
      className="rounded-md border border-brand-600 px-3 py-1.5 text-sm font-medium text-brand-700 hover:bg-brand-50"
    >
      Reorder
    </button>
  );
}
