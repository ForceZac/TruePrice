"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { CostBreakdownResult } from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  breakdown: CostBreakdownResult;
}

// ─── Segment config ───────────────────────────────────────────────────────────

const SEGMENTS = [
  { key: "materialCostCents", label: "Materials", color: "#6366f1" },
  { key: "laborCostCents",    label: "Labor",     color: "#10b981" },
  { key: "overheadCostCents", label: "Overhead",  color: "#f59e0b" },
  { key: "shippingCostCents", label: "Shipping",  color: "#3b82f6" },
] as const;

// ─── Formatter ────────────────────────────────────────────────────────────────

function centsToUsd(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CostBreakdownChart({ breakdown }: Props) {
  const data = SEGMENTS.map(({ key, label, color }) => ({
    name: label,
    value: breakdown[key],
    color,
  })).filter((d) => d.value > 0);

  if (data.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-6">
        No cost data available.
      </p>
    );
  }

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={240}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius="80%"
            innerRadius="50%"
            paddingAngle={2}
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) =>
              typeof value === "number" ? centsToUsd(value) : String(value)
            }
            contentStyle={{
              background: "hsl(var(--popover))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "0.5rem",
              fontSize: "0.875rem",
            }}
          />
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: "0.75rem", paddingTop: "0.5rem" }}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Total + breakdown summary below chart */}
      <dl className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm mt-3">
        {data.map(({ name, value, color }) => (
          <>
            <dt key={`dt-${name}`} className="flex items-center gap-1.5 text-muted-foreground">
              <span
                className="inline-block h-2 w-2 rounded-full shrink-0"
                style={{ backgroundColor: color }}
                aria-hidden="true"
              />
              {name}
            </dt>
            <dd key={`dd-${name}`} className="text-right font-medium tabular-nums">
              {centsToUsd(value)}
            </dd>
          </>
        ))}
        <dt className="col-span-2 border-t border-border pt-1.5 mt-0.5 font-semibold">
          Total estimated cost
        </dt>
        <dd className="col-span-2 border-t border-border pt-1.5 mt-0.5 text-right font-bold tabular-nums">
          {centsToUsd(breakdown.totalCostCents)}
        </dd>
      </dl>
    </div>
  );
}
