import type { Metadata } from "next";
import { PolicyLayout } from "@/components/store/PolicyLayout";
import { business, fullAddress } from "@/config/business";

export const metadata: Metadata = {
  title: `About Us | ${business.brandName}`,
  description: `${business.brandName} is a natural products store based in ${business.address.city}, ${business.address.state}. Learn more about us.`,
};

export default function AboutPage() {
  return (
    <PolicyLayout title="About Us">
      <p>
        <strong>{business.brandName}</strong> is a natural products store based in {business.address.city}, {business.address.district}, {business.address.state}. We bring {business.about.products} sourced from {business.about.sourcing}.
      </p>
      <p>
        Our aim is simple: honest products, clearly labelled, delivered fresh to your door.
      </p>
      <ul>
        <li><strong>Business name:</strong> {business.legalName}</li>
        <li><strong>Address:</strong> {fullAddress()}</li>
        {business.gstin && <li><strong>GSTIN:</strong> {business.gstin}</li>}
      </ul>
    </PolicyLayout>
  );
}
