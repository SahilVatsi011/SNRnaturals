import type { Metadata } from "next";
import { PolicyLayout } from "@/components/store/PolicyLayout";
import { business, fullAddress } from "@/config/business";

export const metadata: Metadata = {
  title: `Privacy Policy | ${business.brandName}`,
  description: `Privacy policy for ${business.brandName}. Learn how we collect, use and protect your personal information.`,
};

export default function PrivacyPolicyPage() {
  const c = business.contact;
  const g = business.grievanceOfficer;

  return (
    <PolicyLayout title="Privacy Policy" showLastUpdated>
      <p>
        {business.legalName} (&quot;{business.brandName}&quot;) respects your privacy. This policy explains what information we collect on {business.websiteUrl} and how we use it.
      </p>

      <h2>1. Information we collect</h2>
      <p>When you place an order, we collect your name, phone number, email address and delivery address. We also collect basic technical data (such as browser type and pages visited) to keep the Website working properly.</p>

      <h2>2. Payment information</h2>
      <p>Payments are processed by <strong>Razorpay</strong>. We do not collect or store your card numbers, UPI PIN, CVV or net-banking credentials. Razorpay&apos;s own privacy policy applies to the payment process.</p>

      <h2>3. How we use your information</h2>
      <ul>
        <li>To process, pack and deliver your order</li>
        <li>To send order confirmations and updates by SMS, email or WhatsApp</li>
        <li>To respond to your queries and complaints</li>
        <li>To comply with legal and tax requirements</li>
      </ul>
      <p>We do <strong>not</strong> sell or rent your personal information to anyone.</p>

      <h2>4. Sharing</h2>
      <p>We share only the necessary details with: Razorpay (payment processing), our courier/delivery partners (name, phone, address for delivery), and our SMS service provider (order notifications). We may disclose information if required by law.</p>

      <h2>5. Data storage and security</h2>
      <p>Your data is stored on secure servers and access is limited to people who need it to fulfil your order. We keep order records for as long as needed for delivery, customer support and legal/tax purposes.</p>

      <h2>6. Cookies</h2>
      <p>The Website may use essential cookies/local storage to remember your cart. We do not use them to track you across other websites.</p>

      <h2>7. Your rights</h2>
      <p>You can ask us to access, correct or delete your personal data (subject to legal record-keeping requirements) by writing to <a href={`mailto:${c.email}`}>{c.email}</a>.</p>

      <h2>8. Grievance Officer</h2>
      <p>In line with the Information Technology Act, 2000 and the Digital Personal Data Protection Act, 2023:</p>
      <p>{g.name}, <a href={`mailto:${g.email}`}>{g.email}</a>, <a href={`tel:${g.phone.replace(/\s/g, "")}`}>{g.phone}</a>, {fullAddress()}. We will acknowledge complaints within {g.ackTime}.</p>

      <h2>9. Changes</h2>
      <p>We may update this policy; the latest version will always be on this page.</p>
    </PolicyLayout>
  );
}
