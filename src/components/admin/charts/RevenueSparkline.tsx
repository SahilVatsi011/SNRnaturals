"use client";

import { Area, AreaChart, ResponsiveContainer, Tooltip } from "recharts";
import type { DailyPoint } from "@/lib/analytics";
import { rupees } from "@/lib/analytics";

export default function RevenueSparkline({ data }: { data: DailyPoint[] }) {
  if (data.length === 0) return null;

  return (
    <div className="h-20 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 4, right: 0, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#059669" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#059669" stopOpacity={0} />
            </linearGradient>
          </defs>
          <Tooltip
            formatter={(value) => rupees(Number(value ?? 0))}
            labelFormatter={(label) => String(label)}
            contentStyle={{
              borderRadius: 8,
              border: "1px solid #e7e5e4",
              fontSize: 12,
            }}
          />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="#059669"
            strokeWidth={1.5}
            fill="url(#sparkFill)"
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
