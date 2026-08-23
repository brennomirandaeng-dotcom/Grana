"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { expectedIncomeSchema, confirmExpectedIncomeSchema, parseInput } from "@/lib/validations";
import { z } from "zod";

export async function createExpectedIncome(raw: z.infer<typeof expectedIncomeSchema>) {
  const user = await requireUser();
  const data = parseInput(expectedIncomeSchema, raw);
  await prisma.expectedIncome.create({
    data: {
      userId: user.id,
      description: data.description,
      amount: data.amount,
      date: new Date(data.date),
    },
  });
  revalidatePath("/", "layout");
}

export async function updateExpectedIncome(id: string, raw: z.infer<typeof expectedIncomeSchema>) {
  const user = await requireUser();
  const data = parseInput(expectedIncomeSchema, raw);
  const existing = await prisma.expectedIncome.findFirst({ where: { id, userId: user.id } });
  if (!existing) throw new Error("Receita prevista não encontrada");
  if (existing.confirmed) throw new Error("Não é possível editar uma receita já confirmada");

  await prisma.expectedIncome.update({
    where: { id },
    data: { description: data.description, amount: data.amount, date: new Date(data.date) },
  });
  revalidatePath("/", "layout");
}

export async function deleteExpectedIncome(id: string) {
  const user = await requireUser();
  const existing = await prisma.expectedIncome.findFirst({ where: { id, userId: user.id } });
  if (!existing) throw new Error("Receita prevista não encontrada");

  await prisma.$transaction(async (tx) => {
    await tx.expectedIncome.delete({ where: { id } });
    if (existing.transactionId) {
      await tx.transaction.deleteMany({ where: { id: existing.transactionId, userId: user.id } });
    }
  });
  revalidatePath("/", "layout");
}

export async function confirmExpectedIncome(id: string, raw: z.infer<typeof confirmExpectedIncomeSchema>) {
  const user = await requireUser();
  const data = parseInput(confirmExpectedIncomeSchema, raw);
  const existing = await prisma.expectedIncome.findFirst({ where: { id, userId: user.id } });
  if (!existing) throw new Error("Receita prevista não encontrada");
  if (existing.confirmed) throw new Error("Receita já confirmada");

  const account = await prisma.account.findFirst({ where: { id: data.accountId, userId: user.id } });
  if (!account) throw new Error("Conta inválida");

  const receivedDate = new Date(data.receivedDate);

  await prisma.$transaction(async (tx) => {
    const transaction = await tx.transaction.create({
      data: {
        userId: user.id,
        type: "INCOME",
        description: existing.description,
        amount: existing.amount,
        date: receivedDate,
        accountId: account.id,
        paymentMethod: "TRANSFERENCIA",
        status: "PAGO",
      },
    });
    await tx.expectedIncome.update({
      where: { id },
      data: { confirmed: true, confirmedDate: receivedDate, transactionId: transaction.id },
    });
  });

  revalidatePath("/", "layout");
}
