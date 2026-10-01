import type { Metadata } from "next";
import { PolicyLayout } from "@/components/store/PolicyLayout";
import { business, shippingChargeText } from "@/config/business";

export const metadata: Metadata = {
  title: `Pricing | ${business.brandName}`,
  description: `Pricing details for ${business.brandName}. All prices in INR, ${business.pricing.taxNote}.`,
};

export default function PricingPage() {
  return (
    <PolicyLayout title="Pricing">
      <ul>
        <li>All product prices are listed on the respective product pages in <strong>Indian Rupees (INR)</strong>.</li>
        <li>Prices are {business.pricing.taxNote}.</li>
        <li>Shipping: {shippingChargeText()}</li>
        <li>The exact shipping charge is shown at checkout before payment. There are no hidden charges — the amount shown at checkout is the final amount you pay.</li>
        <li>Prices may change without prior notice, but the price at the time of order confirmation applies to your order.</li>
        <li>We accept <strong>prepaid orders only</strong> via Razorpay (UPI, debit/credit cards, net banking and wallets). <strong>Cash on Delivery is not available.</strong></li>
      </ul>
    </PolicyLayout>
  );
}
