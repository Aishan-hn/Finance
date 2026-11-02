"use client";

import { Pie, PieChart, Tooltip } from "recharts";
import type { CategoryTotal } from "@/lib/finance";
import { formatUSD } from "@/lib/format";

// Validated categorical palette; the order is part of its colorblind safety.
const SLOTS = [
  "#2a78d6",
  "#eb6834",
  "#1baf7a",
  "#eda100",
  "#e87ba4",
  "#008300",
  "#6250d6",
  "#e34948",
];
const OTHER_COLOR = "#a3a29c";
const MAX_SEGMENTS = 5;

/**
 * Colors come from all-time rank, so a category keeps its color from month to
 * month. A category ranked past the palette takes the first free slot.
 */
function buildSegments(month: CategoryTotal[], allTime: CategoryTotal[]) {
  const top = month.slice(0, MAX_SEGMENTS);
  const rest = month.slice(MAX_SEGMENTS);
  const rankOf = (category: string) =>
    allTime.findIndex((c) => c.category === category);

  const used = new Set(top.map((c) => rankOf(c.category)));
  const free = SLOTS.map((_, i) => i).filter((i) => !used.has(i));

  const segments = top.map(({ category, total }) => {
    const rank = rankOf(category);
    const slot = rank < SLOTS.length ? rank : free.shift()!;
    return { name: category, value: total, fill: SLOTS[slot] };
  });

  if (rest.length > 0) {
    segments.push({
      name: rest.length === 1 ? rest[0].category : "Other categories",
      value: rest.reduce((sum, c) => sum + c.total, 0),
      fill: OTHER_COLOR,
    });
  }
  return segments;
}

export function ExpenseChart({
  month,
  allTime,
}: {
  month: CategoryTotal[];
  allTime: CategoryTotal[];
}) {
  const segments = buildSegments(month, allTime);
  const total = segments.reduce((sum, s) => sum + s.value, 0);

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row sm:gap-10">
      <div className="relative size-[220px] shrink-0">
        <PieChart width={220} height={220} accessibilityLayer={false}>
          <Pie
            data={segments}
            dataKey="value"
            nameKey="name"
            innerRadius={72}
            outerRadius={104}
            startAngle={90}
            endAngle={-270}
            stroke="var(--card)"
            strokeWidth={2}
            isAnimationActive={false}
          />
          <Tooltip formatter={(value) => formatUSD(Number(value))} />
        </PieChart>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xs text-muted-foreground">Total</span>
          <span className="text-lg font-semibold">{formatUSD(total)}</span>
        </div>
      </div>
      <ul className="w-full space-y-2 text-sm">
        {segments.map((segment) => (
          <li key={segment.name} className="flex items-center gap-2">
            <span
              className="size-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: segment.fill }}
              aria-hidden
            />
            <span className="min-w-0 flex-1 truncate">{segment.name}</span>
            <span className="tabular-nums">{formatUSD(segment.value)}</span>
            <span className="w-11 text-right text-muted-foreground tabular-nums">
              {Math.round((segment.value / total) * 100)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
