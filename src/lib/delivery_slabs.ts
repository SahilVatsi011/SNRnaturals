import { unstable_cache } from "next/cache";
import { getPublicClient } from "@/lib/supabase/public";
import { isSupabaseConfigured } from "@/lib/env";
import { CACHE_TAGS, CATALOGUE_REVALIDATE_SECONDS } from "@/lib/cache-tags";
import type { DeliverySlab } from "@/lib/delivery";

// Throws on DB errors so a failed read is never cached (see lib/products.ts).
const cachedActiveDeliverySlabs = unstable_cache(
  async (): Promise<DeliverySlab[]> => {
    const { data, error } = await getPublicClient()
      .from("delivery_slabs")
      .select("id,min_weight_grams,max_weight_grams,price,active")
      .eq("active", true)
      .order("min_weight_grams");
    if (error) throw new Error(error.message);
    return (data ?? []) as DeliverySlab[];
  },
  ["active-delivery-slabs"],
  { revalidate: CATALOGUE_REVALIDATE_SECONDS, tags: [CACHE_TAGS.deliverySlabs] }
);

/** Active delivery-fee slabs, cached and refreshed when an admin edits them. */
export async function getActiveDeliverySlabs(): Promise<DeliverySlab[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    return await cachedActiveDeliverySlabs();
  } catch (err) {
    console.error("[delivery] failed to load delivery slabs:", err);
    return [];
  }
}
