"use client";

interface ContributionDay {
  date: string;
  count: number;
}

const CELL_SIZE = 11;
const GAP = 3;
const WEEKS = 52;
const DAYS = 7;

function getColor(count: number): string {
  if (count === 0) return "var(--graph-0)";
  if (count <= 2) return "var(--graph-1)";
  if (count <= 5) return "var(--graph-2)";
  if (count <= 8) return "var(--graph-3)";
  return "var(--graph-4)";
}

function getMonthLabels(startDate: Date): { label: string; x: number }[] {
  const months: { label: string; x: number }[] = [];
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  let lastMonth = -1;

  for (let week = 0; week < WEEKS; week++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + week * 7);
    if (d.getMonth() !== lastMonth) {
      lastMonth = d.getMonth();
      months.push({ label: monthNames[lastMonth], x: week * (CELL_SIZE + GAP) });
    }
  }
  return months;
}

export default function ContributionGraph({ data }: { data: ContributionDay[] }) {
  const now = new Date();
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - WEEKS * 7);
  const dayOfWeek = startDate.getDay();
  startDate.setDate(startDate.getDate() - dayOfWeek);

  const dataMap = new Map(data.map((d) => [d.date, d.count]));
  const months = getMonthLabels(startDate);
  const totalContributions = data.reduce((sum, d) => sum + d.count, 0);

  const svgWidth = WEEKS * (CELL_SIZE + GAP) + 28;
  const svgHeight = DAYS * (CELL_SIZE + GAP) + 28;

  return (
    <div>
      <div className="mb-2 text-[10px] font-mono text-foreground-muted">
        {totalContributions} contributions in the last year
      </div>
      <div className="overflow-x-auto rounded-lg border border-border bg-surface p-3">
        <svg width={svgWidth} height={svgHeight} className="block">
          {months.map((m, i) => (
            <text
              key={i}
              x={m.x + 28}
              y={9}
              fill="hsl(var(--foreground-muted))"
              fontSize={9}
              fontFamily="var(--font-geist-mono), monospace"
            >
              {m.label}
            </text>
          ))}

          {["Mon", "", "Wed", "", "Fri", "", ""].map((label, i) => (
            label && (
              <text
                key={i}
                x={0}
                y={17 + i * (CELL_SIZE + GAP) + CELL_SIZE - 2}
                fill="hsl(var(--foreground-muted))"
                fontSize={8}
                fontFamily="var(--font-geist-mono), monospace"
              >
                {label}
              </text>
            )
          ))}

          {Array.from({ length: WEEKS }, (_, week) =>
            Array.from({ length: DAYS }, (_, day) => {
              const d = new Date(startDate);
              d.setDate(d.getDate() + week * 7 + day);
              if (d > now) return null;
              const dateStr = d.toISOString().split("T")[0];
              const count = dataMap.get(dateStr) || 0;

              return (
                <rect
                  key={`${week}-${day}`}
                  x={28 + week * (CELL_SIZE + GAP)}
                  y={16 + day * (CELL_SIZE + GAP)}
                  width={CELL_SIZE}
                  height={CELL_SIZE}
                  rx={2}
                  fill={getColor(count)}
                  className="transition-colors"
                >
                  <title>{`${dateStr}: ${count} contribution${count !== 1 ? "s" : ""}`}</title>
                </rect>
              );
            })
          )}
        </svg>

        <div className="mt-1.5 flex items-center justify-end gap-1 text-[9px] font-mono text-foreground-muted">
          Less
          {[0, 1, 2, 3, 4].map((level) => (
            <div
              key={level}
              className="h-[11px] w-[11px] rounded-sm"
              style={{ backgroundColor: `var(--graph-${level})` }}
            />
          ))}
          More
        </div>
      </div>
    </div>
  );
}
