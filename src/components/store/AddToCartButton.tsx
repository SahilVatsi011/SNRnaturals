"use client";

import { useState } from "react";
import { getCart, saveCart, type CartItem } from "@/lib/cart";

export function AddToCartButton({
  product,
  variant = "primary",
  className = "",
  size = "md",
}: {
  product: {
    product_id?: string;
    id?: string;
    slug: string;
    name: string;
    price: number;
    weight_grams?: number;
    image?: string;
  };
  variant?: "primary" | "secondary";
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const [added, setAdded] = useState(false);

  function add(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    const cart = getCart();
    const id = product.product_id || product.id || product.slug;
    const existing = cart.find((i) => i.product_id === id);
    if (existing) {
      existing.qty += 1;
    } else {
      const item: CartItem = {
        product_id: id,
        slug: product.slug,
        name: product.name,
        price: Number(product.price),
        weight_grams: Number(product.weight_grams || 0),
        image: product.image,
        qty: 1,
      };
      cart.push(item);
    }
    saveCart(cart);
    window.dispatchEvent(new Event("snr:cart"));

    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  const sizes = {
    sm: "px-3 py-1.5 text-xs gap-1.5",
    md: "px-4 py-2.5 text-sm gap-2",
    lg: "px-6 py-3 text-base gap-2",
  };

  const base = `inline-flex items-center justify-center font-medium rounded-lg transition-colors duration-200 ${sizes[size]}`;

  const variants = {
    primary: added
      ? "bg-brand-600 text-white"
      : "bg-brand-600 text-white hover:bg-brand-700",
    secondary: added
      ? "bg-brand-50 text-brand-700 border border-brand-200"
      : "bg-white text-gray-700 border border-gray-300 hover:border-gray-400 hover:bg-gray-50",
  };

  return (
    <button
      type="button"
      onClick={add}
      className={`${base} ${variants[variant]} ${className}`}
    >
      {added ? (
        <>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          Added!
        </>
      ) : (
        <>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add to Cart
        </>
      )}
    </button>
  );
}
