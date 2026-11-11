/**
 * Cache tags for public catalogue data. Call `revalidateTag(...)` with these
 * after anything that changes what shoppers see, so the cached pages refresh
 * immediately instead of waiting for the time-based refresh.
 */
export const CACHE_TAGS = {
  products: "products",
  deliverySlabs: "delivery-slabs",
} as const;

/** Fallback refresh interval (seconds) for cached catalogue data and pages. */
export const CATALOGUE_REVALIDATE_SECONDS = 300;
