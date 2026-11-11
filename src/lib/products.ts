import { unstable_cache } from "next/cache";
import { getPublicClient } from "@/lib/supabase/public";
import { isSupabaseConfigured } from "@/lib/env";
import { CACHE_TAGS, CATALOGUE_REVALIDATE_SECONDS } from "@/lib/cache-tags";

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  mrp: number;
  price: number;
  weight_grams: number;
  length_cm: number | null;
  width_cm: number | null;
  height_cm: number | null;
  stock_qty: number;
  category: string | null;
  images: string[];
  active: boolean;
}

export const PRODUCT_FIELDS =
  "id,name,slug,description,mrp,price,weight_grams,length_cm,width_cm,height_cm,stock_qty,category,images,active";

/*
 * Catalogue reads are cached with the "products" tag. The cache is refreshed
 * immediately when an admin edits products or a paid order changes stock
 * (revalidateTag), and otherwise every CATALOGUE_REVALIDATE_SECONDS.
 *
 * The fetchers THROW on database errors so a temporary failure is never
 * cached; the exported wrappers catch and fall back to an empty result.
 */

const cacheOptions = {
  revalidate: CATALOGUE_REVALIDATE_SECONDS,
  tags: [CACHE_TAGS.products],
};

const cachedActiveProducts = unstable_cache(
  async (): Promise<Product[]> => {
    const { data, error } = await getPublicClient()
      .from("products")
      .select(PRODUCT_FIELDS)
      .eq("active", true)
      .order("name");
    if (error) throw new Error(error.message);
    return (data ?? []) as Product[];
  },
  ["active-products"],
  cacheOptions
);

const cachedProductBySlug = unstable_cache(
  async (slug: string): Promise<Product | null> => {
    const { data, error } = await getPublicClient()
      .from("products")
      .select(PRODUCT_FIELDS)
      .eq("slug", slug)
      .eq("active", true)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (data ?? null) as Product | null;
  },
  ["product-by-slug"],
  cacheOptions
);

export async function getActiveProducts(): Promise<Product[]> {
  if (!isSupabaseConfigured()) {
    console.error(
      "[products] Supabase is not configured — returning an empty catalogue. Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
    return [];
  }
  try {
    return await cachedActiveProducts();
  } catch (err) {
    console.error("[products] failed to load products:", err);
    return [];
  }
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    return await cachedProductBySlug(slug);
  } catch (err) {
    console.error("[products] failed to load product:", err);
    return null;
  }
}

/** Live (uncached) search — results depend on the query string. */
export async function searchProducts(query: string): Promise<Product[]> {
  if (!isSupabaseConfigured() || !query.trim()) return getActiveProducts();
  try {
    const term = `%${query.trim()}%`;
    const { data } = await getPublicClient()
      .from("products")
      .select(PRODUCT_FIELDS)
      .eq("active", true)
      .or(`name.ilike.${term},description.ilike.${term},category.ilike.${term}`)
      .order("name");
    return (data ?? []) as Product[];
  } catch {
    return [];
  }
}
