import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { Card } from "@/components/ui/Card";
import { SubmitButton } from "@/components/ui/SubmitButton";
import NotConfiguredBanner from "@/components/admin/NotConfiguredBanner";
import { AddSlabForm, ZoneEditor, ZoneForm } from "@/components/admin/DeliveryForms";
import { calculateDeliveryFee, cleanPincode, type DeliverySlab, type DeliveryZone } from "@/lib/delivery";
import { formatINR } from "@/lib/format";
import { addSlab, deleteSlab, deleteZone, saveZone, updateSlabPrice } from "./actions";

export const dynamic = "force-dynamic";

type Zone = DeliveryZone & { active: boolean; sort_order: number };

function weight(g: number | null | undefined) {
  if (g == null) return "no limit";
  return g >= 1000 ? `${+(g / 1000).toFixed(2)} kg` : `${g} g`;
}

function SlabTable({ slabs, emptyText }: { slabs: DeliverySlab[]; emptyText: string }) {
  if (slabs.length === 0) {
    return <p className="rounded-xl border border-dashed border-stone-200 px-4 py-5 text-center text-sm text-stone-500">{emptyText}</p>;
  }
  return (
    <ul className="divide-y divide-stone-100 overflow-hidden rounded-xl ring-1 ring-stone-100">
      {slabs.map((s) => (
        <li key={s.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 bg-white px-3 py-2.5">
          <span className="min-w-0 flex-1 whitespace-nowrap text-sm text-ink">
            {weight(s.min_weight_grams)} – {weight(s.max_weight_grams)}
          </span>
          <form action={updateSlabPrice} className="flex items-center gap-1.5">
            <input type="hidden" name="id" value={s.id} />
            <span className="text-sm text-stone-500">₹</span>
            <input
              name="price"
              type="number"
              inputMode="decimal"
              step="any"
              min={0}
              defaultValue={Number(s.price)}
              aria-label="Delivery charge"
              className="w-20 rounded-lg border border-stone-200 px-2 py-1.5 text-base font-semibold text-ink focus:border-brand-500 focus:outline-none sm:text-sm"
            />
            <SubmitButton unstyled pendingLabel="…" className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-50">
              Save
            </SubmitButton>
          </form>
          <form action={deleteSlab}>
            <input type="hidden" name="id" value={s.id} />
            <SubmitButton unstyled pendingLabel="…" className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50">
              Delete
            </SubmitButton>
          </form>
        </li>
      ))}
    </ul>
  );
}

export default async function DeliveryPage({
  searchParams,
}: {
  searchParams: Promise<{ pin?: string; w?: string }>;
}) {
  if (!isSupabaseConfigured()) {
    return (
      <div>
        <h1 className="mb-4 text-2xl font-bold tracking-tight text-ink">Delivery charges</h1>
        <NotConfiguredBanner />
      </div>
    );
  }

  const { pin = "", w = "" } = await searchParams;
  const supabase = await createClient();
  const [{ data: slabRows }, { data: zoneRows, error: zoneError }] = await Promise.all([
    supabase.from("delivery_slabs").select("*").order("min_weight_grams"),
    supabase.from("delivery_zones").select("*").order("sort_order").order("created_at"),
  ]);
  const missingTable = !!zoneError;
  const slabs = (slabRows ?? []) as DeliverySlab[];
  const zones = (zoneRows ?? []) as Zone[];
  const standard = slabs.filter((s) => !s.zone_id);

  // "Check a PIN" calculator
  const testPin = cleanPincode(pin);
  const testGrams = Math.max(0, Math.round(Number(w || "0.5") * 1000));
  const test = testPin ? calculateDeliveryFee(testGrams, slabs, { pincode: testPin, zones }) : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">Delivery charges</h1>
        <p className="mt-1 max-w-2xl text-sm text-stone-500">
          Customers pay the <b>standard rate</b> for their cart weight, unless their PIN code is in one of your <b>zones</b> — then that zone&apos;s rate is used.
        </p>
      </div>

      {missingTable && (
        <div className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-900 ring-1 ring-amber-200">
          <p className="font-semibold">One-time setup needed for PIN-code zones</p>
          <p className="mt-1">
            Open Supabase → SQL Editor, paste the contents of <code className="break-all rounded bg-white/70 px-1">supabase/migrations/0007_delivery_zones.sql</code> and click Run. Standard rates below already work.
          </p>
        </div>
      )}

      {/* Check a PIN */}
      <Card>
        <h2 className="text-base font-semibold text-ink">Check a PIN code</h2>
        <p className="mt-0.5 text-sm text-stone-500">See exactly what a customer will be charged.</p>
        <form method="GET" className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <div>
            <label className="mb-1 block text-xs font-medium text-stone-600">PIN code</label>
            <input name="pin" defaultValue={pin} inputMode="numeric" maxLength={6} placeholder="175019" className="w-full rounded-xl border border-stone-200 px-3 py-2.5 text-base sm:text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-stone-600">Cart weight (kg)</label>
            <input name="w" defaultValue={w || "0.5"} type="number" step="any" min={0} inputMode="decimal" className="w-full rounded-xl border border-stone-200 px-3 py-2.5 text-base sm:text-sm" />
          </div>
          <button className="col-span-2 rounded-xl bg-ink px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-800 sm:col-span-1">Check</button>
        </form>
        {pin && !testPin && <p className="mt-3 text-sm text-red-600">Enter a valid 6-digit PIN code.</p>}
        {test && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-brand-50 px-4 py-3 ring-1 ring-brand-100">
            <p className="text-sm text-brand-900">
              {testPin} · {weight(testGrams)} → <b>{test.zone ? test.zone.name : "Standard rate"}</b>
              {!test.matchedSlab && <span className="text-red-600"> (no rate covers this weight!)</span>}
            </p>
            <p className="text-lg font-bold text-brand-800">{formatINR(test.fee)}</p>
          </div>
        )}
      </Card>

      {/* Standard */}
      <Card>
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-ink">Standard rates</h2>
            <p className="mt-0.5 text-sm text-stone-500">Used for every PIN code that isn&apos;t in a zone below.</p>
          </div>
          <span className="shrink-0 rounded-full bg-stone-100 px-2.5 py-1 text-xs font-medium text-stone-600">All India</span>
        </div>
        <div className="space-y-3">
          <SlabTable slabs={standard} emptyText="No standard rates yet — delivery would be free. Add one below." />
          <AddSlabForm action={addSlab} />
        </div>
      </Card>

      {/* Zones */}
      {!missingTable && (
        <>
          {zones.map((z) => {
            const zs = slabs.filter((s) => s.zone_id === z.id);
            return (
              <Card key={z.id}>
                <ZoneEditor action={saveZone} zone={{ id: z.id, name: z.name, pin_prefixes: z.pin_prefixes, active: z.active }}>
                  <h2 className="flex items-center gap-2 text-base font-semibold text-ink">
                    {z.name}
                    {!z.active && <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-500">Inactive</span>}
                  </h2>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {z.pin_prefixes.map((p) => (
                      <span key={p} className="rounded-full bg-cream-100 px-2.5 py-0.5 font-mono text-xs text-ink ring-1 ring-cream-200">
                        {p}{p.length < 6 ? "…" : ""}
                      </span>
                    ))}
                  </div>
                </ZoneEditor>
                <div className="mt-4 space-y-3">
                  <SlabTable slabs={zs} emptyText="No rates for this zone yet — standard rates apply until you add one." />
                  <AddSlabForm action={addSlab} zoneId={z.id} />
                </div>
                <form action={deleteZone} className="mt-3 text-right">
                  <input type="hidden" name="id" value={z.id} />
                  <SubmitButton unstyled pendingLabel="Deleting…" className="text-xs font-medium text-red-600 hover:underline">
                    Delete zone
                  </SubmitButton>
                </form>
              </Card>
            );
          })}

          <Card className="border-2 border-dashed border-stone-200 shadow-none ring-0">
            <h2 className="text-base font-semibold text-ink">Add a zone</h2>
            <p className="mb-4 mt-0.5 text-sm text-stone-500">
              e.g. <b>Local</b> (1750, 1751), <b>Himachal</b> (17), <b>North India</b> (11, 12, 13, 14, 15, 16, 18, 19, 24, 25).
            </p>
            <ZoneForm action={saveZone} />
          </Card>
        </>
      )}
    </div>
  );
}
