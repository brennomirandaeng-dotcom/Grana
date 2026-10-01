import Link from "next/link";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getCreditCardsWithUsage } from "@/lib/queries/credit-cards";
import { addMonthsToKey } from "@/lib/finance";
import { formatMonthLabel, monthKey } from "@/lib/format";
import { CreditCardsList } from "@/components/cartoes/credit-cards-list";
import { LinkBusyBridge } from "@/components/shared/link-busy-bridge";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default async function CartoesPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const user = await requireUser();
  const { month: monthParam } = await searchParams;
  const month = monthParam ?? monthKey(new Date());

  const [cards, categories] = await Promise.all([
    getCreditCardsWithUsage(user.id, month),
    prisma.category.findMany({ where: { userId: user.id, kind: "EXPENSE" }, orderBy: { name: "asc" } }),
  ]);

  const prevMonth = addMonthsToKey(month, -1);
  const nextMonth = addMonthsToKey(month, 1);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Cartões</h1>
          <p className="text-muted-foreground mt-1">Controle limites, faturas e compras parceladas.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/cartoes?month=${prevMonth}`}>
            <button className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-surface-muted text-muted-foreground">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <LinkBusyBridge message="Atualizando faturas..." />
          </Link>
          <p className="text-sm font-medium min-w-[110px] text-center">{formatMonthLabel(month)}</p>
          <Link href={`/cartoes?month=${nextMonth}`}>
            <button className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-surface-muted text-muted-foreground">
              <ChevronRight className="h-4 w-4" />
            </button>
            <LinkBusyBridge message="Atualizando faturas..." />
          </Link>
        </div>
      </div>

      <CreditCardsList cards={cards} categories={categories} month={month} />
    </div>
  );
}
