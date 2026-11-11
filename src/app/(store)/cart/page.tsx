import { getActiveDeliverySlabs } from "@/lib/delivery_slabs";
import { CartView } from "@/components/store/CartView";

// Static; delivery slabs are cached and refreshed when an admin edits them.
export const revalidate = 300;

export default async function CartPage() {
  const slabs = await getActiveDeliverySlabs();
  return <CartView slabs={slabs} />;
}
