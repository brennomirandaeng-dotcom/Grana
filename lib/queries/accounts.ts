import { prisma } from "@/lib/prisma";
import { round2 } from "@/lib/finance";
import { transactionInclude } from "@/lib/queries/transactions";
import type { Workspace } from "@/lib/constants";

export async function getAccountsWithBalance(userId: string, workspace: Workspace) {
  const accounts = await prisma.account.findMany({ where: { userId, workspace }, orderBy: { createdAt: "asc" } });

  const [incomes, expenses, transfersOut, transfersIn] = await Promise.all([
    prisma.transaction.groupBy({ by: ["accountId"], where: { userId, workspace, type: "INCOME", status: "PAGO", accountId: { not: null } }, _sum: { amount: true } }),
    prisma.transaction.groupBy({ by: ["accountId"], where: { userId, workspace, type: "EXPENSE", status: "PAGO", accountId: { not: null } }, _sum: { amount: true } }),
    prisma.transaction.groupBy({ by: ["accountId"], where: { userId, workspace, type: "TRANSFER", status: "PAGO", accountId: { not: null } }, _sum: { amount: true } }),
    prisma.transaction.groupBy({ by: ["transferToAccountId"], where: { userId, workspace, type: "TRANSFER", status: "PAGO", transferToAccountId: { not: null } }, _sum: { amount: true } }),
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

export async function getAccountTransactionCounts(userId: string, workspace: Workspace) {
  const rows = await prisma.transaction.groupBy({ by: ["accountId"], where: { userId, workspace, accountId: { not: null } }, _count: { _all: true } });
  return Object.fromEntries(rows.map((r) => [r.accountId as string, r._count._all]));
}

// Lançamentos que entraram ou saíram de uma conta: os que têm a conta como
// origem (accountId) e as transferências que a têm como destino
// (transferToAccountId) — uma transferência recebida não grava accountId.
export async function getAccountTransactions(userId: string, workspace: Workspace, accountId: string) {
  return prisma.transaction.findMany({
    where: { userId, workspace, OR: [{ accountId }, { transferToAccountId: accountId }] },
    include: transactionInclude,
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
  });
}
