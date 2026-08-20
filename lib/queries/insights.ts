import { prisma } from "@/lib/prisma";
import { round2 } from "@/lib/finance";
import { formatCurrency, formatMonthLabel, monthKey } from "@/lib/format";
import { getPeriodRange, percentChange } from "@/lib/queries/period";
import { getExpensesByCategory } from "@/lib/queries/dashboard";

export interface Insight {
  kind: "economia" | "evolucao" | "atencao" | "meta";
  emoji: string;
  title: string;
  message: string;
}

export async function getInsights(userId: string): Promise<Insight[]> {
  const insights: Insight[] = [];
  const now = new Date();
  const thisMonth = getPeriodRange("mes", now);
  const lastMonth = getPeriodRange("mes_anterior", now);

  const [thisMonthCats, lastMonthCats, goals] = await Promise.all([
    getExpensesByCategory(userId, thisMonth),
    getExpensesByCategory(userId, lastMonth),
    prisma.goal.findMany({ where: { userId, archived: false } }),
  ]);

  const [incomeAgg, expenseAgg, prevExpenseAgg] = await Promise.all([
    prisma.transaction.aggregate({ where: { userId, type: "INCOME", status: "PAGO", isInvoicePayment: false, date: { gte: thisMonth.from, lte: thisMonth.to } }, _sum: { amount: true } }),
    prisma.transaction.aggregate({ where: { userId, type: "EXPENSE", status: "PAGO", isInvoicePayment: false, date: { gte: thisMonth.from, lte: thisMonth.to } }, _sum: { amount: true } }),
    prisma.transaction.aggregate({ where: { userId, type: "EXPENSE", status: "PAGO", isInvoicePayment: false, date: { gte: lastMonth.from, lte: lastMonth.to } }, _sum: { amount: true } }),
  ]);

  const income = round2(incomeAgg._sum.amount ?? 0);
  const expense = round2(expenseAgg._sum.amount ?? 0);
  const prevExpense = round2(prevExpenseAgg._sum.amount ?? 0);
  const result = round2(income - expense);

  // Economia do mês
  if (result >= 0) {
    insights.push({
      kind: "economia",
      emoji: "💰",
      title: "Economia",
      message: `Você economizou ${formatCurrency(result)} este mês.`,
    });
  } else {
    insights.push({
      kind: "economia",
      emoji: "⚠️",
      title: "Atenção",
      message: `Suas despesas superaram as receitas em ${formatCurrency(Math.abs(result))} este mês.`,
    });
  }

  // Evolução das despesas
  const expenseChange = percentChange(expense, prevExpense);
  if (expenseChange !== null && prevExpense > 0) {
    insights.push({
      kind: "evolucao",
      emoji: expenseChange <= 0 ? "📉" : "📈",
      title: "Evolução",
      message: `Suas despesas ${expenseChange <= 0 ? "diminuíram" : "aumentaram"} ${Math.abs(expenseChange).toFixed(0)}% em relação ao mês anterior.`,
    });
  }

  // Categoria com maior alta
  let worstCategory: { name: string; change: number } | null = null;
  for (const cat of thisMonthCats.categories) {
    const prev = lastMonthCats.categories.find((c) => c.id === cat.id);
    const change = percentChange(cat.total, prev?.total ?? 0);
    if (change !== null && change > 15 && (!worstCategory || change > worstCategory.change)) {
      worstCategory = { name: cat.name, change };
    }
  }
  if (worstCategory) {
    insights.push({
      kind: "atencao",
      emoji: "⚠️",
      title: "Atenção",
      message: `Seus gastos com ${worstCategory.name} aumentaram ${worstCategory.change.toFixed(0)}%.`,
    });
  }

  // Projeção de meta
  const activeGoal = goals.find((g) => g.currentAmount < g.targetAmount);
  if (activeGoal && result > 0) {
    const remaining = activeGoal.targetAmount - activeGoal.currentAmount;
    const monthsNeeded = Math.ceil(remaining / result);
    const target = new Date(now.getFullYear(), now.getMonth() + monthsNeeded, 1);
    insights.push({
      kind: "meta",
      emoji: "🎯",
      title: "Meta",
      message: `Guardando ${formatCurrency(result)} por mês, você atingirá "${activeGoal.name}" em ${formatMonthLabel(monthKey(target))}.`,
    });
  }

  return insights;
}
