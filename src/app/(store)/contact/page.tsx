import type { Metadata } from "next";
import { PolicyLayout } from "@/components/store/PolicyLayout";
import { business, fullAddress, whatsappDigits } from "@/config/business";

export const metadata: Metadata = {
  title: `Contact Us | ${business.brandName}`,
  description: `Get in touch with ${business.brandName}. We're happy to help with orders, delivery or product questions.`,
};

export default function ContactPage() {
  const c = business.contact;
  const waDigits = whatsappDigits();

  return (
    <PolicyLayout title="Contact Us">
      <p>We&apos;re happy to help with orders, delivery or product questions.</p>
      <ul>
        <li><strong>Business name:</strong> {business.legalName}</li>
        <li><strong>Address:</strong> {fullAddress()}</li>
        <li><strong>Phone:</strong> <a href={`tel:${c.phone.replace(/\s/g, "")}`}>{c.phone}</a></li>
        <li><strong>WhatsApp:</strong> <a href={`https://wa.me/${waDigits}`} target="_blank" rel="noopener noreferrer">{c.whatsapp}</a></li>
        <li><strong>Email:</strong> <a href={`mailto:${c.email}`}>{c.email}</a></li>
        <li><strong>Support hours:</strong> {c.hours}</li>
      </ul>
      <p>
        We usually reply within {c.replyTime}. For order-related queries, please mention your <strong>Order ID</strong>.
      </p>
    </PolicyLayout>
  );
}
