import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import type { DeliverySlab } from "@/lib/delivery";

export async function getActiveDeliverySlabs(): Promise<DeliverySlab[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("delivery_slabs")
      .select("id,min_weight_grams,max_weight_grams,price,active")
      .eq("active", true)
      .order("min_weight_grams");
    return (data ?? []) as DeliverySlab[];
  } catch {
    return [];
  }
}
