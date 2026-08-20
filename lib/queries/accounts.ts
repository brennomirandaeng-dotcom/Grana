import { prisma } from "@/lib/prisma";
import { round2 } from "@/lib/finance";

export async function getAccountsWithBalance(userId: string) {
  const accounts = await prisma.account.findMany({ where: { userId }, orderBy: { createdAt: "asc" } });

  const [incomes, expenses, transfersOut, transfersIn] = await Promise.all([
    prisma.transaction.groupBy({ by: ["accountId"], where: { userId, type: "INCOME", status: "PAGO", accountId: { not: null } }, _sum: { amount: true } }),
    prisma.transaction.groupBy({ by: ["accountId"], where: { userId, type: "EXPENSE", status: "PAGO", accountId: { not: null } }, _sum: { amount: true } }),
    prisma.transaction.groupBy({ by: ["accountId"], where: { userId, type: "TRANSFER", status: "PAGO", accountId: { not: null } }, _sum: { amount: true } }),
    prisma.transaction.groupBy({ by: ["transferToAccountId"], where: { userId, type: "TRANSFER", status: "PAGO", transferToAccountId: { not: null } }, _sum: { amount: true } }),
  ]);

  const toMap = (rows: Record<string, unknown>[], key: string): Record<string, number> =>
    Object.fromEntries(rows.map((r) => [r[key] as string, ((r._sum as { amount: number | null }).amount) ?? 0]));

  const incomeMap = toMap(incomes, "accountId");
  const expenseMap = toMap(expenses, "accountId");
  const outMap = toMap(transfersOut, "accountId");
  const inMap = toMap(transfersIn, "transferToAccountId");

  return accounts.map((a) => ({
    ...a,
    balance: round2(a.initialBalance + (incomeMap[a.id] ?? 0) - (expenseMap[a.id] ?? 0) - (outMap[a.id] ?? 0) + (inMap[a.id] ?? 0)),
  }));
}

export async function getAccountTransactionCounts(userId: string) {
  const rows = await prisma.transaction.groupBy({ by: ["accountId"], where: { userId, accountId: { not: null } }, _count: { _all: true } });
  return Object.fromEntries(rows.map((r) => [r.accountId as string, r._count._all]));
}
