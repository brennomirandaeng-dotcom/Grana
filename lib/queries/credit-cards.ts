import { prisma } from "@/lib/prisma";
import { round2 } from "@/lib/finance";

export async function getCreditCardsWithUsage(userId: string) {
  const cards = await prisma.creditCard.findMany({ where: { userId }, orderBy: { createdAt: "asc" } });

  const [purchases, payments] = await Promise.all([
    prisma.transaction.groupBy({ by: ["creditCardId"], where: { userId, creditCardId: { not: null }, isInvoicePayment: false }, _sum: { amount: true } }),
    prisma.invoicePayment.groupBy({ by: ["creditCardId"], where: { userId }, _sum: { amountPaid: true } }),
  ]);

  const purchaseMap = Object.fromEntries(purchases.map((p) => [p.creditCardId as string, p._sum.amount ?? 0]));
  const paymentMap = Object.fromEntries(payments.map((p) => [p.creditCardId, p._sum.amountPaid ?? 0]));

  return cards.map((c) => {
    const totalDebt = round2((purchaseMap[c.id] ?? 0) - (paymentMap[c.id] ?? 0));
    return {
      ...c,
      totalDebt,
      available: round2(c.limitAmount - totalDebt),
    };
  });
}

export async function getCardInvoice(userId: string, creditCardId: string, invoiceMonth: string) {
  const [purchases, payment] = await Promise.all([
    prisma.transaction.findMany({
      where: { userId, creditCardId, invoiceMonth, isInvoicePayment: false },
      include: { category: true, installmentPurchase: true },
      orderBy: { date: "desc" },
    }),
    prisma.invoicePayment.findUnique({ where: { creditCardId_invoiceMonth: { creditCardId, invoiceMonth } } }),
  ]);

  const total = round2(purchases.reduce((sum, t) => sum + t.amount, 0));
  return { purchases, total, payment, paid: !!payment };
}

export async function getTotalCardDebt(userId: string) {
  const cards = await getCreditCardsWithUsage(userId);
  return round2(cards.reduce((sum, c) => sum + c.totalDebt, 0));
}
