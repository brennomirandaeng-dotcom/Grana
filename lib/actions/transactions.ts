"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { transactionSchema, parseInput } from "@/lib/validations";
import { getInvoiceMonth, splitInstallments, addMonthsToKey } from "@/lib/finance";
import { z } from "zod";

type TransactionInput = z.infer<typeof transactionSchema> & { creditCardId?: string | null };

function addPeriod(date: Date, frequency: "SEMANAL" | "QUINZENAL" | "MENSAL" | "ANUAL", steps: number) {
  const d = new Date(date);
  switch (frequency) {
    case "SEMANAL":
      d.setDate(d.getDate() + 7 * steps);
      break;
    case "QUINZENAL":
      d.setDate(d.getDate() + 14 * steps);
      break;
    case "MENSAL":
      d.setMonth(d.getMonth() + steps);
      break;
    case "ANUAL":
      d.setFullYear(d.getFullYear() + steps);
      break;
  }
  return d;
}

export async function createTransaction(raw: TransactionInput) {
  const user = await requireUser();
  const data = parseInput(transactionSchema, raw);

  let creditCardId: string | null = null;
  let invoiceMonth: string | null = null;
  let accountId: string | null = data.accountId ?? null;

  if (data.paymentMethod === "CREDITO" && raw.creditCardId) {
    const card = await prisma.creditCard.findFirst({ where: { id: raw.creditCardId, userId: user.id } });
    if (!card) throw new Error("Cartão inválido");
    creditCardId = card.id;
    invoiceMonth = getInvoiceMonth(new Date(data.date), card.closingDay, card.dueDay);
    accountId = null; // compra no cartão não afeta saldo da conta
  }

  if (data.type === "TRANSFER") {
    if (!data.accountId || !data.transferToAccountId) throw new Error("Selecione as contas de origem e destino");
    if (data.accountId === data.transferToAccountId) throw new Error("As contas de origem e destino devem ser diferentes");
  }

  // Compra parcelada no cartão: divide o valor em N faturas futuras, em vez
  // de lançar um único registro (mutuamente exclusivo com recorrência).
  if (creditCardId && data.isInstallment && data.installmentsCount && data.installmentsCount > 1) {
    const purchaseDate = new Date(data.date);
    const purchase = await prisma.installmentPurchase.create({
      data: {
        userId: user.id,
        creditCardId,
        description: data.description,
        totalAmount: data.amount,
        installmentsCount: data.installmentsCount,
        categoryId: data.categoryId || null,
        purchaseDate,
      },
    });

    const parts = splitInstallments(data.amount, data.installmentsCount);
    const firstInvoiceMonth = invoiceMonth!;

    await prisma.$transaction(
      parts.map((amount, idx) =>
        prisma.transaction.create({
          data: {
            userId: user.id,
            type: "EXPENSE",
            description: `${data.description} ${idx + 1}/${data.installmentsCount}`,
            amount,
            date: addPeriod(purchaseDate, "MENSAL", idx),
            categoryId: data.categoryId || null,
            creditCardId,
            invoiceMonth: addMonthsToKey(firstInvoiceMonth, idx),
            installmentPurchaseId: purchase.id,
            installmentNumber: idx + 1,
            paymentMethod: "CREDITO",
            status: data.status,
            notes: data.notes || null,
          },
        })
      )
    );

    revalidatePath("/", "layout");
    return;
  }

  let recurringId: string | null = null;
  const occurrenceDates: Date[] = [new Date(data.date)];

  if (data.isRecurring && data.recurrence) {
    const { frequency, endDate, occurrences } = data.recurrence;
    const recurring = await prisma.recurringTransaction.create({
      data: {
        userId: user.id,
        description: data.description,
        amount: data.amount,
        type: data.type,
        categoryId: data.categoryId || null,
        accountId,
        frequency,
        startDate: new Date(data.date),
        endDate: endDate ? new Date(endDate) : null,
        occurrences: occurrences ?? null,
        dayOfMonth: new Date(data.date).getDate(),
        active: true,
      },
    });
    recurringId = recurring.id;

    const maxOccurrences = Math.min(occurrences ?? 36, 60);
    for (let i = 1; i < maxOccurrences; i++) {
      const next = addPeriod(new Date(data.date), frequency, i);
      if (endDate && next > new Date(endDate)) break;
      occurrenceDates.push(next);
    }
  }

  await prisma.$transaction(
    occurrenceDates.map((date) =>
      prisma.transaction.create({
        data: {
          userId: user.id,
          type: data.type,
          description: data.description,
          amount: data.amount,
          date,
          categoryId: data.categoryId || null,
          accountId: data.type === "TRANSFER" ? data.accountId : accountId,
          transferToAccountId: data.type === "TRANSFER" ? data.transferToAccountId : null,
          paymentMethod: data.paymentMethod,
          status: data.status,
          notes: data.notes || null,
          creditCardId,
          invoiceMonth,
          recurringTransactionId: recurringId,
        },
      })
    )
  );

  revalidatePath("/", "layout");
}

export async function updateTransaction(id: string, raw: TransactionInput) {
  const user = await requireUser();
  const data = parseInput(transactionSchema, raw);
  const existing = await prisma.transaction.findFirst({ where: { id, userId: user.id } });
  if (!existing) throw new Error("Lançamento não encontrado");

  let creditCardId: string | null = null;
  let invoiceMonth: string | null = null;
  let accountId: string | null = data.accountId ?? null;
  let card: { closingDay: number; dueDay: number } | null = null;

  if (data.paymentMethod === "CREDITO" && raw.creditCardId) {
    const found = await prisma.creditCard.findFirst({ where: { id: raw.creditCardId, userId: user.id } });
    if (!found) throw new Error("Cartão inválido");
    card = found;
    creditCardId = found.id;
    invoiceMonth = getInvoiceMonth(new Date(data.date), found.closingDay, found.dueDay);
    accountId = null;
  }

  const newDate = new Date(data.date);

  await prisma.$transaction(async (tx) => {
    await tx.transaction.update({
      where: { id },
      data: {
        type: data.type,
        description: data.description,
        amount: data.amount,
        date: newDate,
        categoryId: data.categoryId || null,
        accountId: data.type === "TRANSFER" ? data.accountId : accountId,
        transferToAccountId: data.type === "TRANSFER" ? data.transferToAccountId : null,
        paymentMethod: data.paymentMethod,
        status: data.status,
        notes: data.notes || null,
        creditCardId,
        invoiceMonth,
      },
    });

    // Compra parcelada: ao mudar a data de uma parcela, desloca as demais
    // parcelas da mesma compra pelo mesmo número de meses, preservando o
    // espaçamento original entre elas (ex: 1ª de 01/02 pra 01/05 -> 2ª
    // que era 01/03 vai pra 01/06).
    if (existing.installmentPurchaseId && card) {
      const deltaMonths = (newDate.getFullYear() - existing.date.getFullYear()) * 12 + (newDate.getMonth() - existing.date.getMonth());
      if (deltaMonths !== 0) {
        const siblings = await tx.transaction.findMany({
          where: { installmentPurchaseId: existing.installmentPurchaseId, userId: user.id, id: { not: id } },
        });
        for (const sibling of siblings) {
          const siblingDate = addPeriod(sibling.date, "MENSAL", deltaMonths);
          await tx.transaction.update({
            where: { id: sibling.id },
            data: { date: siblingDate, invoiceMonth: getInvoiceMonth(siblingDate, card.closingDay, card.dueDay) },
          });
        }
      }
    }
  });

  revalidatePath("/", "layout");
}

export async function deleteTransaction(id: string) {
  const user = await requireUser();
  await prisma.transaction.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/", "layout");
}

export async function toggleTransactionStatus(id: string, status: "PAGO" | "PENDENTE" | "AGENDADO") {
  const user = await requireUser();
  await prisma.transaction.updateMany({ where: { id, userId: user.id }, data: { status } });
  revalidatePath("/", "layout");
}
