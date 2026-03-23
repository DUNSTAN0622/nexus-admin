"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { RevenueChartDatum } from "@/types/analytics";

type RevenueChartProps = {
  chartData?: RevenueChartDatum[] | null;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("zh-TW", {
    style: "currency",
    currency: "TWD",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function RevenueChart({
  chartData = [],
}: RevenueChartProps) {
  const resolvedChartData =
    chartData && chartData.length > 0
      ? chartData
      : [{ name: "本期", total: 0 }];

  return (
    <div className="h-[360px] rounded-[24px] border border-white/8 bg-slate-950/55 p-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={resolvedChartData}
          margin={{ top: 12, right: 8, left: 4, bottom: 0 }}
        >
          <CartesianGrid stroke="rgba(148,163,184,0.12)" vertical={false} />
          <XAxis
            dataKey="name"
            tickLine={false}
            axisLine={false}
            tick={{ fill: "#94a3b8", fontSize: 12 }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fill: "#64748b", fontSize: 12 }}
            tickFormatter={(value: number) =>
              `${Math.round(value / 1000).toLocaleString("zh-TW")}k`
            }
          />
          <Tooltip
            cursor={{ fill: "rgba(255,255,255,0.04)" }}
            contentStyle={{
              backgroundColor: "rgba(2, 6, 23, 0.96)",
              border: "1px solid rgba(34, 211, 238, 0.18)",
              borderRadius: "18px",
              boxShadow: "0 16px 48px rgba(6, 182, 212, 0.12)",
            }}
            labelStyle={{ color: "#e2e8f0", fontWeight: 600 }}
            itemStyle={{ color: "#67e8f9" }}
            formatter={(value) =>
              [
                formatCurrency(
                  typeof value === "number" ? value : Number(value ?? 0),
                ),
                "預估營收",
              ] as [string, string]
            }
          />
          <Bar
            dataKey="total"
            fill="#00bcd4"
            radius={[14, 14, 6, 6]}
            maxBarSize={48}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
