"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
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

export async function createProduct(formData: FormData) {
  const supabase = await createClient();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return { error: "Unauthorized" };

  const input = parseProductForm(formData);
  const slug = uniqueSlug(input.name);

  const { error } = await supabase
    .from("products")
    .insert({ ...input, slug });

  if (error) return { error: error.message };

  revalidatePath("/admin/products");
  redirect("/admin/products");
}

export async function updateProduct(id: string, formData: FormData) {
  const supabase = await createClient();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return { error: "Unauthorized" };

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
  redirect("/admin/products");
}

export async function deleteProduct(id: string) {
  const supabase = await createClient();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return { error: "Unauthorized" };

  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin/products");
}

export async function uploadProductImage(
  productId: string | null,
  formData: FormData
) {
  const supabase = await createClient();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return { error: "Unauthorized" };

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
    images: JSON.parse(String(formData.get("images") || "[]")),
  };
}

function uniqueSlug(name: string) {
  return `${slugify(name)}-${Date.now().toString(36)}`;
}
