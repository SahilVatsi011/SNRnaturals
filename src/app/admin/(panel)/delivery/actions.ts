"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache-tags";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/require-admin";

export type DeliveryActionState = { error?: string; ok?: string } | null;

function refresh() {
  revalidateTag(CACHE_TAGS.deliverySlabs);
  revalidatePath("/admin/delivery");
}

/** "175, 1760 ,17601" → ["175","1760","17601"] (digits only, 1–6 long, unique). */
function parsePrefixes(raw: string): string[] {
  return Array.from(
    new Set(
      raw
        .split(/[\s,;]+/)
        .map((p) => p.replace(/\D/g, ""))
        .filter((p) => p.length >= 1 && p.length <= 6)
    )
  );
}

function grams(v: FormDataEntryValue | null, unit: FormDataEntryValue | null): number | null {
  const s = String(v ?? "").trim();
  if (s === "") return null;
  const n = Number(s);
  if (!Number.isFinite(n) || n < 0) return NaN;
  return Math.round(String(unit) === "kg" ? n * 1000 : n);
}

export async function saveZone(_: DeliveryActionState, formData: FormData): Promise<DeliveryActionState> {
  const auth = await requireAdmin();
  if (!auth.ok) return { error: auth.error };

  const id = String(formData.get("id") || "");
  const name = String(formData.get("name") || "").trim();
  const prefixes = parsePrefixes(String(formData.get("pin_prefixes") || ""));
  const active = formData.get("active") === "on";

  if (!name) return { error: "Give the zone a name." };
  if (prefixes.length === 0) return { error: "Add at least one PIN code or PIN prefix (e.g. 175 or 1750)." };

  const supabase = await createClient();
  const payload = { name, pin_prefixes: prefixes, active };
  const { error } = id
    ? await supabase.from("delivery_zones").update(payload).eq("id", id)
    : await supabase.from("delivery_zones").insert(payload);

  if (error) {
    if (/delivery_zones/.test(error.message) && /does not exist|schema cache/.test(error.message)) {
      return { error: "Delivery zones table is missing. Run supabase/migrations/0007_delivery_zones.sql in Supabase first." };
    }
    return { error: error.message };
  }
  refresh();
  return { ok: id ? "Zone saved." : "Zone added." };
}

export async function deleteZone(formData: FormData) {
  const auth = await requireAdmin();
  if (!auth.ok) return;
  const id = String(formData.get("id") || "");
  const supabase = await createClient();
  // Its slabs are removed too (ON DELETE CASCADE).
  const { error } = await supabase.from("delivery_zones").delete().eq("id", id);
  if (error) console.error("delete zone:", error.message);
  refresh();
}

export async function addSlab(_: DeliveryActionState, formData: FormData): Promise<DeliveryActionState> {
  const auth = await requireAdmin();
  if (!auth.ok) return { error: auth.error };

  const zoneId = String(formData.get("zone_id") || "") || null;
  const unit = formData.get("unit");
  const min = grams(formData.get("min"), unit) ?? 0;
  const max = grams(formData.get("max"), unit);
  const price = Number(formData.get("price"));

  if (Number.isNaN(min) || (max !== null && Number.isNaN(max))) return { error: "Weights must be numbers." };
  if (max !== null && max <= min) return { error: "'Up to' weight must be more than 'From' weight." };
  if (!Number.isFinite(price) || price < 0) return { error: "Enter a delivery charge (₹)." };

  const supabase = await createClient();

  // Don't allow overlapping ranges in the same zone — the charge would be ambiguous.
  let q = supabase.from("delivery_slabs").select("min_weight_grams,max_weight_grams").eq("active", true);
  q = zoneId ? q.eq("zone_id", zoneId) : q.is("zone_id", null);
  const { data: existing } = await q;
  const overlaps = (existing ?? []).some((s) => {
    const sMax = s.max_weight_grams ?? Infinity;
    const nMax = max ?? Infinity;
    return min < sMax && s.min_weight_grams < nMax;
  });
  if (overlaps) return { error: "This weight range overlaps an existing rate. Delete or change that one first." };

  const { error } = await supabase.from("delivery_slabs").insert({
    zone_id: zoneId,
    min_weight_grams: min,
    max_weight_grams: max,
    price,
    active: true,
  });
  if (error) return { error: error.message };
  refresh();
  return { ok: "Rate added." };
}

export async function updateSlabPrice(formData: FormData) {
  const auth = await requireAdmin();
  if (!auth.ok) return;
  const id = String(formData.get("id") || "");
  const price = Number(formData.get("price"));
  if (!id || !Number.isFinite(price) || price < 0) return;
  const supabase = await createClient();
  const { error } = await supabase.from("delivery_slabs").update({ price }).eq("id", id);
  if (error) console.error("update slab:", error.message);
  refresh();
}

export async function deleteSlab(formData: FormData) {
  const auth = await requireAdmin();
  if (!auth.ok) return;
  const id = String(formData.get("id") || "");
  const supabase = await createClient();
  const { error } = await supabase.from("delivery_slabs").delete().eq("id", id);
  if (error) console.error("delete slab:", error.message);
  refresh();
}
