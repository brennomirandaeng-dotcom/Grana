import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

export async function getAllUsers() {
  await requireAdmin();
  return prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, email: true, role: true, active: true, createdAt: true },
  });
}
