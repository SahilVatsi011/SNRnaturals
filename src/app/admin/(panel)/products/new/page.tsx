import { ProductForm } from "@/components/admin/ProductForm";
import { createProduct } from "../actions";
import { fetchFeeConfig } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const feeConfig = await fetchFeeConfig();

  return (
    <div>
      <h1 className="mb-5 text-2xl font-bold text-stone-800">Add Product</h1>
      <ProductForm feeConfig={feeConfig} createAction={createProduct} />
    </div>
  );
}
