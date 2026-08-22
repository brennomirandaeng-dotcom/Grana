"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

/** Ativa ou desativa o acesso de um usuário. Um administrador não pode desativar a própria conta. */
export async function setUserActive(userId: string, active: boolean) {
  const admin = await requireAdmin();
  if (userId === admin.id && !active) throw new Error("Você não pode desativar a própria conta");

  await prisma.user.updateMany({ where: { id: userId }, data: { active } });
  revalidatePath("/admin/usuarios");
}
