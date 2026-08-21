"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { investmentSchema, investmentWithdrawSchema, parseInput } from "@/lib/validations";
import { round2 } from "@/lib/finance";
import { z } from "zod";

export async function createInvestment(raw: z.infer<typeof investmentSchema>) {
  const user = await requireUser();
  const data = parseInput(investmentSchema, raw);
  await prisma.investment.create({
    data: {
      userId: user.id,
      name: data.name,
      category: data.category,
      investedAmount: data.investedAmount,
      currentAmount: data.currentAmount,
      date: new Date(data.date),
      notes: data.notes || null,
    },
  });
  revalidatePath("/", "layout");
}

export async function updateInvestment(id: string, raw: z.infer<typeof investmentSchema>) {
  const user = await requireUser();
  const data = parseInput(investmentSchema, raw);
  await prisma.investment.updateMany({
    where: { id, userId: user.id },
    data: {
      name: data.name,
      category: data.category,
      investedAmount: data.investedAmount,
      currentAmount: data.currentAmount,
      date: new Date(data.date),
      notes: data.notes || null,
    },
  });
  revalidatePath("/", "layout");
}

export async function deleteInvestment(id: string) {
  const user = await requireUser();
  await prisma.investment.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/", "layout");
}

/**
 * Resgate parcial ou total: reduz o investimento e credita a conta de destino.
 * Modelado como uma Transaction do tipo TRANSFER sem conta de origem (o
 * "de onde" é o investimento, não outra conta) — assim entra no saldo da
 * conta de destino sem contar como receita operacional (regra da seção 34).
 */
export async function withdrawInvestment(id: string, raw: z.infer<typeof investmentWithdrawSchema>) {
  const user = await requireUser();
  const data = parseInput(investmentWithdrawSchema, raw);

  const investment = await prisma.investment.findFirst({ where: { id, userId: user.id } });
  if (!investment) throw new Error("Investimento não encontrado");
  if (data.amount > investment.currentAmount) throw new Error("O valor do saque não pode ser maior que o valor atual do investimento");

  const account = await prisma.account.findFirst({ where: { id: data.accountId, userId: user.id } });
  if (!account) throw new Error("Conta inválida");

  const newCurrentAmount = round2(investment.currentAmount - data.amount);
  const ratio = investment.currentAmount > 0 ? newCurrentAmount / investment.currentAmount : 0;
  const newInvestedAmount = round2(investment.investedAmount * ratio);

  await prisma.$transaction([
    prisma.investment.update({
      where: { id },
      data: { currentAmount: newCurrentAmount, investedAmount: newInvestedAmount },
    }),
    prisma.transaction.create({
      data: {
        userId: user.id,
        type: "TRANSFER",
        description: `Resgate: ${investment.name}`,
        amount: data.amount,
        date: new Date(data.date),
        transferToAccountId: data.accountId,
        paymentMethod: "TRANSFERENCIA",
        status: "PAGO",
        notes: data.notes || null,
      },
    }),
  ]);

  revalidatePath("/", "layout");
}
