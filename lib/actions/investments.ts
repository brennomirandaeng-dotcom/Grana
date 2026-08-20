"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { investmentSchema } from "@/lib/validations";
import { z } from "zod";

export async function createInvestment(raw: z.infer<typeof investmentSchema>) {
  const user = await requireUser();
  const data = investmentSchema.parse(raw);
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
  const data = investmentSchema.parse(raw);
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
