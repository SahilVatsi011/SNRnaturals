import Link from "next/link";
import { AddToCartButton } from "./AddToCartButton";
import type { Product } from "@/lib/products";

function price(n: number) {
  return "\u20B9" + Number(n).toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

export function ProductCard({ product }: { product: Product }) {
  const outOfStock = product.stock_qty <= 0;
  const image = product.images?.[0];
  const hasDiscount = product.mrp > product.price;
  const discountPct = hasDiscount
    ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
    : 0;

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white transition-shadow hover:shadow-md">
      {/* Image */}
      <Link href={`/products/${product.slug}`} className="relative aspect-square w-full bg-gray-50">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt={product.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gray-50">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={0.8} className="text-gray-300">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
        )}

        {/* Badges */}
        <div className="absolute left-2 top-2 flex flex-col gap-1">
          {hasDiscount && (
            <span className="rounded bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white sm:text-xs">
              {discountPct}% OFF
            </span>
          )}
          {outOfStock && (
            <span className="rounded bg-gray-800 px-1.5 py-0.5 text-[10px] font-semibold text-white sm:text-xs">
              Sold Out
            </span>
          )}
        </div>
      </Link>

      {/* Content */}
      <div className="flex flex-1 flex-col p-3 sm:p-3.5">
        <Link href={`/products/${product.slug}`}>
          <h3 className="line-clamp-2 text-[13px] leading-snug text-gray-800 sm:text-sm">
            {product.name}
          </h3>
        </Link>

        {product.weight_grams > 0 && (
          <span className="mt-0.5 text-[10px] text-gray-400 sm:text-[11px]">
            {product.weight_grams >= 1000
              ? `${(product.weight_grams / 1000).toFixed(product.weight_grams % 1000 === 0 ? 0 : 1)} kg`
              : `${product.weight_grams}g`}
          </span>
        )}

        <div className="mt-auto flex items-baseline gap-1.5 pt-2">
          <span className="text-base font-bold text-gray-900">
            {price(product.price)}
          </span>
          {hasDiscount && (
            <span className="text-[11px] text-gray-400 line-through sm:text-xs">
              {price(product.mrp)}
            </span>
          )}
        </div>

        <div className="mt-2">
          {!outOfStock ? (
            <AddToCartButton
              product={{
                id: product.id,
                slug: product.slug,
                name: product.name,
                price: product.price,
                weight_grams: product.weight_grams,
                image,
              }}
              variant="secondary"
              size="sm"
              className="w-full"
            />
          ) : (
            <button
              disabled
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-400"
            >
              Out of Stock
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
