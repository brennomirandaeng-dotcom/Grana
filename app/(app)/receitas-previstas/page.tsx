import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { ExpectedIncomeList } from "@/components/receitas-previstas/expected-income-list";
import { MonthNavigator } from "@/components/lancamentos/month-navigator";
import { monthKey } from "@/lib/format";

export default async function ReceitasPrevistasPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const user = await requireUser();
  const sp = await searchParams;

  const isAllMonths = sp.month === "all";
  const resolvedMonth = isAllMonths || !sp.month ? monthKey(new Date()) : sp.month;
  const [year, month] = resolvedMonth.split("-").map(Number);
  const monthFrom = new Date(year, month - 1, 1);
  const monthTo = new Date(year, month, 0, 23, 59, 59, 999);

  const expectedIncomes = await prisma.expectedIncome.findMany({
    where: { userId: user.id, ...(isAllMonths ? {} : { date: { gte: monthFrom, lte: monthTo } }) },
    orderBy: { date: "asc" },
  });

  // Distingue "nunca cadastrou nenhuma" de "vazio só por causa do filtro de
  // mês", pra mostrar o empty state certo.
  const hasAnyEver = expectedIncomes.length > 0 || (await prisma.expectedIncome.count({ where: { userId: user.id } })) > 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Receitas previstas</h1>
          <p className="text-muted-foreground mt-1">Cadastre receitas que você espera receber e confirme quando o dinheiro cair na conta.</p>
        </div>
        <MonthNavigator month={resolvedMonth} isAll={isAllMonths} />
      </div>

      <ExpectedIncomeList expectedIncomes={expectedIncomes} hasFilters={hasAnyEver} />
    </div>
  );
}
