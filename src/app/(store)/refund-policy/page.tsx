import type { Metadata } from "next";
import { PolicyLayout } from "@/components/store/PolicyLayout";
import { business, whatsappDigits } from "@/config/business";

export const metadata: Metadata = {
  title: `Cancellation & Refund Policy | ${business.brandName}`,
  description: `Cancellation and refund policy for ${business.brandName}. Learn about cancellations, returns, replacements and refund timelines.`,
};

export default function RefundPolicyPage() {
  const r = business.refund;
  const c = business.contact;
  const waDigits = whatsappDigits();

  return (
    <PolicyLayout title="Cancellation & Refund Policy" showLastUpdated>
      <h2>1. Cancellation by customer</h2>
      {r.cancellationMode === "window" ? (
        <>
          <ul>
            <li>You can cancel your order within <strong>{r.cancellationWindow}</strong> of placing it, <strong>provided it has not been dispatched</strong>, by contacting us on WhatsApp/phone/email with your Order ID.</li>
            <li>Orders cancelled within this window receive a <strong>full refund</strong>.</li>
            <li>After {r.cancellationWindow} or once the order is dispatched, it cannot be cancelled.</li>
          </ul>
        </>
      ) : (
        <p>Since we pack fresh natural products for every order, <strong>orders cannot be cancelled once payment is confirmed</strong>.</p>
      )}

      <h2>2. Cancellation by us</h2>
      <p>If a product is out of stock or we cannot deliver to your PIN code, we will cancel the order (fully or partially) and give a full refund for the cancelled items.</p>

      <h2>3. Returns and replacements</h2>
      <p>Since our products are food and natural consumables, we <strong>do not accept returns for change of mind or once a package is opened/used</strong>. We offer a <strong>replacement or refund</strong> if:</p>
      <ul>
        <li>You received a damaged, leaking or tampered product</li>
        <li>You received the wrong product</li>
        <li>The product is past its expiry date on delivery</li>
      </ul>
      <p>Please report the issue within <strong>{r.reportIssueWithin} of delivery</strong> with your Order ID and {r.proofRequired} of the product and package.</p>

      <h2>4. Refund process and timeline</h2>
      <ul>
        <li>Approved refunds are initiated within <strong>{r.refundInitiation}</strong> of approval.</li>
        <li>Refunds are credited to the <strong>original payment method</strong> (UPI/card/bank/wallet) within <strong>{r.refundCredit}</strong>, depending on your bank.</li>
        <li>Shipping charges are refunded if the issue was our mistake (damaged/wrong/expired item) or the order was cancelled by us or within the cancellation window.</li>
      </ul>

      <h2>5. Contact</h2>
      <p>
        <a href={`mailto:${c.email}`}>{c.email}</a> | <a href={`tel:${c.phone.replace(/\s/g, "")}`}>{c.phone}</a> | WhatsApp: <a href={`https://wa.me/${waDigits}`} target="_blank" rel="noopener noreferrer">{c.whatsapp}</a>
      </p>
    </PolicyLayout>
  );
}
