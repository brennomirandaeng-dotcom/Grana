import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { CategoriesList } from "@/components/categorias/categories-list";

export default async function CategoriasPage() {
  const user = await requireUser();
  const [categories, counts] = await Promise.all([
    prisma.category.findMany({ where: { userId: user.id }, orderBy: { name: "asc" } }),
    prisma.transaction.groupBy({ by: ["categoryId"], where: { userId: user.id, categoryId: { not: null } }, _count: { _all: true } }),
  ]);

  const countMap = Object.fromEntries(counts.map((c) => [c.categoryId as string, c._count._all]));
  const rows = categories.map((c) => ({ ...c, transactionCount: countMap[c.id] ?? 0 }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Categorias</h1>
        <p className="text-muted-foreground mt-1">Organize suas receitas e despesas com categorias e subcategorias.</p>
      </div>

      <CategoriesList categories={rows} />
    </div>
  );
}
