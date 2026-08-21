"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { categorySchema, parseInput } from "@/lib/validations";
import { z } from "zod";

export async function createCategory(raw: z.infer<typeof categorySchema>) {
  const user = await requireUser();
  const data = parseInput(categorySchema, raw);
  await prisma.category.create({
    data: {
      userId: user.id,
      name: data.name,
      kind: data.kind,
      icon: data.icon || "Circle",
      color: data.color || "#6366f1",
      parentId: data.parentId || null,
    },
  });
  revalidatePath("/", "layout");
}

export async function updateCategory(id: string, raw: z.infer<typeof categorySchema>) {
  const user = await requireUser();
  const data = parseInput(categorySchema, raw);
  await prisma.category.updateMany({
    where: { id, userId: user.id },
    data: {
      name: data.name,
      kind: data.kind,
      icon: data.icon || "Circle",
      color: data.color || "#6366f1",
      parentId: data.parentId || null,
    },
  });
  revalidatePath("/", "layout");
}

export async function deleteCategory(id: string) {
  const user = await requireUser();
  const [txCount, childCount] = await Promise.all([
    prisma.transaction.count({ where: { userId: user.id, categoryId: id } }),
    prisma.category.count({ where: { userId: user.id, parentId: id } }),
  ]);
  if (txCount > 0) throw new Error("Esta categoria possui lançamentos vinculados.");
  if (childCount > 0) throw new Error("Exclua ou mova as subcategorias primeiro.");
  await prisma.category.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/", "layout");
}
