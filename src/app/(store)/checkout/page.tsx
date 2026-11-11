import { getActiveDeliverySlabs } from "@/lib/delivery_slabs";
import { CheckoutForm } from "@/components/store/CheckoutForm";
import { createOrder } from "./actions";
import { validateCoupon } from "./coupon-actions";

// Static; delivery slabs are cached and refreshed when an admin edits them.
export const revalidate = 300;

export default async function CheckoutPage() {
  const slabs = await getActiveDeliverySlabs();
  return <CheckoutForm slabs={slabs} createOrder={createOrder} validateCoupon={validateCoupon} />;
}
