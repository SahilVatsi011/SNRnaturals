"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/require-admin";
import { slugify } from "@/lib/slug";

interface ProductInput {
  name: string;
  description?: string;
  mrp?: number;
  price: number;
  weight_grams: number;
  length_cm?: number;
  width_cm?: number;
  height_cm?: number;
  stock_qty: number;
  category?: string | null;
  active: boolean;
  images?: string[];
}

export interface ActionResult {
  ok?: boolean;
  error?: string;
}

export interface ProductUsage {
  orderCount: number;
  sampleOrderNos: string[];
}

export async function createProduct(formData: FormData): Promise<ActionResult> {
  const auth = await requireAdmin();
  if (!auth.ok) return { error: auth.error };

  const supabase = await createClient();
  const input = parseProductForm(formData);
  const slug = uniqueSlug(input.name);

  const { error } = await supabase
    .from("products")
    .insert({ ...input, slug });

  if (error) return { error: error.message };

  revalidatePath("/admin/products");
  revalidatePath("/");
  redirect("/admin/products");
}

export async function updateProduct(
  id: string,
  formData: FormData
): Promise<ActionResult> {
  const auth = await requireAdmin();
  if (!auth.ok) return { error: auth.error };

  const supabase = await createClient();

  // Preserve existing slug
  const { data: existing } = await supabase
    .from("products")
    .select("slug")
    .eq("id", id)
    .single();

  const input = parseProductForm(formData);

  const { error } = await supabase
    .from("products")
    .update({ ...input, slug: existing?.slug })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin/products");
  revalidatePath("/");
  redirect("/admin/products");
}

/**
 * Quick toggle used by the products list: hide a product from the storefront
 * (reversible) or bring a hidden one back. The product row is kept, so order
 * history and analytics stay intact.
 */
export async function setProductActive(
  id: string,
  active: boolean
): Promise<ActionResult> {
  const auth = await requireAdmin();
  if (!auth.ok) return { error: auth.error };

  const supabase = await createClient();
  const { error } = await supabase
    .from("products")
    .update({ active })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin/products");
  revalidatePath("/");
  revalidatePath("/admin");
  return { ok: true };
}

/**
 * How many past orders contain this product. Used to warn the admin before a
 * permanent delete — order history itself stores a snapshot of the product
 * inside orders.items, so the orders are never broken by a delete.
 */
export async function getProductUsage(id: string): Promise<ProductUsage> {
  const auth = await requireAdmin();
  if (!auth.ok) return { orderCount: 0, sampleOrderNos: [] };

  const supabase = await createClient();

  const { count } = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .contains("items", JSON.stringify([{ product_id: id }]));

  const { data: recent } = await supabase
    .from("orders")
    .select("order_no")
    .contains("items", JSON.stringify([{ product_id: id }]))
    .order("created_at", { ascending: false })
    .limit(3);

  return {
    orderCount: count ?? 0,
    sampleOrderNos: (recent ?? []).map((o) => String(o.order_no)),
  };
}

/**
 * Permanently delete a product row. The admin has to type the exact product
 * name to confirm. Images are removed from storage on a best-effort basis.
 */
export async function deleteProduct(
  id: string,
  formData: FormData
): Promise<ActionResult> {
  const auth = await requireAdmin();
  if (!auth.ok) return { error: auth.error };

  const supabase = await createClient();

  const { data: product } = await supabase
    .from("products")
    .select("id,name,images")
    .eq("id", id)
    .single();

  if (!product) return { error: "Product not found." };

  const confirmName = String(formData.get("confirmName") ?? "").trim();
  if (confirmName !== product.name) {
    return { error: "Type the exact product name to confirm the delete." };
  }

  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) return { error: error.message };

  await removeProductImages(product.images);

  revalidatePath("/admin/products");
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/analytics");
  return { ok: true };
}

export async function uploadProductImage(
  productId: string | null,
  formData: FormData
): Promise<ActionResult & { url?: string; path?: string }> {
  const auth = await requireAdmin();
  if (!auth.ok) return { error: auth.error };

  const supabase = await createClient();
  const file = formData.get("file") as File | null;
  if (!file) return { error: "No file provided" };

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `products/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("product-images")
    .upload(path, file, { upsert: false, contentType: file.type });

  if (uploadError) return { error: uploadError.message };

  const { data: urlData } = supabase.storage
    .from("product-images")
    .getPublicUrl(path);

  return { url: urlData.publicUrl, path };
}

function parseProductForm(formData: FormData): ProductInput {
  const num = (key: string, fallback = 0) => {
    const v = Number(formData.get(key));
    return Number.isFinite(v) ? v : fallback;
  };

  return {
    name: String(formData.get("name") || "").trim(),
    description: String(formData.get("description") || "").trim(),
    mrp: num("mrp"),
    price: num("price"),
    weight_grams: num("weight_grams"),
    length_cm: num("length_cm"),
    width_cm: num("width_cm"),
    height_cm: num("height_cm"),
    stock_qty: num("stock_qty"),
    category: String(formData.get("category") || "").trim() || null,
    active: formData.get("active") === "on",
    images: parseImages(formData.get("images")),
  };
}

function parseImages(value: FormDataEntryValue | null): string[] {
  if (typeof value !== "string" || !value.trim()) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((u): u is string => typeof u === "string")
      : [];
  } catch {
    return [];
  }
}

/**
 * Images are stored as public URLs pointing at the "product-images" bucket.
 * Extract the object path so the files can be cleaned up on delete.
 */
async function removeProductImages(images: string[] | null) {
  if (!images?.length) return;
  const supabase = await createClient();
  const marker = "/object/public/product-images/";
  const paths = images
    .map((url) => {
      const idx = url.indexOf(marker);
      return idx === -1 ? null : url.slice(idx + marker.length);
    })
    .filter((p): p is string => Boolean(p));

  if (!paths.length) return;
  try {
    await supabase.storage.from("product-images").remove(paths);
  } catch (err) {
    console.error("[products] failed to remove product images:", err);
  }
}

function uniqueSlug(name: string) {
  return `${slugify(name)}-${Date.now().toString(36)}`;
}
