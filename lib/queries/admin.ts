import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

export async function getAllUsers() {
  await requireAdmin();
  const [users, counts] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "asc" },
      select: { id: true, name: true, email: true, role: true, active: true, createdAt: true },
    }),
    prisma.transaction.groupBy({ by: ["userId"], _count: { _all: true } }),
  ]);

  const countMap = Object.fromEntries(counts.map((c) => [c.userId, c._count._all]));
  return users.map((u) => ({ ...u, transactionCount: countMap[u.id] ?? 0 }));
}
