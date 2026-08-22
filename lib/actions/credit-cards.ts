"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { creditCardSchema, installmentPurchaseSchema, parseInput } from "@/lib/validations";
import { getInvoiceMonth, splitInstallments, addMonthsToKey, dueMonthOffset, round2 } from "@/lib/finance";
import { z } from "zod";

export async function createCreditCard(raw: z.infer<typeof creditCardSchema>) {
  const user = await requireUser();
  const data = parseInput(creditCardSchema, raw);
  await prisma.creditCard.create({
    data: {
      userId: user.id,
      name: data.name,
      bank: data.bank,
      limitAmount: data.limitAmount,
      closingDay: data.closingDay,
      dueDay: data.dueDay,
      brand: data.brand || "outro",
      color: data.color || "#8b5cf6",
    },
  });
  revalidatePath("/", "layout");
}

export async function updateCreditCard(id: string, raw: z.infer<typeof creditCardSchema>) {
  const user = await requireUser();
  const data = parseInput(creditCardSchema, raw);
  await prisma.creditCard.updateMany({
    where: { id, userId: user.id },
    data: {
      name: data.name,
      bank: data.bank,
      limitAmount: data.limitAmount,
      closingDay: data.closingDay,
      dueDay: data.dueDay,
      brand: data.brand || "outro",
      color: data.color || "#8b5cf6",
    },
  });
  revalidatePath("/", "layout");
}

export async function archiveCreditCard(id: string, archived: boolean) {
  const user = await requireUser();
  await prisma.creditCard.updateMany({ where: { id, userId: user.id }, data: { archived } });
  revalidatePath("/", "layout");
}

export async function deleteCreditCard(id: string) {
  const user = await requireUser();
  const count = await prisma.transaction.count({ where: { userId: user.id, creditCardId: id } });
  if (count > 0) throw new Error("Este cartão possui compras vinculadas. Arquive-o em vez de excluir.");
  await prisma.creditCard.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/", "layout");
}

export async function createInstallmentPurchase(raw: z.infer<typeof installmentPurchaseSchema>) {
  const user = await requireUser();
  const data = parseInput(installmentPurchaseSchema, raw);
  const card = await prisma.creditCard.findFirst({ where: { id: data.creditCardId, userId: user.id } });
  if (!card) throw new Error("Cartão inválido");

  const purchaseDate = new Date(data.purchaseDate);
  const purchase = await prisma.installmentPurchase.create({
    data: {
      userId: user.id,
      creditCardId: data.creditCardId,
      description: data.description,
      totalAmount: data.totalAmount,
      installmentsCount: data.installmentsCount,
      categoryId: data.categoryId || null,
      purchaseDate,
    },
  });

  const parts = splitInstallments(data.totalAmount, data.installmentsCount);
  const firstInvoiceMonth = getInvoiceMonth(purchaseDate, card.closingDay, card.dueDay);

  await prisma.$transaction(
    parts.map((amount, idx) =>
      prisma.transaction.create({
        data: {
          userId: user.id,
          type: "EXPENSE",
          description: data.installmentsCount > 1 ? `${data.description} ${idx + 1}/${data.installmentsCount}` : data.description,
          amount,
          date: purchaseDate,
          categoryId: data.categoryId || null,
          creditCardId: data.creditCardId,
          invoiceMonth: addMonthsToKey(firstInvoiceMonth, idx),
          installmentPurchaseId: purchase.id,
          installmentNumber: idx + 1,
          paymentMethod: "CREDITO",
          status: "PAGO",
        },
      })
    )
  );

  revalidatePath("/", "layout");
}

/**
 * Recalcula o mês de fatura (invoiceMonth) dos lançamentos já existentes com
 * a fórmula corrigida, que agora considera o dia de vencimento além do dia
 * de fechamento. Só altera cartões em que isso muda algo (vencimento no mês
 * seguinte ao fechamento) e só corrige o que ainda estiver desatualizado —
 * seguro de rodar mais de uma vez (idempotente).
 */
export async function recalculateInvoiceMonths(): Promise<number> {
  const user = await requireUser();
  const cards = await prisma.creditCard.findMany({ where: { userId: user.id } });

  let fixedCount = 0;

  for (const card of cards) {
    const transactions = await prisma.transaction.findMany({
      where: { userId: user.id, creditCardId: card.id, isInvoicePayment: false },
      select: { id: true, date: true, invoiceMonth: true },
    });

    const corrections = transactions
      .map((t) => ({ id: t.id, oldMonth: t.invoiceMonth, newMonth: getInvoiceMonth(t.date, card.closingDay, card.dueDay) }))
      .filter((t) => t.oldMonth !== t.newMonth);

    if (corrections.length === 0) continue;

    const offset = dueMonthOffset(card.closingDay, card.dueDay);
    const payments = await prisma.invoicePayment.findMany({
      where: { userId: user.id, creditCardId: card.id },
      select: { id: true, invoiceMonth: true },
    });
    // O deslocamento é sempre positivo aqui — processar do mês mais recente
    // para o mais antigo evita colidir com a constraint única
    // (creditCardId, invoiceMonth) enquanto os registros ainda não migrados
    // ocupam o mês de destino.
    payments.sort((a, b) => (a.invoiceMonth < b.invoiceMonth ? 1 : -1));

    await prisma.$transaction([
      ...corrections.map((c) => prisma.transaction.update({ where: { id: c.id }, data: { invoiceMonth: c.newMonth } })),
      ...payments.map((p) => prisma.invoicePayment.update({ where: { id: p.id }, data: { invoiceMonth: addMonthsToKey(p.invoiceMonth, offset) } })),
    ]);

    fixedCount += corrections.length;
  }

  if (fixedCount > 0) revalidatePath("/", "layout");
  return fixedCount;
}

/**
 * Registra o pagamento de uma fatura. Se o valor pago (somado a eventuais
 * pagamentos parciais anteriores da mesma fatura) não cobrir o total da
 * fatura, ela e seus lançamentos continuam como estão — não são marcados
 * como pagos — e o pagamento fica registrado como parcial, permitindo
 * complementar depois.
 */
export async function payInvoice(creditCardId: string, invoiceMonth: string, accountId: string, amount: number, paidDate: string) {
  const user = await requireUser();
  const card = await prisma.creditCard.findFirst({ where: { id: creditCardId, userId: user.id } });
  if (!card) throw new Error("Cartão inválido");
  if (amount <= 0) throw new Error("Informe um valor válido");

  const [{ _sum }, existing] = await Promise.all([
    prisma.transaction.aggregate({
      where: { userId: user.id, creditCardId, invoiceMonth, isInvoicePayment: false },
      _sum: { amount: true },
    }),
    prisma.invoicePayment.findUnique({ where: { creditCardId_invoiceMonth: { creditCardId, invoiceMonth } } }),
  ]);
  const total = round2(_sum.amount ?? 0);
  const alreadyPaid = existing?.amountPaid ?? 0;
  if (existing && alreadyPaid >= total) throw new Error("Esta fatura já foi paga");

  const newTotalPaid = round2(alreadyPaid + amount);
  const fullyPaid = newTotalPaid >= total;

  await prisma.$transaction([
    prisma.invoicePayment.upsert({
      where: { creditCardId_invoiceMonth: { creditCardId, invoiceMonth } },
      create: { userId: user.id, creditCardId, invoiceMonth, amountPaid: newTotalPaid, paidDate: new Date(paidDate), accountId },
      update: { amountPaid: newTotalPaid, paidDate: new Date(paidDate), accountId },
    }),
    prisma.transaction.create({
      data: {
        userId: user.id,
        type: "EXPENSE",
        description: fullyPaid ? `Pagamento fatura ${card.name}` : `Pagamento parcial fatura ${card.name}`,
        amount,
        date: new Date(paidDate),
        accountId,
        paymentMethod: "TRANSFERENCIA",
        status: "PAGO",
        isInvoicePayment: true,
        invoicePaymentCardId: creditCardId,
      },
    }),
    ...(fullyPaid
      ? [prisma.transaction.updateMany({ where: { userId: user.id, creditCardId, invoiceMonth, isInvoicePayment: false }, data: { status: "PAGO" } })]
      : []),
  ]);

  revalidatePath("/", "layout");
}
