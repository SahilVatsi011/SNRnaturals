import type { Metadata } from "next";
import { PolicyLayout } from "@/components/store/PolicyLayout";
import { business, shippingChargeText } from "@/config/business";

export const metadata: Metadata = {
  title: `Shipping & Delivery Policy | ${business.brandName}`,
  description: `Shipping and delivery policy for ${business.brandName}. Learn about delivery areas, processing times and shipping charges.`,
};

export default function ShippingPolicyPage() {
  const s = business.shipping;
  const c = business.contact;
  const isHPOnly = s.deliveryArea.toLowerCase().includes("himachal") && !s.deliveryArea.toLowerCase().includes("india");

  return (
    <PolicyLayout title="Shipping & Delivery Policy" showLastUpdated>
      <h2>1. Delivery area</h2>
      <p>We currently deliver {s.deliveryArea} to serviceable PIN codes.</p>

      <h2>2. Processing time</h2>
      <p>Orders are packed and dispatched within <strong>{s.dispatchTime}</strong> after payment confirmation. Orders are not dispatched on {s.nonDispatchDays}.</p>

      <h2>3. Delivery time</h2>
      <ul>
        <li>Within Himachal Pradesh: <strong>{s.deliveryWithinHP}</strong> after dispatch</li>
        {!isHPOnly && (
          <li>Rest of India: <strong>{s.deliveryRestOfIndia}</strong> after dispatch</li>
        )}
      </ul>
      <p>Delivery to remote/hilly areas may take longer due to weather and road conditions.</p>

      <h2>4. Shipping charges</h2>
      <p>{shippingChargeText()} The exact charge is shown at checkout before payment.</p>

      <h2>5. Order updates</h2>
      <p>You will receive order and dispatch updates via SMS/WhatsApp on the phone number given at checkout. Tracking details (if available) are shared once the order is dispatched.</p>

      <h2>6. Delivery issues</h2>
      <p>Please make sure the address and phone number are correct. If a delivery fails because of an incorrect address or the recipient being unavailable, re-shipping charges may apply. If your order hasn&apos;t arrived within the stated time, contact us at <a href={`mailto:${c.email}`}>{c.email}</a> / <a href={`tel:${c.phone.replace(/\s/g, "")}`}>{c.phone}</a>.</p>
    </PolicyLayout>
  );
}
