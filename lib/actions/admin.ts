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

/**
 * Apaga todos os lançamentos (e registros de atividade ligados a eles —
 * compras parceladas, recorrências, pagamentos de fatura) de um usuário,
 * deixando as contas, cartões, categorias, metas e investimentos intactos —
 * como se o usuário estivesse começando do zero. Usado para limpar dados de
 * teste de uma conta antes do uso real.
 */
export async function resetUserTransactions(userId: string) {
  await requireAdmin();

  const transactionIds = (await prisma.transaction.findMany({ where: { userId }, select: { id: true } })).map((t) => t.id);

  await prisma.$transaction([
    // Uma receita prevista confirmada aponta pra um Transaction (SET NULL no
    // banco ao apagá-lo) — sem isso ela ficaria "recebida" sem lançamento algum.
    prisma.expectedIncome.updateMany({
      where: { transactionId: { in: transactionIds } },
      data: { confirmed: false, confirmedDate: null, transactionId: null },
    }),
    prisma.transaction.deleteMany({ where: { userId } }),
    prisma.installmentPurchase.deleteMany({ where: { userId } }),
    prisma.recurringTransaction.deleteMany({ where: { userId } }),
    prisma.invoicePayment.deleteMany({ where: { userId } }),
  ]);

  revalidatePath("/", "layout");
  revalidatePath("/admin/usuarios");
}
