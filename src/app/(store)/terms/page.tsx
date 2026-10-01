import type { Metadata } from "next";
import Link from "next/link";
import { PolicyLayout } from "@/components/store/PolicyLayout";
import { business, fullAddress } from "@/config/business";

export const metadata: Metadata = {
  title: `Terms & Conditions | ${business.brandName}`,
  description: `Terms and conditions for using the ${business.brandName} website and placing orders.`,
};

export default function TermsPage() {
  const c = business.contact;

  return (
    <PolicyLayout title="Terms & Conditions" showLastUpdated>
      <p>
        These Terms &amp; Conditions apply to your use of {business.websiteUrl} (&quot;Website&quot;), operated by {business.legalName}, {fullAddress()} (&quot;{business.brandName}&quot;, &quot;we&quot;, &quot;us&quot;). By using this Website or placing an order, you agree to these terms.
      </p>

      <h2>1. Eligibility</h2>
      <p>You must be at least 18 years old, or use the Website under the supervision of a parent or guardian, to place an order.</p>

      <h2>2. Orders</h2>
      <p>Orders are placed as a guest; no account is required. You are responsible for providing a correct name, phone number, email and delivery address. An order is confirmed only after successful payment. We may cancel an order in case of stock unavailability, pricing errors or suspected fraud; in such cases a full refund is issued as per our Cancellation &amp; Refund Policy.</p>

      <h2>3. Payments</h2>
      <p>All payments are processed securely through Razorpay. We do not store your card, UPI or bank details. Orders are prepaid only.</p>

      <h2>4. Product information</h2>
      <p>We try to describe products, weights and ingredients accurately. Being natural products, colour, texture, aroma and taste may vary slightly between batches. Product images are for representation.</p>

      <h2>5. Health disclaimer</h2>
      <p>Our products are food/natural products and are not intended to diagnose, treat, cure or prevent any disease. Please check ingredients for allergies before use and consult a doctor if you have specific health concerns.</p>

      <h2>6. Shipping, cancellation and refunds</h2>
      <p>These are governed by our <Link href="/shipping-policy">Shipping &amp; Delivery Policy</Link> and <Link href="/refund-policy">Cancellation &amp; Refund Policy</Link>, which form part of these terms.</p>

      <h2>7. Intellectual property</h2>
      <p>All content on this Website (text, images, logo, design) belongs to {business.brandName} and may not be copied without written permission.</p>

      <h2>8. Limitation of liability</h2>
      <p>Our liability for any order is limited to the amount paid for that order. We are not liable for delays caused by courier partners, natural events or other circumstances beyond our control.</p>

      <h2>9. Changes</h2>
      <p>We may update these terms at any time. The version on this page at the time of your order applies.</p>

      <h2>10. Governing law</h2>
      <p>These terms are governed by the laws of India. Disputes are subject to the jurisdiction of courts in {business.legal.jurisdiction}.</p>

      <h2>11. Contact</h2>
      <p><a href={`mailto:${c.email}`}>{c.email}</a> | <a href={`tel:${c.phone.replace(/\s/g, "")}`}>{c.phone}</a></p>
    </PolicyLayout>
  );
}
