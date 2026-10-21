"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { StatusCount } from "@/lib/analytics";
import { rupees } from "@/lib/analytics";

const COLORS: Record<string, string> = {
  paid: "#059669",
  pending: "#d97706",
  failed: "#dc2626",
  cancelled: "#78716c",
  refunded: "#7c3aed",
};

export default function StatusChart({ statuses }: { statuses: StatusCount[] }) {
  if (statuses.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-stone-500">
        No orders in this period.
      </p>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <div className="h-48 w-48 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={statuses}
              dataKey="count"
              nameKey="label"
              innerRadius={48}
              outerRadius={72}
              paddingAngle={2}
              stroke="#fff"
              strokeWidth={2}
            >
              {statuses.map((s) => (
                <Cell key={s.key} fill={COLORS[s.key] ?? "#a8a29e"} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, name) => [
                `${value ?? 0} orders`,
                String(name),
              ]}
              contentStyle={{
                borderRadius: 8,
                border: "1px solid #e7e5e4",
                fontSize: 12,
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <ul className="w-full space-y-2">
        {statuses.map((s) => (
          <li
            key={s.key}
            className="flex items-center justify-between gap-3 text-sm"
          >
            <span className="flex items-center gap-2 text-stone-600">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ background: COLORS[s.key] ?? "#a8a29e" }}
              />
              {s.label}
            </span>
            <span className="font-semibold text-stone-800">
              {s.count}
              <span className="ml-2 text-xs font-normal text-stone-400">
                {rupees(s.value)}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
