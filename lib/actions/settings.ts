"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { z } from "zod";

const profileSchema = z.object({ name: z.string().min(2, "Informe seu nome") });

export async function updateProfile(raw: z.infer<typeof profileSchema>) {
  const user = await requireUser();
  const data = profileSchema.parse(raw);
  await prisma.user.update({ where: { id: user.id }, data: { name: data.name } });
  revalidatePath("/", "layout");
}

const preferencesSchema = z.object({
  currency: z.string().min(1),
  firstDayOfMonth: z.number().int().min(1).max(28),
  dateFormat: z.string().min(1),
});

export async function updatePreferences(raw: z.infer<typeof preferencesSchema>) {
  const user = await requireUser();
  const data = preferencesSchema.parse(raw);
  await prisma.user.update({ where: { id: user.id }, data });
  revalidatePath("/", "layout");
}

export async function updateTheme(theme: "light" | "dark" | "auto") {
  const user = await requireUser();
  await prisma.user.update({ where: { id: user.id }, data: { theme } });
  revalidatePath("/", "layout");
}

const passwordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6, "A nova senha deve ter ao menos 6 caracteres"),
});

export async function changePassword(raw: z.infer<typeof passwordSchema>) {
  const user = await requireUser();
  const data = passwordSchema.parse(raw);

  const dbUser = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
  const valid = await bcrypt.compare(data.currentPassword, dbUser.passwordHash);
  if (!valid) throw new Error("Senha atual incorreta");

  const passwordHash = await bcrypt.hash(data.newPassword, 10);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
}
