"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const VALID_STATUSES = [
  "pending",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
] as const;

type OrderStatus = (typeof VALID_STATUSES)[number];

export async function updateOrderStatus(id: string, formData: FormData) {
  const supabase = await createClient();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return { error: "Unauthorized" };

  const status = String(formData.get("status") || "");
  if (!VALID_STATUSES.includes(status as OrderStatus)) {
    return { error: "Invalid status" };
  }

  const patch: Record<string, unknown> = {
    order_status: status,
    updated_at: new Date().toISOString(),
  };
  if (status === "shipped" && !patch.dispatched_at) {
    patch.dispatched_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from("orders")
    .update(patch)
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${id}`);
}

export async function updateCourier(id: string, formData: FormData) {
  const supabase = await createClient();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return { error: "Unauthorized" };

  const courierName = String(formData.get("courier_name") || "");
  const trackingId = String(formData.get("tracking_id") || "");

  const { error } = await supabase
    .from("orders")
    .update({
      courier_name: courierName,
      tracking_id: trackingId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${id}`);
}
