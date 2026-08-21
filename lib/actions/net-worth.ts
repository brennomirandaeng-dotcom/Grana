"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { assetSchema, liabilitySchema, parseInput } from "@/lib/validations";
import { z } from "zod";

export async function createAsset(raw: z.infer<typeof assetSchema>) {
  const user = await requireUser();
  const data = parseInput(assetSchema, raw);
  await prisma.asset.create({ data: { userId: user.id, name: data.name, type: data.type, value: data.value } });
  revalidatePath("/", "layout");
}

export async function updateAsset(id: string, raw: z.infer<typeof assetSchema>) {
  const user = await requireUser();
  const data = parseInput(assetSchema, raw);
  await prisma.asset.updateMany({ where: { id, userId: user.id }, data: { name: data.name, type: data.type, value: data.value } });
  revalidatePath("/", "layout");
}

export async function deleteAsset(id: string) {
  const user = await requireUser();
  await prisma.asset.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/", "layout");
}

export async function createLiability(raw: z.infer<typeof liabilitySchema>) {
  const user = await requireUser();
  const data = parseInput(liabilitySchema, raw);
  await prisma.liability.create({
    data: {
      userId: user.id,
      name: data.name,
      type: data.type,
      originalAmount: data.originalAmount,
      remainingAmount: data.remainingAmount,
      installmentsCount: data.installmentsCount || null,
      installmentsPaid: data.installmentsPaid ?? 0,
      interestRate: data.interestRate ?? null,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
    },
  });
  revalidatePath("/", "layout");
}

export async function updateLiability(id: string, raw: z.infer<typeof liabilitySchema>) {
  const user = await requireUser();
  const data = parseInput(liabilitySchema, raw);
  await prisma.liability.updateMany({
    where: { id, userId: user.id },
    data: {
      name: data.name,
      type: data.type,
      originalAmount: data.originalAmount,
      remainingAmount: data.remainingAmount,
      installmentsCount: data.installmentsCount || null,
      installmentsPaid: data.installmentsPaid ?? 0,
      interestRate: data.interestRate ?? null,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
    },
  });
  revalidatePath("/", "layout");
}

export async function deleteLiability(id: string) {
  const user = await requireUser();
  await prisma.liability.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/", "layout");
}

export async function recordNetWorthSnapshot(userId: string, netWorth: number, assets: number, liabilities: number) {
  const today = new Date();
  const dateKey = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  await prisma.netWorthSnapshot.upsert({
    where: { userId_date: { userId, date: dateKey } },
    create: { userId, date: dateKey, assets, liabilities, netWorth },
    update: { assets, liabilities, netWorth },
  });
}
