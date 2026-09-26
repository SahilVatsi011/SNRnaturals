import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductBySlug } from "@/lib/products";
import { AddToCartButton } from "@/components/store/AddToCartButton";
import { ProductImageGallery } from "@/components/store/ProductImageGallery";

export const dynamic = "force-dynamic";

function price(n: number) {
  return "\u20B9" + Number(n).toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const outOfStock = product.stock_qty <= 0;
  const hasDiscount = product.mrp > product.price;
  const discountPct = hasDiscount
    ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
    : 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-gray-400">
        <Link href="/" className="transition-colors hover:text-brand-600">
          Home
        </Link>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        {product.category && (
          <>
            <Link
              href={`/?category=${encodeURIComponent(product.category)}`}
              className="transition-colors hover:text-brand-600"
            >
              {product.category}
            </Link>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </>
        )}
        <span className="truncate text-gray-500">{product.name}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
        {/* Gallery */}
        <div>
          <ProductImageGallery images={product.images} name={product.name} />
        </div>

        {/* Details */}
        <div className="flex flex-col">
          {/* Category */}
          {product.category && (
            <Link
              href={`/?category=${encodeURIComponent(product.category)}`}
              className="text-xs font-medium text-brand-600 transition-colors hover:text-brand-700"
            >
              {product.category}
            </Link>
          )}

          {/* Title */}
          <h1 className="mt-1 text-xl font-semibold text-gray-900 sm:text-2xl">
            {product.name}
          </h1>

          {/* Price */}
          <div className="mt-3 flex items-center gap-3">
            <span className="text-2xl font-bold text-gray-900">
              {price(product.price)}
            </span>
            {hasDiscount && (
              <>
                <span className="text-base text-gray-400 line-through">
                  {price(product.mrp)}
                </span>
                <span className="text-sm font-medium text-red-600">
                  {discountPct}% off
                </span>
              </>
            )}
          </div>
          {hasDiscount && (
            <p className="mt-1 text-sm text-brand-600">
              You save {price(product.mrp - product.price)}
            </p>
          )}

          {/* Meta info */}
          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-gray-600">
            {product.weight_grams > 0 && (
              <span className="flex items-center gap-1">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="text-gray-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                </svg>
                {product.weight_grams >= 1000
                  ? `${(product.weight_grams / 1000).toFixed(1)} kg`
                  : `${product.weight_grams}g`}
              </span>
            )}
            <span className={`flex items-center gap-1 ${outOfStock ? "text-red-600" : "text-green-700"}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${outOfStock ? "bg-red-500" : "bg-green-500"}`} />
              {outOfStock ? "Out of Stock" : "In Stock"}
            </span>
          </div>

          {/* Description */}
          {product.description && (
            <div className="mt-5">
              <h3 className="mb-1.5 text-sm font-semibold text-gray-900">
                About this product
              </h3>
              <p className="text-sm leading-relaxed text-gray-600">
                {product.description}
              </p>
            </div>
          )}

          {/* Divider */}
          <div className="my-5 border-t border-gray-100" />

          {/* Add to cart */}
          <div>
            {outOfStock ? (
              <button
                disabled
                className="w-full rounded-lg bg-gray-100 px-6 py-3.5 text-base font-medium text-gray-400"
              >
                Out of Stock
              </button>
            ) : (
              <AddToCartButton
                product={{
                  id: product.id,
                  slug: product.slug,
                  name: product.name,
                  price: product.price,
                  weight_grams: product.weight_grams,
                  image: product.images?.[0],
                }}
                size="lg"
                className="w-full py-3.5 text-base"
              />
            )}
          </div>

          {/* Trust badges */}
          <div className="mt-5 space-y-2">
            {[
              { icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z", text: "100% Authentic" },
              { icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4", text: "Secure Packaging" },
              { icon: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z", text: "Safe Payments" },
              { icon: "M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0", text: "Pan-India Delivery" },
            ].map((b) => (
              <div key={b.text} className="flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="shrink-0 text-brand-600">
                  <path strokeLinecap="round" strokeLinejoin="round" d={b.icon} />
                </svg>
                <span className="text-xs text-gray-500">{b.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
