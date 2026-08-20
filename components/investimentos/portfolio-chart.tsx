"use client";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { formatCurrency } from "@/lib/format";
import { INVESTMENT_CATEGORIES } from "@/lib/constants";

const CATEGORY_COLORS: Record<string, string> = {
  RENDA_FIXA: "#0ea5e9",
  TESOURO_DIRETO: "#10b981",
  CDB: "#6366f1",
  LCI_LCA: "#14b8a6",
  ACOES: "#f97316",
  FIIS: "#f59e0b",
  ETF: "#8b5cf6",
  CRIPTO: "#ec4899",
  OUTROS: "#64748b",
};

export function PortfolioChart({ data }: { data: { category: string; total: number }[] }) {
  const chartData = data.map((d) => ({ name: INVESTMENT_CATEGORIES[d.category as keyof typeof INVESTMENT_CATEGORIES] ?? d.category, value: d.total, color: CATEGORY_COLORS[d.category] ?? "#94a3b8" }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie data={chartData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90} paddingAngle={2}>
          {chartData.map((d, i) => (
            <Cell key={i} fill={d.color} stroke="var(--surface)" strokeWidth={2} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => formatCurrency(Number(value))} contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 13 }} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
