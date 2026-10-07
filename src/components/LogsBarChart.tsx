"use client";

import { useState } from "react";
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { CHART_COLORS } from "@/lib/chart-colors";

export interface LogsBarChartDatum {
  timestamp: string;
  error_count: number;
  warning_count: number;
  ok_count: number;
}

function formatDate(ts: string) {
  const d = new Date(ts);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric" });
}

function ChartTooltipContent({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; fill: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const filtered = payload.filter((p) => p.value > 0);
  if (!filtered.length) return null;

  return (
    <div className="rounded-md border border-border bg-surface px-3 py-2 text-xs shadow-lg">
      <p className="mb-1 font-mono text-foreground-lighter">{label ? formatDate(label) : ""}</p>
      {filtered.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: entry.fill }} />
          <span className="text-foreground-light">
            {entry.name === "ok_count" ? "Ok" : entry.name === "error_count" ? "Errors" : "Warnings"}
          </span>
          <span className="ml-auto font-mono text-foreground">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

export default function LogsBarChart({
  data,
  height = 64,
}: {
  data: LogsBarChartDatum[];
  height?: number;
}) {
  const [focusIndex, setFocusIndex] = useState<number | null>(null);

  if (!data.length) {
    return (
      <div className="flex items-center justify-center text-xs text-foreground-muted" style={{ height }}>
        No traffic
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
        onMouseMove={(e: any) => {
          if (e.activeTooltipIndex !== focusIndex) setFocusIndex(e.activeTooltipIndex);
        }}
        onMouseLeave={() => setFocusIndex(null)}
      >
        <YAxis hide />
        <XAxis dataKey="timestamp" hide />
        <Tooltip
          content={<ChartTooltipContent />}
          cursor={false}
          animationDuration={0}
        />

        <Bar dataKey="error_count" stackId="stack" maxBarSize={24}>
          {data.map((_, i) => (
            <Cell
              key={i}
              fill={focusIndex === i || focusIndex === null ? CHART_COLORS.RED_1 : CHART_COLORS.RED_2}
              className="cursor-pointer transition-colors"
            />
          ))}
        </Bar>

        <Bar dataKey="warning_count" stackId="stack" maxBarSize={24}>
          {data.map((_, i) => (
            <Cell
              key={i}
              fill={focusIndex === i || focusIndex === null ? CHART_COLORS.YELLOW_1 : CHART_COLORS.YELLOW_2}
              className="cursor-pointer transition-colors"
            />
          ))}
        </Bar>

        <Bar dataKey="ok_count" stackId="stack" maxBarSize={24}>
          {data.map((_, i) => (
            <Cell
              key={i}
              fill={focusIndex === i || focusIndex === null ? CHART_COLORS.BRAND_1 : CHART_COLORS.BRAND_2}
              className="cursor-pointer transition-colors"
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
