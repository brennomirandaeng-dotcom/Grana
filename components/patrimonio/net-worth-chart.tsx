"use client";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { formatCompactCurrency, formatCurrency } from "@/lib/format";

export function NetWorthChart({ data }: { data: { label: string; netWorth: number }[] }) {
  if (data.length < 2) {
    return <p className="text-sm text-muted-foreground py-10 text-center">O histórico de evolução do patrimônio será construído conforme você usa o app.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="netWorthGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--positive)" stopOpacity={0.3} />
            <stop offset="95%" stopColor="var(--positive)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
        <YAxis tickLine={false} axisLine={false} tickFormatter={(v) => formatCompactCurrency(v)} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} width={64} />
        <Tooltip formatter={(value) => formatCurrency(Number(value))} contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 13 }} />
        <Area type="monotone" dataKey="netWorth" stroke="var(--positive)" fill="url(#netWorthGradient)" strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
