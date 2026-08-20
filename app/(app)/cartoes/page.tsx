import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getCreditCardsWithUsage } from "@/lib/queries/credit-cards";
import { CreditCardsList } from "@/components/cartoes/credit-cards-list";

export default async function CartoesPage() {
  const user = await requireUser();
  const [cards, categories] = await Promise.all([
    getCreditCardsWithUsage(user.id),
    prisma.category.findMany({ where: { userId: user.id, kind: "EXPENSE" }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Cartões</h1>
        <p className="text-muted-foreground mt-1">Controle limites, faturas e compras parceladas.</p>
      </div>

      <CreditCardsList cards={cards} categories={categories} />
    </div>
  );
}
