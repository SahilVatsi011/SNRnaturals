"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { compressImage, formatBytes } from "@/lib/image-compress";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Label } from "@/components/ui/Input";
import { computePriceBreakdown, type PriceBreakdown } from "@/lib/pricing";
import { DeleteProductButton } from "@/components/admin/DeleteProductButton";
import {
  setProductActive,
  type ActionResult,
} from "@/app/admin/(panel)/products/actions";

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
  createAction?: (formData: FormData) => Promise<{ error?: string } | void>;
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
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [uploadNote, setUploadNote] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [unlistPending, startUnlist] = useTransition();

  const set = <K extends keyof ProductFormData>(
    key: K,
    value: ProductFormData[K]
  ) => setForm((f) => ({ ...f, [key]: value }));

  const breakdown: PriceBreakdown = computePriceBreakdown(
    form.price,
    feeConfig
  );

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const input = e.target;
    const files = Array.from(input.files ?? []);
    if (files.length === 0) return;

    setUploading(true);
    setUploadError(null);
    setUploadNote(null);
    const added: string[] = [];
    let before = 0;
    let after = 0;

    try {
      for (const [i, file] of files.entries()) {
        const label = files.length > 1 ? ` ${i + 1}/${files.length}` : "";
        setUploadStatus(`Optimising${label}…`);
        const img = await compressImage(file);

        setUploadStatus(`Uploading${label}…`);
        const ext = img.type === "image/webp" ? "webp" : img.type === "image/png" ? "png" : "jpg";
        const fd = new FormData();
        fd.append("file", new File([img.blob], `photo.${ext}`, { type: img.type }));

        const res = await fetch(`/api/admin/products/upload`, { method: "POST", body: fd });
        const data = await res.json().catch(() => ({}) as { url?: string; error?: string });
        if (!res.ok || !data.url) {
          throw new Error(data.error || `Upload failed (${res.status}). Please try again.`);
        }
        added.push(data.url);
        before += img.originalBytes;
        after += img.blob.size;
      }
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed. Please try again.");
    } finally {
      if (added.length) {
        setForm((f) => ({ ...f, images: [...f.images, ...added] }));
        setUploadNote(
          `${added.length} photo${added.length === 1 ? "" : "s"} added · optimised ${formatBytes(before)} → ${formatBytes(after)}`
        );
      }
      setUploading(false);
      setUploadStatus(null);
      input.value = "";
    }
  }

  function removeImage(index: number) {
    set(
      "images",
      form.images.filter((_, i) => i !== index)
    );
  }

  function toggleVisibility() {
    if (!form.id) return;
    setActionError(null);
    startUnlist(async () => {
      const next = !form.active;
      const res: ActionResult = await setProductActive(form.id as string, next);
      if (res?.error) {
        setActionError(res.error);
        return;
      }
      set("active", next);
      router.refresh();
    });
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
    } else if (createAction) {
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
          <div className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5 p-5 sm:p-6">
            <h2 className="mb-4 text-base font-semibold text-ink">
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

          <div className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5 p-5 sm:p-6">
            <h2 className="mb-4 text-base font-semibold text-ink">
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

          <div className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5 p-5 sm:p-6">
            <h2 className="mb-4 text-base font-semibold text-ink">
              Images
            </h2>
            <div className="flex flex-wrap gap-3">
              {form.images.map((img, i) => (
                <div key={img + i} className="relative h-24 w-24">
                  <Image
                    src={img}
                    alt=""
                    fill
                    sizes="96px"
                    className="rounded-xl object-cover ring-1 ring-black/5"
                  />
                  {i === 0 && (
                    <span className="absolute bottom-1 left-1 rounded-full bg-ink/80 px-2 py-0.5 text-[10px] font-semibold text-white">
                      Cover
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    aria-label="Remove photo"
                    className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-xs text-white shadow"
                  >
                    ×
                  </button>
                </div>
              ))}
              <label
                className={`flex h-24 w-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed text-center transition ${
                  uploading
                    ? "cursor-wait border-brand-300 bg-brand-50 text-brand-700"
                    : "border-stone-300 text-stone-400 hover:border-brand-500 hover:text-brand-600"
                }`}
              >
                {uploading ? (
                  <>
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-brand-300 border-t-brand-700" />
                    <span className="px-1 text-[11px] font-medium leading-tight">{uploadStatus}</span>
                  </>
                ) : (
                  <>
                    <span className="text-2xl leading-none">+</span>
                    <span className="text-xs">Add photos</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleImageUpload}
                  disabled={uploading}
                />
              </label>
            </div>
            <p className="mt-3 text-xs text-stone-500">
              Any size works — photos are automatically resized and compressed before upload.
              The first photo is the cover.
            </p>
            {uploadNote && !uploadError && (
              <p className="mt-2 text-sm text-brand-700">✓ {uploadNote}</p>
            )}
            {uploadError && (
              <p className="mt-2 text-sm text-red-600">{uploadError}</p>
            )}
          </div>
        </div>

        {/* Sidebar: pricing */}
        <div className="space-y-5">
          <div className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5 p-5 sm:p-6">
            <h2 className="mb-4 text-base font-semibold text-ink">
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

          <div className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5 p-5 sm:p-6">
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

          {form.id && (
            <div className="rounded-lg border border-red-200 bg-white p-5">
              <Label className="!mb-2 block text-red-700">Danger zone</Label>
              <p className="mb-3 text-sm text-stone-500">
                Hide this product from the storefront (reversible), or delete
                it from the database permanently.
              </p>
              <button
                type="button"
                onClick={toggleVisibility}
                disabled={unlistPending}
                className="mb-2 w-full rounded border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-50"
              >
                {unlistPending
                  ? "Working…"
                  : form.active
                    ? "Hide from store"
                    : "Restore to store"}
              </button>
              <DeleteProductButton
                variant="danger"
                product={{
                  id: form.id,
                  name: form.name,
                  price: Number(form.price),
                  image: form.images[0] ?? null,
                  active: form.active,
                }}
              />
              {actionError && (
                <p className="mt-2 text-sm text-red-700">{actionError}</p>
              )}
            </div>
          )}

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
