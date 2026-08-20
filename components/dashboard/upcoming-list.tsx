import { formatDate } from "@/lib/format";
import { Money } from "@/components/shared/money";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { CalendarClock } from "lucide-react";
import type { TransactionWithRelations } from "@/lib/queries/transactions";

export function UpcomingList({ items }: { items: TransactionWithRelations[] }) {
  if (items.length === 0) {
    return <EmptyState icon={CalendarClock} title="Nada agendado para os próximos dias" className="py-10" />;
  }

  return (
    <div className="space-y-1">
      {items.map((t) => (
        <div key={t.id} className="flex items-center justify-between rounded-lg px-2 py-2.5 hover:bg-surface-muted">
          <div className="flex items-center gap-3 min-w-0">
            <span className={t.type === "INCOME" ? "h-2 w-2 rounded-full bg-positive shrink-0" : "h-2 w-2 rounded-full bg-negative shrink-0"} />
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{t.description}</p>
              <p className="text-xs text-muted-foreground">{formatDate(t.date)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge variant={t.status === "AGENDADO" ? "info" : "warning"}>{t.status === "AGENDADO" ? "Agendado" : "Pendente"}</Badge>
            <Money value={t.type === "EXPENSE" ? -t.amount : t.amount} showSign className="text-sm font-medium" />
          </div>
        </div>
      ))}
    </div>
  );
}
