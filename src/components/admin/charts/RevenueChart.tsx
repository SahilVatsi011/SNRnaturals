"use client";

import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DailyPoint } from "@/lib/analytics";
import { rupees } from "@/lib/analytics";

type Metric = "revenue" | "orders" | "units";

const METRICS: { key: Metric; label: string }[] = [
  { key: "revenue", label: "Revenue" },
  { key: "orders", label: "Orders" },
  { key: "units", label: "Units" },
];

function formatValue(metric: Metric, value: number): string {
  if (metric === "revenue") return rupees(value);
  return value.toLocaleString("en-IN");
}

export default function RevenueChart({ data }: { data: DailyPoint[] }) {
  const [metric, setMetric] = useState<Metric>("revenue");

  const total = useMemo(
    () => data.reduce((sum, d) => sum + d[metric], 0),
    [data, metric]
  );

  const axisTick = useMemo(
    () => (metric === "revenue" ? "₹" : ""),
    [metric]
  );

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-1 rounded-lg bg-stone-100 p-1">
          {METRICS.map((m) => (
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
        <p className="text-sm text-stone-500">
          Total:{" "}
          <span className="font-semibold text-stone-800">
            {formatValue(metric, total)}
          </span>
        </p>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 5, right: 10, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#059669" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#059669" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: "#78716c" }}
              tickLine={false}
              axisLine={{ stroke: "#e7e5e4" }}
              minTickGap={18}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#78716c" }}
              tickLine={false}
              axisLine={false}
              width={58}
              tickFormatter={(v: number) =>
                metric === "revenue"
                  ? `${axisTick}${v >= 1000 ? `${Math.round(v / 1000)}k` : v}`
                  : `${v}`
              }
            />
            <Tooltip
              formatter={(value) => formatValue(metric, Number(value ?? 0))}
              labelStyle={{ color: "#57534e", fontWeight: 600 }}
              contentStyle={{
                borderRadius: 8,
                border: "1px solid #e7e5e4",
                fontSize: 12,
              }}
            />
            <Area
              type="monotone"
              dataKey={metric}
              stroke="#059669"
              strokeWidth={2}
              fill="url(#revFill)"
              dot={false}
              activeDot={{ r: 4 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
