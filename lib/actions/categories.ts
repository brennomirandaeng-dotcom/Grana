"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { categorySchema, parseInput } from "@/lib/validations";
import { z } from "zod";

export async function createCategory(raw: z.infer<typeof categorySchema>) {
  try {
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
  } catch (err) {
    if (err instanceof Error) return { error: err.message };
    throw err;
  }
}

export async function updateCategory(id: string, raw: z.infer<typeof categorySchema>) {
  try {
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
  } catch (err) {
    if (err instanceof Error) return { error: err.message };
    throw err;
  }
}

/**
 * Corrige subcategorias cujo "kind" ficou diferente do kind da categoria
 * pai (bug anterior: o modal de categoria sempre abria na aba "Despesa" ao
 * criar uma subcategoria, mesmo quando o pai era uma categoria de Receita,
 * fazendo essas subcategorias aparecerem erradamente ao lançar despesas).
 * Uma subcategoria sempre deve ter o mesmo kind do pai. Idempotente: só
 * corrige o que ainda estiver divergente.
 */
export async function fixSubcategoryKinds(): Promise<number> {
  const user = await requireUser();
  const categories = await prisma.category.findMany({ where: { userId: user.id } });
  const byId = new Map(categories.map((c) => [c.id, c]));

  const toFix = categories.filter((c) => c.parentId && byId.get(c.parentId) && c.kind !== byId.get(c.parentId)!.kind);
  if (toFix.length === 0) return 0;

  await prisma.$transaction(toFix.map((c) => prisma.category.update({ where: { id: c.id }, data: { kind: byId.get(c.parentId!)!.kind } })));

  revalidatePath("/", "layout");
  return toFix.length;
}

export async function deleteCategory(id: string) {
  try {
    const user = await requireUser();
    const [txCount, childCount] = await Promise.all([
      prisma.transaction.count({ where: { userId: user.id, categoryId: id } }),
      prisma.category.count({ where: { userId: user.id, parentId: id } }),
    ]);
    if (txCount > 0) throw new Error("Esta categoria possui lançamentos vinculados.");
    if (childCount > 0) throw new Error("Exclua ou mova as subcategorias primeiro.");
    await prisma.category.deleteMany({ where: { id, userId: user.id } });
    revalidatePath("/", "layout");
  } catch (err) {
    if (err instanceof Error) return { error: err.message };
    throw err;
  }
}
