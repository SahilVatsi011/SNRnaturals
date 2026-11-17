import { unstable_cache } from "next/cache";
import { getPublicClient } from "@/lib/supabase/public";
import { isSupabaseConfigured } from "@/lib/env";
import { CACHE_TAGS, CATALOGUE_REVALIDATE_SECONDS } from "@/lib/cache-tags";
import type { DeliverySlab, DeliveryZone } from "@/lib/delivery";

// Throws on DB errors so a failed read is never cached (see lib/products.ts).
const cachedActiveDeliverySlabs = unstable_cache(
  async (): Promise<DeliverySlab[]> => {
    const { data, error } = await getPublicClient()
      .from("delivery_slabs")
      .select("*")
      .eq("active", true)
      .order("min_weight_grams");
    if (error) throw new Error(error.message);
    return (data ?? []) as DeliverySlab[];
  },
  ["active-delivery-slabs-v2"],
  { revalidate: CATALOGUE_REVALIDATE_SECONDS, tags: [CACHE_TAGS.deliverySlabs] }
);

const cachedActiveDeliveryZones = unstable_cache(
  async (): Promise<DeliveryZone[]> => {
    const { data, error } = await getPublicClient()
      .from("delivery_zones")
      .select("id,name,pin_prefixes,active")
      .eq("active", true)
      .order("sort_order");
    if (error) throw new Error(error.message);
    return (data ?? []) as DeliveryZone[];
  },
  ["active-delivery-zones"],
  { revalidate: CATALOGUE_REVALIDATE_SECONDS, tags: [CACHE_TAGS.deliverySlabs] }
);

/** Active delivery-fee slabs (standard + zone), cached and refreshed when an admin edits them. */
export async function getActiveDeliverySlabs(): Promise<DeliverySlab[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    return await cachedActiveDeliverySlabs();
  } catch (err) {
    console.error("[delivery] failed to load delivery slabs:", err);
    return [];
  }
}

/** Active PIN-code delivery zones. Empty if none exist (or the table isn't created yet). */
export async function getActiveDeliveryZones(): Promise<DeliveryZone[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    return await cachedActiveDeliveryZones();
  } catch (err) {
    console.error("[delivery] failed to load delivery zones:", err);
    return [];
  }
}
