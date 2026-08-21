"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { creditCardSchema, installmentPurchaseSchema, parseInput } from "@/lib/validations";
import { getInvoiceMonth, splitInstallments, addMonthsToKey } from "@/lib/finance";
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
  const firstInvoiceMonth = getInvoiceMonth(purchaseDate, card.closingDay);

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

export async function payInvoice(creditCardId: string, invoiceMonth: string, accountId: string, amount: number, paidDate: string) {
  const user = await requireUser();
  const card = await prisma.creditCard.findFirst({ where: { id: creditCardId, userId: user.id } });
  if (!card) throw new Error("Cartão inválido");

  const existing = await prisma.invoicePayment.findUnique({ where: { creditCardId_invoiceMonth: { creditCardId, invoiceMonth } } });
  if (existing) throw new Error("Esta fatura já foi paga");

  await prisma.$transaction([
    prisma.invoicePayment.create({
      data: { userId: user.id, creditCardId, invoiceMonth, amountPaid: amount, paidDate: new Date(paidDate), accountId },
    }),
    prisma.transaction.create({
      data: {
        userId: user.id,
        type: "EXPENSE",
        description: `Pagamento fatura ${card.name}`,
        amount,
        date: new Date(paidDate),
        accountId,
        paymentMethod: "TRANSFERENCIA",
        status: "PAGO",
        isInvoicePayment: true,
        invoicePaymentCardId: creditCardId,
      },
    }),
  ]);

  revalidatePath("/", "layout");
}
