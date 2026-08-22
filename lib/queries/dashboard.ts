import { prisma } from "@/lib/prisma";
import { round2 } from "@/lib/finance";
import { monthKey, formatMonthLabel } from "@/lib/format";
import { type Range, getPreviousRange } from "@/lib/queries/period";
import { subMonths, startOfMonth, endOfMonth } from "date-fns";

async function sumByType(userId: string, type: "INCOME" | "EXPENSE", range: Range, onlyPaid = true) {
  const result = await prisma.transaction.aggregate({
    where: { userId, type, isInvoicePayment: false, ...(onlyPaid ? { status: "PAGO" } : {}), date: { gte: range.from, lte: range.to } },
    _sum: { amount: true },
  });
  return round2(result._sum.amount ?? 0);
}

/**
 * income/expense/result continuam considerando só o que está "Pago" (usado
 * por Relatórios). expenseAll soma despesas lançadas independente do status
 * (Pago, Pendente, Agendado) — usado pelo Dashboard, que quer mostrar o
 * total comprometido do período, não só o já efetivamente pago.
 */
export async function getPeriodSummary(userId: string, range: Range) {
  const prevRange = getPreviousRange(range);

  const [income, expense, expenseAll, prevIncome, prevExpense] = await Promise.all([
    sumByType(userId, "INCOME", range),
    sumByType(userId, "EXPENSE", range),
    sumByType(userId, "EXPENSE", range, false),
    sumByType(userId, "INCOME", prevRange),
    sumByType(userId, "EXPENSE", prevRange),
  ]);

  return {
    income,
    expense,
    expenseAll,
    result: round2(income - expense),
    prevIncome,
    prevExpense,
    prevResult: round2(prevIncome - prevExpense),
  };
}

export async function getMonthlySeries(userId: string, months = 8, expenseAllStatuses = false) {
  const now = new Date();
  const rangeFrom = startOfMonth(subMonths(now, months - 1));
  const rangeTo = endOfMonth(now);

  // Uma única consulta para a janela inteira (em vez de uma consulta por mês)
  // — evita N round-trips sequenciais contra o banco. Receitas sempre só
  // "Pago"; despesas incluem todos os status quando expenseAllStatuses.
  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      isInvoicePayment: false,
      date: { gte: rangeFrom, lte: rangeTo },
      OR: [
        { type: "INCOME", status: "PAGO" },
        { type: "EXPENSE", ...(expenseAllStatuses ? {} : { status: "PAGO" }) },
      ],
    },
    select: { type: true, amount: true, date: true },
  });

  const buckets = new Map<string, { income: number; expense: number }>();
  for (const t of transactions) {
    const key = monthKey(t.date);
    const bucket = buckets.get(key) ?? { income: 0, expense: 0 };
    if (t.type === "INCOME") bucket.income += t.amount;
    else bucket.expense += t.amount;
    buckets.set(key, bucket);
  }

  const series: { month: string; label: string; receitas: number; despesas: number; saldo: number }[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const ref = subMonths(now, i);
    const key = monthKey(ref);
    const bucket = buckets.get(key) ?? { income: 0, expense: 0 };
    const income = round2(bucket.income);
    const expense = round2(bucket.expense);
    series.push({ month: key, label: formatMonthLabel(key), receitas: income, despesas: expense, saldo: round2(income - expense) });
  }

  return series;
}

export async function getExpensesByCategory(userId: string, range: Range, allStatuses = false) {
  const transactions = await prisma.transaction.findMany({
    where: { userId, type: "EXPENSE", isInvoicePayment: false, ...(allStatuses ? {} : { status: "PAGO" }), date: { gte: range.from, lte: range.to } },
    include: { category: true },
  });

  const map = new Map<string, { id: string; name: string; color: string; total: number; count: number }>();
  let totalExpense = 0;

  for (const t of transactions) {
    totalExpense += t.amount;
    const key = t.category?.id ?? "sem-categoria";
    const name = t.category?.name ?? "Sem categoria";
    const color = t.category?.color ?? "#94a3b8";
    const entry = map.get(key) ?? { id: key, name, color, total: 0, count: 0 };
    entry.total = round2(entry.total + t.amount);
    entry.count += 1;
    map.set(key, entry);
  }

  const categories = Array.from(map.values())
    .sort((a, b) => b.total - a.total)
    .map((c) => ({ ...c, percent: totalExpense > 0 ? round2((c.total / totalExpense) * 100) : 0 }));

  return { categories, totalExpense: round2(totalExpense) };
}

export async function getUpcomingItems(userId: string, days = 14) {
  const from = new Date();
  const to = new Date();
  to.setDate(to.getDate() + days);

  return prisma.transaction.findMany({
    where: { userId, status: { in: ["PENDENTE", "AGENDADO"] }, date: { gte: from, lte: to } },
    include: { category: true, account: true, creditCard: true, installmentPurchase: true, transferToAccount: true },
    orderBy: { date: "asc" },
    take: 8,
  });
}

/**
 * Total de despesas ainda não pagas (Pendente ou Agendado), sem limite de
 * data — inclui vencidas e futuras.
 */
export async function getPendingExpensesTotal(userId: string) {
  const result = await prisma.transaction.aggregate({
    where: { userId, type: "EXPENSE", isInvoicePayment: false, status: { in: ["PENDENTE", "AGENDADO"] } },
    _sum: { amount: true },
  });
  return round2(result._sum.amount ?? 0);
}
