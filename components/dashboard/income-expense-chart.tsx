"use client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { formatCompactCurrency, formatCurrency } from "@/lib/format";

interface DataPoint {
  label: string;
  receitas: number;
  despesas: number;
  saldo: number;
}

export function IncomeExpenseChart({ data }: { data: DataPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} barGap={4}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
        <YAxis tickLine={false} axisLine={false} tickFormatter={(v) => formatCompactCurrency(v)} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} width={64} />
        <Tooltip
          formatter={(value, name) => [formatCurrency(Number(value)), String(name)]}
          contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 13 }}
          labelStyle={{ color: "var(--foreground)" }}
        />
        <Legend wrapperStyle={{ fontSize: 13 }} formatter={(value) => (value === "receitas" ? "Receitas" : value === "despesas" ? "Despesas" : "Saldo")} />
        <Bar dataKey="receitas" fill="var(--positive)" radius={[4, 4, 0, 0]} maxBarSize={28} />
        <Bar dataKey="despesas" fill="var(--negative)" radius={[4, 4, 0, 0]} maxBarSize={28} />
      </BarChart>
    </ResponsiveContainer>
  );
}
