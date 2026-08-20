"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { accountSchema, transferSchema } from "@/lib/validations";
import { z } from "zod";

export async function createAccount(raw: z.infer<typeof accountSchema>) {
  const user = await requireUser();
  const data = accountSchema.parse(raw);
  await prisma.account.create({
    data: {
      userId: user.id,
      name: data.name,
      institution: data.institution || null,
      type: data.type,
      initialBalance: data.initialBalance,
      color: data.color || "#10b981",
    },
  });
  revalidatePath("/", "layout");
}

export async function updateAccount(id: string, raw: z.infer<typeof accountSchema>) {
  const user = await requireUser();
  const data = accountSchema.parse(raw);
  await prisma.account.updateMany({
    where: { id, userId: user.id },
    data: {
      name: data.name,
      institution: data.institution || null,
      type: data.type,
      initialBalance: data.initialBalance,
      color: data.color || "#10b981",
    },
  });
  revalidatePath("/", "layout");
}

export async function archiveAccount(id: string, archived: boolean) {
  const user = await requireUser();
  await prisma.account.updateMany({ where: { id, userId: user.id }, data: { archived } });
  revalidatePath("/", "layout");
}

export async function deleteAccount(id: string) {
  const user = await requireUser();
  const count = await prisma.transaction.count({ where: { userId: user.id, OR: [{ accountId: id }, { transferToAccountId: id }] } });
  if (count > 0) {
    throw new Error("Esta conta possui lançamentos vinculados. Arquive-a em vez de excluir.");
  }
  await prisma.account.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/", "layout");
}

export async function createTransfer(raw: z.infer<typeof transferSchema>) {
  const user = await requireUser();
  const data = transferSchema.parse(raw);
  if (data.fromAccountId === data.toAccountId) throw new Error("As contas de origem e destino devem ser diferentes");

  await prisma.transaction.create({
    data: {
      userId: user.id,
      type: "TRANSFER",
      description: "Transferência entre contas",
      amount: data.amount,
      date: new Date(data.date),
      accountId: data.fromAccountId,
      transferToAccountId: data.toAccountId,
      paymentMethod: "TRANSFERENCIA",
      status: "PAGO",
      notes: data.notes || null,
    },
  });
  revalidatePath("/", "layout");
}
