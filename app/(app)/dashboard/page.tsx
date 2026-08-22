import { requireUser } from "@/lib/session";
import { getAccountsWithBalance } from "@/lib/queries/accounts";
import { getNetWorth } from "@/lib/queries/net-worth";
import { getPeriodRange, getPreviousRange, percentChange, type PeriodKey } from "@/lib/queries/period";
import { getPeriodSummary, getMonthlySeries, getExpensesByCategory, getUpcomingItems, getPendingExpenses } from "@/lib/queries/dashboard";
import { getInsights } from "@/lib/queries/insights";
import { round2 } from "@/lib/finance";
import { formatCurrency } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { PeriodSelector } from "@/components/dashboard/period-selector";
import { PendingFade } from "@/components/shared/pending-fade";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { IncomeExpenseChart } from "@/components/dashboard/income-expense-chart";
import { CategoryBreakdown } from "@/components/dashboard/category-breakdown";
import { InsightsList } from "@/components/dashboard/insights-list";
import { UpcomingList } from "@/components/dashboard/upcoming-list";
import { PendingExpensesList } from "@/components/dashboard/pending-expenses-list";

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ period?: string; from?: string; to?: string }> }) {
  const user = await requireUser();
  const { period: periodParam, from, to } = await searchParams;
  const period = (periodParam as PeriodKey) ?? "mes";

  const range = getPeriodRange(period, new Date(), from, to);
  const prevRange = getPreviousRange(range);

  const [accounts, netWorth, summary, monthlySeries, categoryData, prevCategoryData, insights, upcoming, pendingExpenses, investmentsTotal] =
    await Promise.all([
      getAccountsWithBalance(user.id),
      getNetWorth(user.id),
      getPeriodSummary(user.id, range),
      getMonthlySeries(user.id, 8, true),
      getExpensesByCategory(user.id, range, true),
      getExpensesByCategory(user.id, prevRange, true),
      getInsights(user.id),
      getUpcomingItems(user.id),
      getPendingExpenses(user.id),
      prisma.investment.aggregate({ where: { userId: user.id }, _sum: { currentAmount: true } }),
    ]);

  const balance = round2(accounts.reduce((sum, a) => sum + a.balance, 0));
  const balanceStart = round2(balance - summary.result);
  const balanceChange = percentChange(balance, balanceStart);

  const prevTotalsMap = Object.fromEntries(prevCategoryData.categories.map((c) => [c.id, c.total]));

  const firstName = (user.name ?? "").split(" ")[0] || "Usuário";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Olá, {firstName}!</h1>
          <p className="text-muted-foreground mt-1">Veja como estão suas finanças hoje.</p>
        </div>
        <PeriodSelector current={period} />
      </div>

      <PendingFade className="space-y-6">
        <SummaryCards
          balance={balance}
          balanceChange={balanceChange}
          income={summary.income}
          expense={summary.expenseAll}
          expensePaid={summary.expense}
          result={summary.result}
          investments={round2(investmentsTotal._sum.currentAmount ?? 0)}
          netWorth={netWorth.netWorth}
        />

        {insights.length > 0 && <InsightsList insights={insights} />}

        <div className="grid xl:grid-cols-5 gap-4">
          <Card className="xl:col-span-3">
            <CardHeader>
              <CardTitle>Receitas x Despesas</CardTitle>
            </CardHeader>
            <CardContent>
              <IncomeExpenseChart data={monthlySeries} />
            </CardContent>
          </Card>

          <Card className="xl:col-span-2">
            <CardHeader>
              <CardTitle>Despesas por categoria</CardTitle>
            </CardHeader>
            <CardContent>
              <CategoryBreakdown categories={categoryData.categories} previousTotals={prevTotalsMap} />
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle>Despesas a pagar</CardTitle>
              {pendingExpenses.count > 0 && <span className="text-sm font-semibold text-negative">{formatCurrency(pendingExpenses.total)}</span>}
            </CardHeader>
            <CardContent>
              <PendingExpensesList items={pendingExpenses.items} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Próximos vencimentos</CardTitle>
            </CardHeader>
            <CardContent>
              <UpcomingList items={upcoming} />
            </CardContent>
          </Card>
        </div>
      </PendingFade>
    </div>
  );
}
