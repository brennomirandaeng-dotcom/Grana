import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export const transactionInclude = {
  category: true,
  account: true,
  transferToAccount: true,
  creditCard: true,
  installmentPurchase: true,
} satisfies Prisma.TransactionInclude;

export type TransactionWithRelations = Prisma.TransactionGetPayload<{ include: typeof transactionInclude }>;

export interface TransactionFilters {
  from?: Date;
  to?: Date;
  type?: string;
  categoryId?: string;
  accountId?: string;
  creditCardId?: string;
  status?: string;
  query?: string;
  minAmount?: number;
  maxAmount?: number;
}

export type TransactionSortField = "date" | "amount" | "description" | "category" | "account" | "status";
export type SortDirection = "asc" | "desc";

export async function getTransactions(
  userId: string,
  filters: TransactionFilters = {},
  sort: { field: TransactionSortField; direction: SortDirection } = { field: "date", direction: "desc" }
): Promise<TransactionWithRelations[]> {
  const where: Prisma.TransactionWhereInput = {
    userId,
    ...(filters.from || filters.to
      ? { date: { ...(filters.from ? { gte: filters.from } : {}), ...(filters.to ? { lte: filters.to } : {}) } }
      : {}),
    ...(filters.type ? { type: filters.type } : {}),
    ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
    ...(filters.accountId ? { accountId: filters.accountId } : {}),
    ...(filters.creditCardId ? { creditCardId: filters.creditCardId } : {}),
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.minAmount !== undefined ? { amount: { gte: filters.minAmount } } : {}),
    ...(filters.maxAmount !== undefined ? { amount: { ...(filters.minAmount !== undefined ? { gte: filters.minAmount } : {}), lte: filters.maxAmount } } : {}),
    ...(filters.query
      ? {
          OR: [
            { description: { contains: filters.query, mode: "insensitive" } },
            { notes: { contains: filters.query, mode: "insensitive" } },
            { category: { name: { contains: filters.query, mode: "insensitive" } } },
            { account: { name: { contains: filters.query, mode: "insensitive" } } },
          ],
        }
      : {}),
  };

  let orderBy: Prisma.TransactionOrderByWithRelationInput = { date: sort.direction };
  if (sort.field === "amount") orderBy = { amount: sort.direction };
  else if (sort.field === "description") orderBy = { description: sort.direction };
  else if (sort.field === "category") orderBy = { category: { name: sort.direction } };
  else if (sort.field === "account") orderBy = { account: { name: sort.direction } };
  else if (sort.field === "status") orderBy = { status: sort.direction };

  return prisma.transaction.findMany({
    where,
    include: transactionInclude,
    orderBy: [orderBy, { createdAt: "desc" }],
  });
}

export async function getTransactionById(userId: string, id: string) {
  return prisma.transaction.findFirst({ where: { id, userId }, include: transactionInclude });
}
