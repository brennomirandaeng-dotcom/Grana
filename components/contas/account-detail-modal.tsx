"use client";
import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Money } from "@/components/shared/money";
import { EmptyState } from "@/components/shared/empty-state";
import { formatDate } from "@/lib/format";
import { TRANSACTION_STATUSES } from "@/lib/constants";
import { Receipt, ArrowLeftRight, Loader2 } from "lucide-react";
import type { TransactionWithRelations } from "@/lib/queries/transactions";

const statusVariant: Record<string, "positive" | "warning" | "info"> = {
  PAGO: "positive",
  PENDENTE: "warning",
  AGENDADO: "info",
};

// Valor com sinal relativo a esta conta específica: uma transferência pode
// ser saída (accountId = conta) ou entrada (transferToAccountId = conta).
function signedAmount(t: TransactionWithRelations, accountId: string) {
  if (t.type === "EXPENSE") return -t.amount;
  if (t.type === "TRANSFER") return t.transferToAccountId === accountId ? t.amount : -t.amount;
  return t.amount;
}

export function AccountDetailModal({
  open,
  onOpenChange,
  accountId,
  accountName,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accountId: string;
  accountName: string;
}) {
  const [transactions, setTransactions] = React.useState<TransactionWithRelations[] | null>(null);
  const [prevOpen, setPrevOpen] = React.useState(open);

  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) setTransactions(null);
  }

  React.useEffect(() => {
    if (!open) return;
    fetch(`/api/accounts/${accountId}/transactions`)
      .then((r) => r.json())
      .then(setTransactions);
  }, [open, accountId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>{accountName}</DialogTitle>
          <DialogDescription>Todos os lançamentos que entraram e saíram desta conta.</DialogDescription>
        </DialogHeader>

        {transactions === null ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : transactions.length === 0 ? (
          <EmptyState icon={Receipt} title="Nenhum lançamento nesta conta" description="Lançamentos e transferências envolvendo esta conta aparecerão aqui." />
        ) : (
          <div className="space-y-2">
            {transactions.map((t) => {
              const amount = signedAmount(t, accountId);
              return (
                <div key={t.id} className="flex items-center justify-between gap-3 rounded-xl border border-border p-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate flex items-center gap-1.5">
                      {t.type === "TRANSFER" && <ArrowLeftRight className="h-3.5 w-3.5 text-info shrink-0" />}
                      {t.description}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatDate(t.date)}
                      {t.category ? ` · ${t.category.name}` : ""}
                      {t.type === "TRANSFER" ? ` · ${t.transferToAccountId === accountId ? `De ${t.account?.name ?? "—"}` : `Para ${t.transferToAccount?.name ?? "—"}`}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant={statusVariant[t.status] ?? "default"}>{TRANSACTION_STATUSES[t.status as keyof typeof TRANSACTION_STATUSES] ?? t.status}</Badge>
                    <Money value={amount} showSign className="text-sm font-semibold" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
