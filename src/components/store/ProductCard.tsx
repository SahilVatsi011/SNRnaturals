import Link from "next/link";
import { AddToCartButton } from "./AddToCartButton";
import type { Product } from "@/lib/products";
import { LogoMark } from "@/components/Logo";
import { formatINR } from "@/lib/format";

export function ProductCard({ product }: { product: Product }) {
  const outOfStock = product.stock_qty <= 0;
  const image = product.images?.[0];
  const hasDiscount = product.mrp > product.price;
  const discountPct = hasDiscount
    ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
    : 0;

  return (
    <div className="group relative flex flex-col">
      {/* Image */}
      <Link href={`/products/${product.slug}`} className="relative aspect-square w-full overflow-hidden rounded-2xl bg-cream-100">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gray-50">
            <LogoMark className="h-14 text-gray-200" />
          </div>
        )}

        {/* Badges */}
        <div className="absolute left-2 top-2 flex flex-col gap-1">
          {hasDiscount && (
            <span className="rounded-full bg-honey-500 px-2 py-0.5 text-[10px] font-semibold text-white shadow-sm sm:text-xs">
              {discountPct}% OFF
            </span>
          )}
          {outOfStock && (
            <span className="rounded-full bg-gray-900/80 px-2 py-0.5 text-[10px] font-semibold text-white sm:text-xs">
              Sold Out
            </span>
          )}
        </div>
      </Link>

      {/* Content */}
      <div className="flex flex-1 flex-col pt-3">
        <Link href={`/products/${product.slug}`}>
          <h3 className="line-clamp-2 text-sm font-medium leading-snug text-gray-900 hover:text-gray-600">
            {product.name}
          </h3>
        </Link>

        {product.weight_grams > 0 && (
          <span className="mt-0.5 text-xs text-gray-500">
            {product.weight_grams >= 1000
              ? `${(product.weight_grams / 1000).toFixed(product.weight_grams % 1000 === 0 ? 0 : 1)} kg`
              : `${product.weight_grams}g`}
          </span>
        )}

        <div className="mt-auto flex items-baseline gap-1.5 pt-1.5">
          <span className="text-base font-bold text-ink">
            {formatINR(product.price)}
          </span>
          {hasDiscount && (
            <span className="text-[11px] text-gray-400 line-through sm:text-xs">
              {formatINR(product.mrp)}
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
              className="w-full rounded-full border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-medium text-gray-400"
            >
              Out of Stock
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
