import { prisma } from "@/lib/prisma";
import { round2 } from "@/lib/finance";

export async function getBudgetsWithSpent(userId: string, month: string) {
  const [year, m] = month.split("-").map(Number);
  const from = new Date(year, m - 1, 1);
  const to = new Date(year, m, 0, 23, 59, 59);

  const [budgets, spentRows] = await Promise.all([
    prisma.budget.findMany({ where: { userId, month }, include: { category: true } }),
    prisma.transaction.groupBy({
      by: ["categoryId"],
      where: { userId, type: "EXPENSE", isInvoicePayment: false, status: "PAGO", date: { gte: from, lte: to }, categoryId: { not: null } },
      _sum: { amount: true },
    }),
  ]);

  const spentMap = Object.fromEntries(spentRows.map((r) => [r.categoryId as string, r._sum.amount ?? 0]));

  return budgets.map((b) => {
    const spent = round2(spentMap[b.categoryId] ?? 0);
    const percent = b.limit > 0 ? round2((spent / b.limit) * 100) : 0;
    return { ...b, spent, percent, remaining: round2(b.limit - spent) };
  });
}
