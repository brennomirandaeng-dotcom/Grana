"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { budgetSchema, parseInput } from "@/lib/validations";
import { z } from "zod";

export async function upsertBudget(raw: z.infer<typeof budgetSchema>) {
  try {
    const user = await requireUser();
    const data = parseInput(budgetSchema, raw);
    await prisma.budget.upsert({
      where: { categoryId_month: { categoryId: data.categoryId, month: data.month } },
      create: { userId: user.id, categoryId: data.categoryId, month: data.month, limit: data.limit },
      update: { limit: data.limit },
    });
    revalidatePath("/", "layout");
  } catch (err) {
    if (err instanceof Error) return { error: err.message };
    throw err;
  }
}

export async function deleteBudget(id: string) {
  try {
    const user = await requireUser();
    await prisma.budget.deleteMany({ where: { id, userId: user.id } });
    revalidatePath("/", "layout");
  } catch (err) {
    if (err instanceof Error) return { error: err.message };
    throw err;
  }
}
