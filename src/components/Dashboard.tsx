"use client";

import { RefreshCw } from "lucide-react";
import { useState } from "react";
import ServiceHealthTable from "./ServiceHealthTable";

export default function Dashboard() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div />
        <div className="flex items-center gap-2">
          <button
            onClick={() => setRefreshKey((k) => k + 1)}
            className="flex items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground-light transition-colors hover:bg-surface-200 hover:text-foreground"
          >
            <RefreshCw size={12} />
            Refresh
          </button>
          <div className="rounded-md border border-border bg-surface px-3 py-1.5 text-xs text-foreground-lighter">
            Last 24 hours
          </div>
        </div>
      </div>

      <ServiceHealthTable key={refreshKey} />
    </div>
  );
}
