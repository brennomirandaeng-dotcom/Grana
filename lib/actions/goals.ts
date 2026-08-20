"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { goalSchema, goalContributionSchema } from "@/lib/validations";
import { round2 } from "@/lib/finance";
import { z } from "zod";

export async function createGoal(raw: z.infer<typeof goalSchema>) {
  const user = await requireUser();
  const data = goalSchema.parse(raw);
  const goal = await prisma.goal.create({
    data: {
      userId: user.id,
      name: data.name,
      targetAmount: data.targetAmount,
      currentAmount: data.currentAmount ?? 0,
      deadline: data.deadline ? new Date(data.deadline) : null,
      color: data.color || "#f59e0b",
      icon: data.icon || "Target",
    },
  });
  if (data.currentAmount && data.currentAmount > 0) {
    await prisma.goalContribution.create({ data: { goalId: goal.id, amount: data.currentAmount, type: "DEPOSIT", note: "Aporte inicial" } });
  }
  revalidatePath("/", "layout");
}

export async function updateGoal(id: string, raw: z.infer<typeof goalSchema>) {
  const user = await requireUser();
  const data = goalSchema.parse(raw);
  await prisma.goal.updateMany({
    where: { id, userId: user.id },
    data: { name: data.name, targetAmount: data.targetAmount, deadline: data.deadline ? new Date(data.deadline) : null, color: data.color || "#f59e0b", icon: data.icon || "Target" },
  });
  revalidatePath("/", "layout");
}

export async function archiveGoal(id: string, archived: boolean) {
  const user = await requireUser();
  await prisma.goal.updateMany({ where: { id, userId: user.id }, data: { archived } });
  revalidatePath("/", "layout");
}

export async function deleteGoal(id: string) {
  const user = await requireUser();
  await prisma.goal.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/", "layout");
}

export async function addGoalContribution(goalId: string, raw: z.infer<typeof goalContributionSchema>) {
  const user = await requireUser();
  const data = goalContributionSchema.parse(raw);
  const goal = await prisma.goal.findFirst({ where: { id: goalId, userId: user.id } });
  if (!goal) throw new Error("Meta não encontrada");

  if (data.type === "WITHDRAW" && data.amount > goal.currentAmount) {
    throw new Error("Valor de retirada maior que o disponível na meta");
  }

  const delta = data.type === "DEPOSIT" ? data.amount : -data.amount;

  await prisma.$transaction([
    prisma.goalContribution.create({ data: { goalId, amount: data.amount, type: data.type, note: data.note || null } }),
    prisma.goal.update({ where: { id: goalId }, data: { currentAmount: round2(goal.currentAmount + delta) } }),
  ]);

  revalidatePath("/", "layout");
}
