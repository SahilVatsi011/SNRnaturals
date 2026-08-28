"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function upsertDeliverySlab(formData: FormData) {
  const supabase = await createClient();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return;

  const id = String(formData.get("id") || "");
  const min = Number(formData.get("min_weight_grams")) || 0;
  const maxRaw = String(formData.get("max_weight_grams") || "");
  const max = maxRaw === "" ? null : Number(maxRaw);
  const price = Number(formData.get("price")) || 0;
  const description = String(formData.get("description") || "");
  const active = formData.get("active") === "on";

  const payload = {
    min_weight_grams: min,
    max_weight_grams: max,
    price,
    description,
    active,
  };

  if (id) {
    const { error } = await supabase
      .from("delivery_slabs")
      .update(payload)
      .eq("id", id);
    if (error) {
      console.error("upsert slab:", error.message);
      return;
    }
  } else {
    const { error } = await supabase
      .from("delivery_slabs")
      .insert(payload);
    if (error) {
      console.error("insert slab:", error.message);
      return;
    }
  }

  revalidatePath("/admin/settings");
}

export async function deleteDeliverySlab(formData: FormData) {
  const id = String(formData.get("id") || "");
  const supabase = await createClient();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return;

  const { error } = await supabase.from("delivery_slabs").delete().eq("id", id);
  if (error) {
    console.error("delete slab:", error.message);
    return;
  }

  revalidatePath("/admin/settings");
}

export async function saveFeeConfig(formData: FormData) {
  const supabase = await createClient();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return;

  const razorpayFeeRate = Number(formData.get("razorpayFeeRate")) / 100;
  const smsCostPerOrder = Number(formData.get("smsCostPerOrder")) || 0;

  const { error } = await supabase.from("settings").upsert(
    {
      key: "fees",
      value: { razorpayFeeRate, smsCostPerOrder },
      label: "Price calculation: Razorpay fee + SMS cost",
    },
    { onConflict: "key" }
  );

  if (error) {
    console.error("fees:", error.message);
    return;
  }
  revalidatePath("/admin/settings");
}

export async function saveLowStockThreshold(formData: FormData) {
  const supabase = await createClient();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return;

  const threshold = Number(formData.get("lowStockThreshold")) || 0;

  const { error } = await supabase.from("settings").upsert(
    {
      key: "lowStockThreshold",
      value: threshold,
      label: "Low-stock alert threshold",
    },
    { onConflict: "key" }
  );

  if (error) {
    console.error("low stock:", error.message);
    return;
  }
  revalidatePath("/admin/settings");
  revalidatePath("/admin");
}
