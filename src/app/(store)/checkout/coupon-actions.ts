"use server";

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";

export async function validateCoupon(
  code: string
): Promise<{ valid: boolean; discount_percent?: number; coupon_code?: string; error?: string }> {
  if (!code || !isSupabaseConfigured()) {
    return { valid: false, error: "Invalid coupon code." };
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("coupons")
    .select("code,discount_percent,active")
    .eq("code", code.trim().toUpperCase())
    .eq("active", true)
    .single();

  if (!data) {
    return { valid: false, error: "Invalid or expired coupon code." };
  }

  return {
    valid: true,
    discount_percent: Number(data.discount_percent),
    coupon_code: data.code,
  };
}
