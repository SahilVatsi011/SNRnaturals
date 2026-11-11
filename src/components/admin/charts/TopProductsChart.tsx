"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ProductStat } from "@/lib/analytics";
import { rupees } from "@/lib/analytics";

type Metric = "units" | "revenue";

export default function TopProductsChart({
  products,
  limit = 8,
}: {
  products: ProductStat[];
  limit?: number;
}) {
  const [metric, setMetric] = useState<Metric>("units");

  const data = useMemo(
    () =>
      products.slice(0, limit).map((p) => ({
        name: p.name.length > 22 ? `${p.name.slice(0, 21)}…` : p.name,
        fullName: p.name,
        units: p.units,
        revenue: p.revenue,
      })),
    [products, limit]
  );

  if (data.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-stone-500">
        No product sales in this period.
      </p>
    );
  }

  return (
    <div>
      <div className="mb-4 flex gap-1 rounded-lg bg-stone-100 p-1 w-fit">
        {(
          [
            { key: "units", label: "Units" },
            { key: "revenue", label: "Revenue" },
          ] as const
        ).map((m) => (
          <button
            key={m.key}
            type="button"
            onClick={() => setMetric(m.key)}
            className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
              metric === m.key
                ? "bg-white text-brand-700 shadow-sm"
                : "text-stone-500 hover:text-stone-700"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 5, right: 20, left: 10, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
            <XAxis
              type="number"
              tick={{ fontSize: 11, fill: "#78716c" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) =>
                metric === "revenue"
                  ? `₹${v >= 1000 ? `${Math.round(v / 1000)}k` : v}`
                  : `${v}`
              }
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fontSize: 11, fill: "#57534e" }}
              tickLine={false}
              axisLine={false}
              width={140}
            />
            <Tooltip
              formatter={(value) =>
                metric === "revenue"
                  ? rupees(Number(value ?? 0))
                  : `${value ?? 0} units`
              }
              labelFormatter={(label) => {
                const match = data.find((d) => d.name === label);
                return match?.fullName ?? String(label);
              }}
              contentStyle={{
                borderRadius: 8,
                border: "1px solid #e7e5e4",
                fontSize: 12,
              }}
            />
            <Bar
              dataKey={metric}
              fill="#2d7a17"
              radius={[0, 4, 4, 0]}
              maxBarSize={22}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
