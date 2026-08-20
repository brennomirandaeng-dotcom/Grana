"use client";
import * as React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { formatCurrency } from "@/lib/format";
import { percentChange } from "@/lib/queries/period";
import { EmptyState } from "@/components/shared/empty-state";
import { PieChart as PieIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CategorySlice {
  id: string;
  name: string;
  color: string;
  total: number;
  percent: number;
  count: number;
}

export function CategoryBreakdown({
  categories,
  previousTotals,
}: {
  categories: CategorySlice[];
  previousTotals: Record<string, number>;
}) {
  const [selected, setSelected] = React.useState<string | null>(null);

  if (categories.length === 0) {
    return <EmptyState icon={PieIcon} title="Nenhuma despesa no período" description="Registre despesas para ver a distribuição por categoria." />;
  }

  const active = categories.find((c) => c.id === selected) ?? categories[0];
  const prevValue = previousTotals[active.id] ?? 0;
  const change = percentChange(active.total, prevValue);

  return (
    <div className="grid sm:grid-cols-[minmax(0,220px)_1fr] gap-6 items-center">
      <div className="relative">
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={categories}
              dataKey="total"
              nameKey="name"
              innerRadius={62}
              outerRadius={90}
              paddingAngle={2}
              onClick={(d: any) => setSelected(d.id)}
              cursor="pointer"
            >
              {categories.map((c) => (
                <Cell key={c.id} fill={c.color} opacity={active.id === c.id ? 1 : 0.55} stroke="var(--surface)" strokeWidth={2} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => formatCurrency(Number(value))} contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 13 }} />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-xs text-muted-foreground">Total</span>
          <span className="text-lg font-semibold">{formatCurrency(categories.reduce((s, c) => s + c.total, 0))}</span>
        </div>
      </div>

      <div className="space-y-4">
        <div className="rounded-xl bg-surface-muted p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: active.color }} />
            <p className="text-sm font-medium text-foreground">{active.name}</p>
          </div>
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Valor total</p>
              <p className="font-semibold">{formatCurrency(active.total)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">% do período</p>
              <p className="font-semibold">{active.percent.toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Lançamentos</p>
              <p className="font-semibold">{active.count}</p>
            </div>
          </div>
          {change !== null && (
            <p className={cn("mt-2 text-xs font-medium", change <= 0 ? "text-positive" : "text-negative")}>
              {change >= 0 ? "+" : ""}
              {change.toFixed(0)}% em relação ao período anterior
            </p>
          )}
        </div>

        <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelected(c.id)}
              className={cn(
                "flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-sm hover:bg-surface-muted transition-colors",
                active.id === c.id && "bg-surface-muted"
              )}
            >
              <span className="flex items-center gap-2 text-foreground">
                <span className="h-2 w-2 rounded-full" style={{ background: c.color }} />
                {c.name}
              </span>
              <span className="text-muted-foreground tabular-nums">{formatCurrency(c.total)}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
