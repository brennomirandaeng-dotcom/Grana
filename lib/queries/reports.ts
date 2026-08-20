import { prisma } from "@/lib/prisma";
import { round2 } from "@/lib/finance";
import type { Range } from "@/lib/queries/period";

export async function getExpensesByAccount(userId: string, range: Range) {
  const rows = await prisma.transaction.findMany({
    where: { userId, type: "EXPENSE", isInvoicePayment: false, status: "PAGO", date: { gte: range.from, lte: range.to } },
    include: { account: true, creditCard: true },
  });

  const map = new Map<string, { name: string; total: number }>();
  for (const t of rows) {
    const key = t.account?.id ?? t.creditCard?.id ?? "outros";
    const name = t.account?.name ?? (t.creditCard ? `${t.creditCard.name} (cartão)` : "Outros");
    const entry = map.get(key) ?? { name, total: 0 };
    entry.total = round2(entry.total + t.amount);
    map.set(key, entry);
  }
  return Array.from(map.values()).sort((a, b) => b.total - a.total);
}

export async function getExpensesByCard(userId: string, range: Range) {
  const rows = await prisma.transaction.groupBy({
    by: ["creditCardId"],
    where: { userId, type: "EXPENSE", isInvoicePayment: false, status: "PAGO", creditCardId: { not: null }, date: { gte: range.from, lte: range.to } },
    _sum: { amount: true },
  });
  const cards = await prisma.creditCard.findMany({ where: { userId } });
  const cardMap = Object.fromEntries(cards.map((c) => [c.id, c.name]));
  return rows.map((r) => ({ name: cardMap[r.creditCardId as string] ?? "—", total: round2(r._sum.amount ?? 0) })).sort((a, b) => b.total - a.total);
}

export async function getTopExpenses(userId: string, range: Range, limit = 10) {
  return prisma.transaction.findMany({
    where: { userId, type: "EXPENSE", isInvoicePayment: false, status: "PAGO", date: { gte: range.from, lte: range.to } },
    include: { category: true, account: true, creditCard: true },
    orderBy: { amount: "desc" },
    take: limit,
  });
}

export async function getRecurringExpensesSummary(userId: string) {
  const recurring = await prisma.recurringTransaction.findMany({
    where: { userId, active: true, type: "EXPENSE" },
    include: { category: true, account: true },
    orderBy: { amount: "desc" },
  });
  return recurring;
}
