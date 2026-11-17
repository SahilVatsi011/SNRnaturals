"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { SubmitButton } from "@/components/ui/SubmitButton";
import type { DeliveryActionState } from "@/app/admin/(panel)/delivery/actions";

type Action = (state: DeliveryActionState, formData: FormData) => Promise<DeliveryActionState>;

const input =
  "w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-base text-ink shadow-sm placeholder:text-stone-400 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10 sm:text-sm";
const label = "mb-1 block text-xs font-medium text-stone-600";

function Message({ state }: { state: DeliveryActionState }) {
  if (!state) return null;
  if (state.error) return <p className="mt-2 text-sm text-red-600">{state.error}</p>;
  if (state.ok) return <p className="mt-2 text-sm text-brand-700">✓ {state.ok}</p>;
  return null;
}

/** Add a weight → charge row to the standard rates or a zone. */
export function AddSlabForm({ action, zoneId }: { action: Action; zoneId?: string }) {
  const [state, formAction] = useActionState(action, null);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) ref.current?.reset();
  }, [state]);

  return (
    <form ref={ref} action={formAction} className="rounded-xl bg-stone-50 p-3 ring-1 ring-stone-100">
      {zoneId && <input type="hidden" name="zone_id" value={zoneId} />}
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-stone-500">Add a rate</p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-[1fr_1fr_88px_1fr_auto] sm:items-end">
        <div>
          <label className={label}>From</label>
          <input name="min" type="number" inputMode="decimal" step="any" min={0} defaultValue={0} required className={input} />
        </div>
        <div>
          <label className={label}>Up to (blank = no limit)</label>
          <input name="max" type="number" inputMode="decimal" step="any" min={0} placeholder="e.g. 1" className={input} />
        </div>
        <div>
          <label className={label}>Unit</label>
          <select name="unit" defaultValue="kg" className={input}>
            <option value="kg">kg</option>
            <option value="g">g</option>
          </select>
        </div>
        <div>
          <label className={label}>Charge (₹)</label>
          <input name="price" type="number" inputMode="decimal" step="any" min={0} required placeholder="e.g. 60" className={input} />
        </div>
        <SubmitButton pendingLabel="Adding…" className="col-span-2 sm:col-span-1">Add</SubmitButton>
      </div>
      <Message state={state} />
    </form>
  );
}

/** Create or edit a zone (name + PIN prefixes). */
export function ZoneForm({
  action,
  zone,
  onDone,
}: {
  action: Action;
  zone?: { id: string; name: string; pin_prefixes: string[]; active: boolean };
  onDone?: () => void;
}) {
  const [state, formAction] = useActionState(action, null);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) {
      if (!zone) ref.current?.reset();
      onDone?.();
    }
  }, [state, zone, onDone]);

  return (
    <form ref={ref} action={formAction} className="space-y-3">
      {zone && <input type="hidden" name="id" value={zone.id} />}
      <div>
        <label className={label}>Zone name</label>
        <input name="name" required defaultValue={zone?.name} placeholder="e.g. Mandi district" className={input} />
      </div>
      <div>
        <label className={label}>PIN codes or starting digits (comma separated)</label>
        <textarea
          name="pin_prefixes"
          required
          rows={2}
          defaultValue={zone?.pin_prefixes.join(", ")}
          placeholder="e.g. 1750, 1751, 1752  or  17 for all of Himachal"
          className={input}
        />
        <p className="mt-1 text-xs text-stone-500">
          Starting digits match every PIN that begins with them — <b>17</b> = all Himachal, <b>1750</b> = Mandi area, <b>175019</b> = one exact PIN.
        </p>
      </div>
      <label className="flex items-center gap-2 text-sm text-stone-700">
        <input type="checkbox" name="active" defaultChecked={zone ? zone.active : true} className="h-4 w-4 rounded border-stone-300 accent-brand-700" />
        Active
      </label>
      <div className="flex gap-2">
        <SubmitButton pendingLabel="Saving…">{zone ? "Save zone" : "Add zone"}</SubmitButton>
        {onDone && zone && (
          <button type="button" onClick={onDone} className="rounded-xl px-4 py-2.5 text-sm font-medium text-stone-600 hover:bg-stone-100">
            Cancel
          </button>
        )}
      </div>
      <Message state={state} />
    </form>
  );
}

/** Zone header with an inline "Edit" toggle. */
export function ZoneEditor({
  action,
  zone,
  children,
}: {
  action: Action;
  zone: { id: string; name: string; pin_prefixes: string[]; active: boolean };
  children: React.ReactNode;
}) {
  const [editing, setEditing] = useState(false);
  if (editing) return <ZoneForm action={action} zone={zone} onDone={() => setEditing(false)} />;
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">{children}</div>
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium text-brand-700 ring-1 ring-brand-100 hover:bg-brand-50"
      >
        Edit
      </button>
    </div>
  );
}
