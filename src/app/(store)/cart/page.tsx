import { getActiveDeliverySlabs } from "@/lib/delivery_slabs";
import { CartView } from "@/components/store/CartView";

export const dynamic = "force-dynamic";

export default async function CartPage() {
  const slabs = await getActiveDeliverySlabs();
  return <CartView slabs={slabs} />;
}
