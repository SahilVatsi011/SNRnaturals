import { getActiveDeliverySlabs } from "@/lib/delivery_slabs";
import { CheckoutForm } from "@/components/store/CheckoutForm";
import { createOrder } from "./actions";
import { validateCoupon } from "./coupon-actions";

export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const slabs = await getActiveDeliverySlabs();
  return <CheckoutForm slabs={slabs} createOrder={createOrder} validateCoupon={validateCoupon} />;
}
