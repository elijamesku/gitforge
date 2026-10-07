"use client";

import { useEffect, useState } from "react";
import { ChevronRight } from "lucide-react";
import LogsBarChart, { type LogsBarChartDatum } from "./LogsBarChart";

type ServiceKey = "git_ops" | "storage" | "api" | "auth" | "webhooks" | "realtime";

interface ServiceConfig {
  key: ServiceKey;
  name: string;
  description: string;
}

interface ServiceData {
  total: number;
  errorRate: number;
  errorCount: number;
  warningCount: number;
  chartData: LogsBarChartDatum[];
}

const SERVICES: ServiceConfig[] = [
  { key: "git_ops", name: "Git Operations", description: "Push, pull, clone, and fetch operations" },
  { key: "api", name: "API Gateway", description: "Incoming API requests" },
  { key: "storage", name: "Storage", description: "Object storage for repositories" },
  { key: "auth", name: "Auth", description: "Authentication and access control" },
  { key: "webhooks", name: "Webhooks", description: "Event-driven notifications" },
  { key: "realtime", name: "Realtime", description: "Live updates and subscriptions" },
];

function getHealthColor(errorRate: number, total: number): string {
  if (total === 0) return "muted";
  if (errorRate > 0) return "destructive";
  return "brand";
}

const colorClassMap: Record<string, string> = {
  muted: "bg-foreground-muted",
  destructive: "bg-destructive",
  warning: "bg-warning",
  brand: "bg-brand",
};

function formatPercent(value: number) {
  return value >= 1 ? `${value.toFixed(1)}%` : `${value.toFixed(2)}%`;
}

function getSubtitle(data: ServiceData) {
  if (data.total === 0) return "";
  if (data.errorRate > 0) return `${formatPercent(data.errorRate)} errors`;
  const warningRate = data.total > 0 ? (data.warningCount / data.total) * 100 : 0;
  if (warningRate > 0) return `${formatPercent(warningRate)} warnings`;
  return `${data.total.toLocaleString()} requests`;
}

function generateChartData(base: number, errorPct: number = 0): LogsBarChartDatum[] {
  const now = Date.now();
  return Array.from({ length: 24 }, (_, i) => {
    const total = Math.max(0, Math.floor(base + (Math.random() - 0.5) * base * 0.8));
    const errors = Math.floor(total * errorPct * Math.random());
    const warnings = Math.floor(total * 0.02 * Math.random());
    return {
      timestamp: new Date(now - (23 - i) * 3600000).toISOString(),
      error_count: errors,
      warning_count: warnings,
      ok_count: Math.max(0, total - errors - warnings),
    };
  });
}

function ServiceCell({
  service,
  data,
  className = "",
}: {
  service: ServiceConfig;
  data: ServiceData;
  className?: string;
}) {
  const color = getHealthColor(data.errorRate, data.total);

  return (
    <div className={`group relative px-5 pt-3 pb-4 transition-colors hover:bg-surface-200 ${className}`}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <div className={`h-1.5 w-1.5 shrink-0 rounded-full ${colorClassMap[color] || "bg-foreground-muted"}`} />
          <h3 className="m-0 truncate font-mono text-xs font-medium uppercase text-foreground-light">
            {service.name}
          </h3>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`truncate text-xs ${data.total === 0 ? "text-foreground-lighter" : "text-foreground"}`}>
            {getSubtitle(data)}
          </span>
          <button className="shrink-0 rounded p-0.5 text-foreground-muted transition-colors group-hover:text-foreground">
            <ChevronRight size={14} strokeWidth={1.5} />
          </button>
        </div>
      </div>
      <div className="h-16">
        <LogsBarChart data={data.chartData} height={64} />
      </div>
    </div>
  );
}

export default function ServiceHealthTable() {
  const [serviceData, setServiceData] = useState<Record<string, ServiceData>>({});

  useEffect(() => {
    const data: Record<string, ServiceData> = {};
    for (const svc of SERVICES) {
      const base = svc.key === "git_ops" ? 40 : svc.key === "api" ? 60 : Math.floor(Math.random() * 30 + 5);
      const errorPct = svc.key === "auth" ? 0.01 : 0;
      const chartData = generateChartData(base, errorPct);
      const total = chartData.reduce((s, d) => s + d.ok_count + d.error_count + d.warning_count, 0);
      const errorCount = chartData.reduce((s, d) => s + d.error_count, 0);
      const warningCount = chartData.reduce((s, d) => s + d.warning_count, 0);
      data[svc.key] = {
        total,
        errorRate: total > 0 ? (errorCount / total) * 100 : 0,
        errorCount,
        warningCount,
        chartData,
      };
    }
    setServiceData(data);
  }, []);

  return (
    <div>
      <h2 className="mb-4 text-sm font-medium text-foreground">Service Health</h2>
      <div className="overflow-hidden rounded-lg border border-border bg-surface">
        <div className="grid grid-cols-1 md:grid-cols-2">
          {SERVICES.map((service, index) => {
            const data = serviceData[service.key];
            if (!data) return null;

            const isFirst = index === 0;
            const isLeftColumn = !isFirst && (index - 1) % 2 === 0;
            const restCount = SERVICES.length - 1;
            const lastRowCount = restCount % 2 === 0 ? 2 : 1;
            const isInLastRow = !isFirst && index >= SERVICES.length - lastRowCount;

            return (
              <ServiceCell
                key={service.key}
                service={service}
                data={data}
                className={[
                  "border-b border-border",
                  isFirst ? "md:col-span-2" : "",
                  isInLastRow ? "md:border-b-0" : "",
                  isLeftColumn ? "md:border-r" : "",
                ].join(" ")}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
