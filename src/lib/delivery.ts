/**
 * Delivery fee engine — PIN-code zones × weight slabs.
 *
 * - Slabs with no zone are the STANDARD rates (any PIN code).
 * - A zone is a list of PIN-code prefixes with its own slabs. The zone with
 *   the longest prefix matching the customer's PIN wins, so "175019" can sit
 *   in a "Sundernagar" zone (prefix "17501") while the rest of Himachal uses a
 *   "Himachal" zone (prefix "17").
 * - If a zone has no slab for the cart weight, the standard slab is used.
 *
 * Slabs and zones are edited by the admin under Admin → Delivery.
 */
export interface DeliverySlab {
  id: string;
  min_weight_grams: number;
  max_weight_grams: number | null;
  price: number;
  active?: boolean;
  /** null/undefined = standard rate. */
  zone_id?: string | null;
}

export interface DeliveryZone {
  id: string;
  name: string;
  pin_prefixes: string[];
  active?: boolean;
}

/** Digits-only, 6-digit Indian PIN code, or null. */
export function cleanPincode(pin: string | null | undefined): string | null {
  const d = String(pin ?? "").replace(/\D/g, "");
  return /^[1-9]\d{5}$/.test(d) ? d : null;
}

/** The zone whose longest PIN prefix matches, or null for standard rates. */
export function matchZone(
  pincode: string | null | undefined,
  zones: DeliveryZone[]
): DeliveryZone | null {
  const pin = cleanPincode(pincode);
  if (!pin) return null;
  let best: DeliveryZone | null = null;
  let bestLen = 0;
  for (const z of zones) {
    if (z.active === false) continue;
    for (const raw of z.pin_prefixes ?? []) {
      const prefix = String(raw).replace(/\D/g, "");
      if (prefix && pin.startsWith(prefix) && prefix.length > bestLen) {
        best = z;
        bestLen = prefix.length;
      }
    }
  }
  return best;
}

function slabFor(weight: number, slabs: DeliverySlab[]): DeliverySlab | null {
  return (
    slabs.find(
      (s) =>
        weight >= s.min_weight_grams &&
        (s.max_weight_grams == null || weight < s.max_weight_grams)
    ) ?? null
  );
}

export function calculateDeliveryFee(
  totalWeightGrams: number,
  slabs: DeliverySlab[],
  opts: { pincode?: string | null; zones?: DeliveryZone[] } = {}
): { fee: number; matchedSlab: DeliverySlab | null; zone: DeliveryZone | null } {
  const active = (slabs || []).filter((s) => s.active !== false);
  const standard = active.filter((s) => !s.zone_id);

  const zone = matchZone(opts.pincode, opts.zones ?? []);
  const zoneSlab = zone
    ? slabFor(totalWeightGrams, active.filter((s) => s.zone_id === zone.id))
    : null;
  const matched = zoneSlab ?? slabFor(totalWeightGrams, standard);

  return {
    fee: matched ? Number(matched.price) : 0,
    matchedSlab: matched,
    zone: zoneSlab ? zone : null,
  };
}
