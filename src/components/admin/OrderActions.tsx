"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { DEFAULTS } from "@/lib/constants";

export function OrderStatusManager({
  orderId,
  currentStatus,
  updateStatus,
}: {
  orderId: string;
  currentStatus: string;
  updateStatus: (id: string, formData: FormData) => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(() => {
      updateStatus(orderId, formData);
    });
    router.refresh();
  }

  return (
    <form action={handleSubmit} className="flex items-center gap-2">
      <select
        name="status"
        defaultValue={currentStatus}
        className="rounded-md border border-stone-300 bg-white px-3 py-2 text-sm capitalize focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
      >
        {DEFAULTS.orderStatuses.map((s) => (
          <option key={s} value={s}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </option>
        ))}
      </select>
      <Button type="submit" size="sm" disabled={isPending}>
        Update
      </Button>
    </form>
  );
}

export function CourierForm({
  orderId,
  courierName,
  trackingId,
  updateCourier,
}: {
  orderId: string;
  courierName?: string | null;
  trackingId?: string | null;
  updateCourier: (id: string, formData: FormData) => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(() => {
      updateCourier(orderId, formData);
    });
    router.refresh();
  }

  return (
    <form action={handleSubmit} className="space-y-3">
      <div>
        <Label htmlFor="courier_name">Courier name</Label>
        <Input
          id="courier_name"
          name="courier_name"
          defaultValue={courierName ?? ""}
          placeholder="e.g. Delhivery, DTDC, India Post"
        />
      </div>
      <div>
        <Label htmlFor="tracking_id">Tracking ID</Label>
        <Input
          id="tracking_id"
          name="tracking_id"
          defaultValue={trackingId ?? ""}
          placeholder="Tracking number provided by courier"
        />
      </div>
      <Button type="submit" disabled={isPending} variant="secondary">
        Save courier details
      </Button>
    </form>
  );
}
