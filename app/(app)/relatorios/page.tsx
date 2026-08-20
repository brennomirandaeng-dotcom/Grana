import { requireUser } from "@/lib/session";
import { getPeriodRange, type PeriodKey } from "@/lib/queries/period";
import { getPeriodSummary, getMonthlySeries, getExpensesByCategory } from "@/lib/queries/dashboard";
import { getExpensesByAccount, getExpensesByCard, getTopExpenses, getRecurringExpensesSummary } from "@/lib/queries/reports";
import { formatCurrency, formatDate } from "@/lib/format";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { PeriodSelector } from "@/components/dashboard/period-selector";
import { IncomeExpenseChart } from "@/components/dashboard/income-expense-chart";
import { CategoryBreakdown } from "@/components/dashboard/category-breakdown";
import { ExportCsvButton } from "@/components/relatorios/export-csv-button";
import { EmptyState } from "@/components/shared/empty-state";
import { Repeat, TrophyIcon } from "lucide-react";

export default async function RelatoriosPage({ searchParams }: { searchParams: Promise<{ period?: string }> }) {
  const user = await requireUser();
  const { period: periodParam } = await searchParams;
  const period = (periodParam as PeriodKey) ?? "6m";
  const range = getPeriodRange(period);

  const [summary, monthlySeries, categoryData, byAccount, byCard, topExpenses, recurring] = await Promise.all([
    getPeriodSummary(user.id, range),
    getMonthlySeries(user.id, 8),
    getExpensesByCategory(user.id, range),
    getExpensesByAccount(user.id, range),
    getExpensesByCard(user.id, range),
    getTopExpenses(user.id, range, 10),
    getRecurringExpensesSummary(user.id),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Relatórios</h1>
          <p className="text-muted-foreground mt-1">Analise sua vida financeira em detalhe.</p>
        </div>
        <PeriodSelector current={period} />
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground">Receitas no período</p>
            <p className="text-xl font-semibold mt-1 text-positive">{formatCurrency(summary.income)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground">Despesas no período</p>
            <p className="text-xl font-semibold mt-1 text-negative">{formatCurrency(summary.expense)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground">Resultado</p>
            <p className={`text-xl font-semibold mt-1 ${summary.result >= 0 ? "text-positive" : "text-negative"}`}>{formatCurrency(summary.result)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Comparação mensal — receitas x despesas x saldo</CardTitle>
        </CardHeader>
        <CardContent>
          <IncomeExpenseChart data={monthlySeries} />
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground uppercase border-b border-border">
                  <th className="py-2">Mês</th>
                  <th className="py-2 text-right">Receitas</th>
                  <th className="py-2 text-right">Despesas</th>
                  <th className="py-2 text-right">Saldo</th>
                </tr>
              </thead>
              <tbody>
                {monthlySeries.map((m) => (
                  <tr key={m.month} className="border-b border-border last:border-0">
                    <td className="py-2">{m.label}</td>
                    <td className="py-2 text-right text-positive">{formatCurrency(m.receitas)}</td>
                    <td className="py-2 text-right text-negative">{formatCurrency(m.despesas)}</td>
                    <td className={`py-2 text-right font-medium ${m.saldo >= 0 ? "text-positive" : "text-negative"}`}>{formatCurrency(m.saldo)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="grid xl:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Despesas por categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <CategoryBreakdown categories={categoryData.categories} previousTotals={{}} />
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Despesas por conta</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {byAccount.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma despesa no período.</p>
              ) : (
                byAccount.map((a) => (
                  <div key={a.name} className="flex justify-between text-sm">
                    <span className="text-foreground">{a.name}</span>
                    <span className="font-medium">{formatCurrency(a.total)}</span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Despesas por cartão</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {byCard.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma compra no cartão neste período.</p>
              ) : (
                byCard.map((c) => (
                  <div key={c.name} className="flex justify-between text-sm">
                    <span className="text-foreground">{c.name}</span>
                    <span className="font-medium">{formatCurrency(c.total)}</span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>Maiores despesas do período</CardTitle>
          <ExportCsvButton
            filename={`maiores-despesas-${period}.csv`}
            headers={["Data", "Descrição", "Categoria", "Valor"]}
            rows={topExpenses.map((t) => [formatDate(t.date), t.description, t.category?.name ?? "—", t.amount.toFixed(2).replace(".", ",")])}
          />
        </CardHeader>
        <CardContent>
          {topExpenses.length === 0 ? (
            <EmptyState icon={TrophyIcon} title="Nenhuma despesa no período" className="border-none py-8" />
          ) : (
            <div className="space-y-1">
              {topExpenses.map((t, i) => (
                <div key={t.id} className="flex items-center justify-between rounded-lg px-2 py-2 hover:bg-surface-muted">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs font-medium text-muted-foreground w-5">{i + 1}º</span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{t.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(t.date)} · {t.category?.name ?? "Sem categoria"}
                      </p>
                    </div>
                  </div>
                  <span className="font-semibold text-negative shrink-0">{formatCurrency(t.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Gastos recorrentes ativos</CardTitle>
        </CardHeader>
        <CardContent>
          {recurring.length === 0 ? (
            <EmptyState icon={Repeat} title="Nenhum gasto recorrente cadastrado" className="border-none py-8" />
          ) : (
            <div className="space-y-1">
              {recurring.map((r) => (
                <div key={r.id} className="flex items-center justify-between rounded-lg px-2 py-2 hover:bg-surface-muted">
                  <div>
                    <p className="text-sm font-medium text-foreground">{r.description}</p>
                    <p className="text-xs text-muted-foreground">{r.category?.name ?? "Sem categoria"}</p>
                  </div>
                  <span className="font-semibold text-negative">{formatCurrency(r.amount)}/mês</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
