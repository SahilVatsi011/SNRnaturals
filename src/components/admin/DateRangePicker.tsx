"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState } from "react";
import {
  addDays,
  presetRanges,
  todayIST,
  type DatePreset,
} from "@/lib/analytics";

const PRESETS: { key: Exclude<DatePreset, "custom">; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "7d", label: "7D" },
  { key: "30d", label: "30D" },
  { key: "month", label: "This Month" },
  { key: "lastmonth", label: "Last Month" },
];

export default function DateRangePicker({
  from,
  to,
  preset,
}: {
  from: string;
  to: string;
  preset: DatePreset;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [customFrom, setCustomFrom] = useState(from);
  const [customTo, setCustomTo] = useState(to);

  const apply = (nextFrom: string, nextTo: string, nextPreset: DatePreset) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("from", nextFrom);
    params.set("to", nextTo);
    params.set("preset", nextPreset);
    router.push(`${pathname}?${params.toString()}`);
  };

  const onPreset = (key: Exclude<DatePreset, "custom">) => {
    const range = presetRanges()[key];
    apply(range.from, range.to, key);
  };

  const onCustomApply = () => {
    const today = todayIST();
    let nextFrom = customFrom;
    let nextTo = customTo;

    if (!nextFrom || !nextTo) {
      nextFrom = addDays(today, -29);
      nextTo = today;
    }
    if (nextFrom > nextTo) {
      const swap = nextFrom;
      nextFrom = nextTo;
      nextTo = swap;
    }
    setCustomFrom(nextFrom);
    setCustomTo(nextTo);
    apply(nextFrom, nextTo, "custom");
  };

  return (
    <div className="mb-5 rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        {PRESETS.map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={() => onPreset(p.key)}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
              preset === p.key
                ? "bg-brand-600 text-white"
                : "bg-stone-100 text-stone-600 hover:bg-stone-200"
            }`}
          >
            {p.label}
          </button>
        ))}
        <span className="hidden text-stone-300 sm:inline">|</span>
        <button
          type="button"
          onClick={() => onCustomApply()}
          className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
            preset === "custom"
              ? "bg-brand-600 text-white"
              : "bg-stone-100 text-stone-600 hover:bg-stone-200"
          }`}
        >
          Custom
        </button>
      </div>

      <div className="mt-4 flex flex-wrap items-end gap-3">
        <div>
          <label
            htmlFor="range-from"
            className="mb-1 block text-xs font-medium text-stone-500"
          >
            From
          </label>
          <input
            id="range-from"
            type="date"
            value={customFrom}
            max={customTo}
            onChange={(e) => setCustomFrom(e.target.value)}
            className="rounded-md border border-stone-300 px-3 py-1.5 text-sm text-stone-700 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
        <div>
          <label
            htmlFor="range-to"
            className="mb-1 block text-xs font-medium text-stone-500"
          >
            To
          </label>
          <input
            id="range-to"
            type="date"
            value={customTo}
            min={customFrom}
            onChange={(e) => setCustomTo(e.target.value)}
            className="rounded-md border border-stone-300 px-3 py-1.5 text-sm text-stone-700 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
        <button
          type="button"
          onClick={onCustomApply}
          className="rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
        >
          Apply
        </button>
      </div>
    </div>
  );
}
