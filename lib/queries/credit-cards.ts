import { prisma } from "@/lib/prisma";
import { round2 } from "@/lib/finance";
import { monthKey } from "@/lib/format";
import { transactionInclude } from "@/lib/queries/transactions";
import type { Workspace } from "@/lib/constants";

/**
 * `invoiceMonth` opcional seleciona de qual fatura mostrar o "Valor da
 * fatura" (padrão: mês atual) — totalDebt/available continuam refletindo a
 * dívida em aberto geral do cartão, independente do mês filtrado.
 */
export async function getCreditCardsWithUsage(userId: string, workspace: Workspace, invoiceMonth?: string) {
  const cards = await prisma.creditCard.findMany({ where: { userId, workspace }, orderBy: { createdAt: "asc" } });
  const targetMonth = invoiceMonth ?? monthKey(new Date());

  const [purchases, payments, openTransactions] = await Promise.all([
    prisma.transaction.groupBy({ by: ["creditCardId"], where: { userId, workspace, creditCardId: { not: null }, isInvoicePayment: false }, _sum: { amount: true } }),
    prisma.invoicePayment.groupBy({ by: ["creditCardId"], where: { userId, workspace }, _sum: { amountPaid: true } }),
    prisma.transaction.findMany({
      where: { userId, workspace, creditCardId: { not: null }, isInvoicePayment: false },
      select: { creditCardId: true, invoiceMonth: true, amount: true },
    }),
  ]);

  const purchaseMap = Object.fromEntries(purchases.map((p) => [p.creditCardId as string, p._sum.amount ?? 0]));
  const paymentMap = Object.fromEntries(payments.map((p) => [p.creditCardId, p._sum.amountPaid ?? 0]));

  return cards.map((c) => {
    const totalDebt = round2((purchaseMap[c.id] ?? 0) - (paymentMap[c.id] ?? 0));
    const invoiceTotal = round2(
      openTransactions
        .filter((t) => t.creditCardId === c.id && t.invoiceMonth === targetMonth)
        .reduce((sum, t) => sum + t.amount, 0)
    );
    return {
      ...c,
      totalDebt,
      invoiceTotal,
      available: round2(c.limitAmount - totalDebt),
    };
  });
}

export async function getCardInvoice(userId: string, workspace: Workspace, creditCardId: string, invoiceMonth: string) {
  const [purchases, payment] = await Promise.all([
    prisma.transaction.findMany({
      where: { userId, workspace, creditCardId, invoiceMonth, isInvoicePayment: false },
      include: transactionInclude,
      orderBy: { date: "desc" },
    }),
    prisma.invoicePayment.findUnique({ where: { creditCardId_invoiceMonth: { creditCardId, invoiceMonth } } }),
  ]);

  const total = round2(purchases.reduce((sum, t) => sum + t.amount, 0));
  const amountPaid = payment?.amountPaid ?? 0;
  const paid = !!payment && amountPaid >= total;
  const partiallyPaid = !!payment && !paid;

  return { purchases, total, payment, paid, partiallyPaid, amountPaid, remaining: round2(total - amountPaid) };
}

export async function getTotalCardDebt(userId: string, workspace: Workspace) {
  const cards = await getCreditCardsWithUsage(userId, workspace);
  return round2(cards.reduce((sum, c) => sum + c.totalDebt, 0));
}
