/**
 * Delivery fee engine — weight & dimension based.
 * Selects the matching slab by total cart weight and returns its fee.
 * Slabs come from the admin-editable delivery_slabs table.
 */
export interface DeliverySlab {
  id: string;
  min_weight_grams: number;
  max_weight_grams: number | null;
  price: number;
  active?: boolean;
}

export function calculateDeliveryFee(
  totalWeightGrams: number,
  slabs: DeliverySlab[]
): { fee: number; matchedSlab: DeliverySlab | null } {
  const activeSlabs = (slabs || []).filter((s) => s.active !== false);

  const matched =
    activeSlabs.find((s) => {
      const lowerOk = totalWeightGrams >= s.min_weight_grams;
      const upperOk =
        s.max_weight_grams == null || totalWeightGrams < s.max_weight_grams;
      return lowerOk && upperOk;
    }) || null;

  return {
    fee: matched ? Number(matched.price) : 0,
    matchedSlab: matched,
  };
}
