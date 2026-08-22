"use client";
import { formatDate } from "@/lib/format";
import { Money } from "@/components/shared/money";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { CircleDollarSign } from "lucide-react";
import { useQuickAdd } from "@/components/providers/quick-add-provider";
import type { TransactionWithRelations } from "@/lib/queries/transactions";

export function PendingExpensesList({ items }: { items: TransactionWithRelations[] }) {
  const { openEdit } = useQuickAdd();

  if (items.length === 0) {
    return (
      <EmptyState
        icon={CircleDollarSign}
        title="Nenhuma despesa a pagar"
        description="Todas as despesas lançadas já estão marcadas como pagas."
        className="py-10"
      />
    );
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="space-y-1">
      {items.map((t) => {
        const overdue = new Date(t.date) < today;
        return (
          <button
            key={t.id}
            onClick={() => openEdit(t)}
            className="flex w-full items-center justify-between rounded-lg px-2 py-2.5 text-left hover:bg-surface-muted"
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className={`h-2 w-2 rounded-full shrink-0 ${overdue ? "bg-negative" : "bg-warning"}`} />
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{t.description}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(t.date)} · {t.category?.name ?? "Sem categoria"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {overdue && <Badge variant="negative">Vencida</Badge>}
              <Badge variant={t.status === "AGENDADO" ? "info" : "warning"}>{t.status === "AGENDADO" ? "Agendado" : "Pendente"}</Badge>
              <Money value={t.amount} colorize={false} className="text-sm font-medium" />
            </div>
          </button>
        );
      })}
    </div>
  );
}
