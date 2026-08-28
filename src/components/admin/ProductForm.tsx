"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Label } from "@/components/ui/Input";
import { computePriceBreakdown, type PriceBreakdown } from "@/lib/pricing";

export interface ProductFormData {
  id?: string;
  name: string;
  description: string;
  mrp: number;
  price: number;
  weight_grams: number;
  length_cm: number;
  width_cm: number;
  height_cm: number;
  stock_qty: number;
  category: string;
  active: boolean;
  images: string[];
}

interface ProductFormProps {
  initial?: ProductFormData;
  feeConfig: { razorpayFeeRate: number; smsCostPerOrder: number };
  createAction: (formData: FormData) => Promise<{ error?: string } | void>;
  updateAction?: (
    id: string,
    formData: FormData
  ) => Promise<{ error?: string } | void>;
}

export function ProductForm({
  initial,
  feeConfig,
  createAction,
  updateAction,
}: ProductFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<ProductFormData>(
    initial ?? {
      name: "",
      description: "",
      mrp: 0,
      price: 0,
      weight_grams: 0,
      length_cm: 0,
      width_cm: 0,
      height_cm: 0,
      stock_qty: 0,
      category: "",
      active: true,
      images: [],
    }
  );
  const [uploading, setUploading] = useState(false);

  const set = <K extends keyof ProductFormData>(
    key: K,
    value: ProductFormData[K]
  ) => setForm((f) => ({ ...f, [key]: value }));

  const breakdown: PriceBreakdown = computePriceBreakdown(
    form.price,
    feeConfig
  );

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("images", JSON.stringify(form.images));

      const res = await fetch(`/api/admin/products/upload`, {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (data.url) {
        set("images", [...form.images, data.url]);
      } else {
        console.error(data.error);
      }
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  function removeImage(index: number) {
    set(
      "images",
      form.images.filter((_, i) => i !== index)
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const fd = new FormData();
    fd.set("name", form.name);
    fd.set("description", form.description);
    fd.set("mrp", String(form.mrp));
    fd.set("price", String(form.price));
    fd.set("weight_grams", String(form.weight_grams));
    fd.set("length_cm", String(form.length_cm));
    fd.set("width_cm", String(form.width_cm));
    fd.set("height_cm", String(form.height_cm));
    fd.set("stock_qty", String(form.stock_qty));
    fd.set("category", form.category);
    fd.set("active", form.active ? "on" : "");
    fd.set("images", JSON.stringify(form.images));

    if (form.id && updateAction) {
      updateAction(form.id, fd);
    } else {
      createAction(fd);
    }
    router.refresh();
  }

  const num = (v: string) => (v === "" ? 0 : Number(v));

  return (
    <form onSubmit={handleSubmit}>
      <input type="hidden" name="id" value={form.id} />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main column */}
        <div className="space-y-5 lg:col-span-2">
          <div className="rounded-lg border border-stone-200 bg-white p-5">
            <h2 className="mb-4 text-lg font-semibold text-stone-800">
              Product Details
            </h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Product name *</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  rows={4}
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    value={form.category}
                    onChange={(e) => set("category", e.target.value)}
                    placeholder="e.g. Honey, Spices"
                  />
                </div>
                <div>
                  <Label htmlFor="stock_qty">Stock quantity</Label>
                  <Input
                    id="stock_qty"
                    type="number"
                    value={form.stock_qty}
                    onChange={(e) => set("stock_qty", num(e.target.value))}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-stone-200 bg-white p-5">
            <h2 className="mb-4 text-lg font-semibold text-stone-800">
              Weight & Dimensions (for delivery)
            </h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div>
                <Label htmlFor="weight_grams">Weight (g)</Label>
                <Input
                  id="weight_grams"
                  type="number"
                  value={form.weight_grams}
                  onChange={(e) => set("weight_grams", num(e.target.value))}
                />
              </div>
              <div>
                <Label htmlFor="length_cm">Length (cm)</Label>
                <Input
                  id="length_cm"
                  type="number"
                  value={form.length_cm}
                  onChange={(e) => set("length_cm", num(e.target.value))}
                />
              </div>
              <div>
                <Label htmlFor="width_cm">Width (cm)</Label>
                <Input
                  id="width_cm"
                  type="number"
                  value={form.width_cm}
                  onChange={(e) => set("width_cm", num(e.target.value))}
                />
              </div>
              <div>
                <Label htmlFor="height_cm">Height (cm)</Label>
                <Input
                  id="height_cm"
                  type="number"
                  value={form.height_cm}
                  onChange={(e) => set("height_cm", num(e.target.value))}
                />
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-stone-200 bg-white p-5">
            <h2 className="mb-4 text-lg font-semibold text-stone-800">
              Images
            </h2>
            <div className="flex flex-wrap gap-3">
              {form.images.map((img, i) => (
                <div key={i} className="relative h-20 w-20">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img}
                    alt=""
                    className="h-full w-full rounded border border-stone-200 object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-xs text-white"
                  >
                    ×
                  </button>
                </div>
              ))}
              <label className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center rounded border-2 border-dashed border-stone-300 text-stone-400 hover:border-brand-500 hover:text-brand-600">
                <span className="text-xl">{uploading ? "…" : "+"}</span>
                <span className="text-xs">Upload</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                  disabled={uploading}
                />
              </label>
            </div>
          </div>
        </div>

        {/* Sidebar: pricing */}
        <div className="space-y-5">
          <div className="rounded-lg border border-stone-200 bg-white p-5">
            <h2 className="mb-4 text-lg font-semibold text-stone-800">
              Pricing
            </h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="mrp">MRP (list price)</Label>
                <Input
                  id="mrp"
                  type="number"
                  step="0.01"
                  value={form.mrp || ""}
                  onChange={(e) => set("mrp", num(e.target.value))}
                />
              </div>
              <div>
                <Label htmlFor="price">
                  Selling price (what customer pays) *
                </Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  required
                  value={form.price || ""}
                  onChange={(e) => set("price", num(e.target.value))}
                />
                <p className="mt-1 text-xs text-stone-500">
                  Fees baked in below automatically.
                </p>
              </div>

              <div className="rounded-md bg-stone-50 p-3 text-sm">
                <div className="flex justify-between py-0.5">
                  <span className="text-stone-500">Customer pays</span>
                  <span className="font-medium">
                    ₹{breakdown.finalPrice.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="text-stone-500">
                    Razorpay fee ({(feeConfig.razorpayFeeRate * 100).toFixed(2)}%)
                  </span>
                  <span className="text-red-600">
                    − ₹{breakdown.razorpayFee.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="text-stone-500">SMS cost</span>
                  <span className="text-red-600">
                    − ₹{breakdown.smsFee.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="mt-1 flex justify-between border-t border-stone-200 pt-2 font-semibold">
                  <span className="text-stone-700">You receive</span>
                  <span className="text-brand-700">
                    ₹{breakdown.netReceived.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-stone-200 bg-white p-5">
            <Label className="!mb-2 block">Visibility</Label>
            <label className="flex items-center gap-2 text-sm text-stone-700">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => set("active", e.target.checked)}
                className="h-4 w-4 rounded border-stone-300 text-brand-600 focus:ring-brand-500"
              />
              Active (visible on storefront)
            </label>
          </div>

          <div className="flex gap-3">
            <Button type="submit" size="lg" className="flex-1">
              {form.id ? "Save changes" : "Create product"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="lg"
              onClick={() => router.push("/admin/products")}
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
