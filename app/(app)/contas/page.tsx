import { requireUser } from "@/lib/session";
import { getAccountsWithBalance, getAccountTransactionCounts } from "@/lib/queries/accounts";
import { AccountsList } from "@/components/contas/accounts-list";

export default async function ContasPage() {
  const user = await requireUser();
  const [accounts, counts] = await Promise.all([getAccountsWithBalance(user.id), getAccountTransactionCounts(user.id)]);

  const rows = accounts.map((a) => ({ ...a, transactionCount: counts[a.id] ?? 0 }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Contas</h1>
        <p className="text-muted-foreground mt-1">Suas contas bancárias, carteiras e dinheiro físico.</p>
      </div>

      <AccountsList accounts={rows} />
    </div>
  );
}
