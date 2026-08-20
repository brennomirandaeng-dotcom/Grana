import Link from "next/link";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getBudgetsWithSpent } from "@/lib/queries/budgets";
import { addMonthsToKey } from "@/lib/finance";
import { formatMonthLabel, monthKey } from "@/lib/format";
import { BudgetList } from "@/components/orcamento/budget-list";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default async function OrcamentoPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const user = await requireUser();
  const { month: monthParam } = await searchParams;
  const month = monthParam ?? monthKey(new Date());

  const [budgets, categories] = await Promise.all([
    getBudgetsWithSpent(user.id, month),
    prisma.category.findMany({ where: { userId: user.id, kind: "EXPENSE" }, orderBy: { name: "asc" } }),
  ]);

  const prevMonth = addMonthsToKey(month, -1);
  const nextMonth = addMonthsToKey(month, 1);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Orçamento</h1>
          <p className="text-muted-foreground mt-1">Defina limites de gastos por categoria e acompanhe o quanto já usou.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/orcamento?month=${prevMonth}`}>
            <button className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-surface-muted text-muted-foreground">
              <ChevronLeft className="h-4 w-4" />
            </button>
          </Link>
          <p className="text-sm font-medium min-w-[110px] text-center">{formatMonthLabel(month)}</p>
          <Link href={`/orcamento?month=${nextMonth}`}>
            <button className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-surface-muted text-muted-foreground">
              <ChevronRight className="h-4 w-4" />
            </button>
          </Link>
        </div>
      </div>

      <BudgetList budgets={budgets} month={month} categories={categories} />
    </div>
  );
}
