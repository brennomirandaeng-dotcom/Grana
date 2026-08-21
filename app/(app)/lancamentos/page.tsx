import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getTransactions, type TransactionSortField, type SortDirection } from "@/lib/queries/transactions";
import { TransactionFilters } from "@/components/lancamentos/transaction-filters";
import { TransactionsTable } from "@/components/lancamentos/transactions-table";
import { MonthNavigator } from "@/components/lancamentos/month-navigator";
import { PendingFade } from "@/components/shared/pending-fade";
import { Card, CardContent } from "@/components/ui/card";
import { Money } from "@/components/shared/money";
import { round2 } from "@/lib/finance";
import { monthKey } from "@/lib/format";

interface SearchParams {
  q?: string;
  type?: string;
  categoryId?: string;
  accountId?: string;
  creditCardId?: string;
  status?: string;
  min?: string;
  max?: string;
  sort?: string;
  dir?: string;
  month?: string;
}

export default async function LancamentosPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const user = await requireUser();
  const sp = await searchParams;

  const isAllMonths = sp.month === "all";
  const resolvedMonth = isAllMonths || !sp.month ? monthKey(new Date()) : sp.month;
  const [year, month] = resolvedMonth.split("-").map(Number);
  const monthFrom = new Date(year, month - 1, 1);
  const monthTo = new Date(year, month, 0, 23, 59, 59, 999);

  const [transactions, categories, accounts, cards] = await Promise.all([
    getTransactions(
      user.id,
      {
        query: sp.q,
        type: sp.type,
        categoryId: sp.categoryId,
        accountId: sp.accountId,
        creditCardId: sp.creditCardId,
        status: sp.status,
        minAmount: sp.min ? Number(sp.min) : undefined,
        maxAmount: sp.max ? Number(sp.max) : undefined,
        ...(isAllMonths ? {} : { from: monthFrom, to: monthTo }),
      },
      { field: (sp.sort as TransactionSortField) ?? "date", direction: (sp.dir as SortDirection) ?? "desc" }
    ),
    prisma.category.findMany({ where: { userId: user.id }, orderBy: { name: "asc" } }),
    prisma.account.findMany({ where: { userId: user.id, archived: false }, orderBy: { name: "asc" } }),
    prisma.creditCard.findMany({ where: { userId: user.id, archived: false }, orderBy: { name: "asc" } }),
  ]);

  const totalIncome = round2(transactions.filter((t) => t.type === "INCOME").reduce((s, t) => s + t.amount, 0));
  const totalExpense = round2(transactions.filter((t) => t.type === "EXPENSE").reduce((s, t) => s + t.amount, 0));

  // Distingue "conta vazia de verdade" de "vazio só por causa do filtro/mês",
  // pra mostrar o empty state certo (CTA de criar vs. sugestão de ajustar filtro).
  const hasAnyTransactionEver = transactions.length > 0 || (await prisma.transaction.count({ where: { userId: user.id } })) > 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Lançamentos</h1>
          <p className="text-muted-foreground mt-1">Gerencie suas receitas, despesas e transferências.</p>
        </div>
        <MonthNavigator month={resolvedMonth} isAll={isAllMonths} />
      </div>

      <PendingFade className="space-y-6">
        <div className="grid grid-cols-3 gap-4 max-w-xl">
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Receitas (filtro)</p>
              <Money value={totalIncome} className="font-semibold" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Despesas (filtro)</p>
              <Money value={-totalExpense} className="font-semibold" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Resultado</p>
              <Money value={round2(totalIncome - totalExpense)} className="font-semibold" />
            </CardContent>
          </Card>
        </div>
      </PendingFade>

      <TransactionFilters categories={categories} accounts={accounts} cards={cards} />

      <PendingFade>
        <Card>
          <CardContent className="p-0 lg:p-2">
            <div className="p-4 lg:p-0">
              <TransactionsTable transactions={transactions} hasFilters={hasAnyTransactionEver} />
            </div>
          </CardContent>
        </Card>
      </PendingFade>
    </div>
  );
}
