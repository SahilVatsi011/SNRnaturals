import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";

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

export async function getActiveProducts(): Promise<Product[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("products")
      .select(PRODUCT_FIELDS)
      .eq("active", true)
      .order("name");
    return (data ?? []) as Product[];
  } catch {
    return [];
  }
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("products")
      .select(PRODUCT_FIELDS)
      .eq("slug", slug)
      .eq("active", true)
      .single();
    return (data ?? null) as Product | null;
  } catch {
    return null;
  }
}

export async function searchProducts(query: string): Promise<Product[]> {
  if (!isSupabaseConfigured() || !query.trim()) return getActiveProducts();
  try {
    const supabase = await createClient();
    const term = `%${query.trim()}%`;
    const { data } = await supabase
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
