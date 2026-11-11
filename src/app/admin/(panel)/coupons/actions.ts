"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/require-admin";

export async function createCoupon(formData: FormData) {
  const supabase = await createClient();
  const auth = await requireAdmin();
  if (!auth.ok) return;

  const name = String(formData.get("name") || "").trim();
  const code = String(formData.get("code") || "").trim().toUpperCase();
  const discountPercent = Number(formData.get("discount_percent")) || 0;
  const active = formData.get("active") === "on";

  if (!name || !code || discountPercent <= 0 || discountPercent > 100) return;

  const { error } = await supabase.from("coupons").insert({
    name,
    code,
    discount_percent: discountPercent,
    active,
  });

  if (error) {
    console.error("create coupon:", error.message);
    return;
  }

  revalidatePath("/admin/coupons");
}

export async function deleteCoupon(formData: FormData) {
  const supabase = await createClient();
  const auth = await requireAdmin();
  if (!auth.ok) return;

  const id = String(formData.get("id") || "");
  const { error } = await supabase.from("coupons").delete().eq("id", id);
  if (error) {
    console.error("delete coupon:", error.message);
    return;
  }

  revalidatePath("/admin/coupons");
}

export async function toggleCouponActive(formData: FormData) {
  const supabase = await createClient();
  const auth = await requireAdmin();
  if (!auth.ok) return;

  const id = String(formData.get("id") || "");
  const active = formData.get("active") === "true";

  const { error } = await supabase
    .from("coupons")
    .update({ active: !active })
    .eq("id", id);

  if (error) {
    console.error("toggle coupon:", error.message);
    return;
  }

  revalidatePath("/admin/coupons");
}
