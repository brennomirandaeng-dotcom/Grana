import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getTransactions, type TransactionSortField, type SortDirection } from "@/lib/queries/transactions";
import { TransactionFilters } from "@/components/lancamentos/transaction-filters";
import { TransactionsTable } from "@/components/lancamentos/transactions-table";
import { Card, CardContent } from "@/components/ui/card";
import { Money } from "@/components/shared/money";
import { round2 } from "@/lib/finance";

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
}

export default async function LancamentosPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const user = await requireUser();
  const sp = await searchParams;

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
      },
      { field: (sp.sort as TransactionSortField) ?? "date", direction: (sp.dir as SortDirection) ?? "desc" }
    ),
    prisma.category.findMany({ where: { userId: user.id }, orderBy: { name: "asc" } }),
    prisma.account.findMany({ where: { userId: user.id, archived: false }, orderBy: { name: "asc" } }),
    prisma.creditCard.findMany({ where: { userId: user.id, archived: false }, orderBy: { name: "asc" } }),
  ]);

  const totalIncome = round2(transactions.filter((t) => t.type === "INCOME").reduce((s, t) => s + t.amount, 0));
  const totalExpense = round2(transactions.filter((t) => t.type === "EXPENSE").reduce((s, t) => s + t.amount, 0));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Lançamentos</h1>
        <p className="text-muted-foreground mt-1">Gerencie suas receitas, despesas e transferências.</p>
      </div>

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

      <TransactionFilters categories={categories} accounts={accounts} cards={cards} />

      <Card>
        <CardContent className="p-0 lg:p-2">
          <div className="p-4 lg:p-0">
            <TransactionsTable transactions={transactions} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
