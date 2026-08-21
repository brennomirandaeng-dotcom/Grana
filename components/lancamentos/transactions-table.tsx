"use client";
import * as React from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useActionRefresh } from "@/hooks/use-action-refresh";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Money } from "@/components/shared/money";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmationModal } from "@/components/shared/confirmation-modal";
import { formatDate } from "@/lib/format";
import { TRANSACTION_STATUSES, PAYMENT_METHODS } from "@/lib/constants";
import { deleteTransaction } from "@/lib/actions/transactions";
import { toast } from "@/hooks/use-toast";
import { useQuickAdd } from "@/components/providers/quick-add-provider";
import type { TransactionWithRelations } from "@/lib/queries/transactions";
import { ArrowUp, ArrowDown, ArrowUpDown, MoreHorizontal, Pencil, Trash2, Receipt, ArrowLeftRight } from "lucide-react";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Button as Btn } from "@/components/ui/button";

const statusVariant: Record<string, "positive" | "warning" | "info"> = {
  PAGO: "positive",
  PENDENTE: "warning",
  AGENDADO: "info",
};

function SortHeader({ field, label }: { field: string; label: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentSort = searchParams.get("sort") ?? "date";
  const currentDir = searchParams.get("dir") ?? "desc";
  const active = currentSort === field;

  function toggle() {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", field);
    params.set("dir", active && currentDir === "desc" ? "asc" : "desc");
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <button onClick={toggle} className="flex items-center gap-1 hover:text-foreground">
      {label}
      {active ? currentDir === "desc" ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" /> : <ArrowUpDown className="h-3 w-3 opacity-30" />}
    </button>
  );
}

export function TransactionsTable({ transactions, hasFilters }: { transactions: TransactionWithRelations[]; hasFilters?: boolean }) {
  const { refresh } = useActionRefresh();
  const { openEdit, open } = useQuickAdd();
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  async function handleDelete() {
    if (!deletingId) return;
    setDeleting(true);
    try {
      await deleteTransaction(deletingId);
      toast({ title: "Lançamento excluído", variant: "success" });
      refresh();
    } catch {
      toast({ title: "Erro ao excluir", variant: "destructive" });
    } finally {
      setDeleting(false);
      setDeletingId(null);
    }
  }

  if (transactions.length === 0) {
    return (
      <EmptyState
        icon={Receipt}
        title={hasFilters ? "Nenhum lançamento encontrado" : "Você ainda não possui lançamentos"}
        description={
          hasFilters
            ? "Tente outro período ou ajuste os filtros aplicados."
            : "Registre suas receitas e despesas para acompanhar sua vida financeira."
        }
        action={
          !hasFilters && (
            <Button onClick={() => open("EXPENSE")}>
              <Receipt className="h-4 w-4" /> Adicionar lançamento
            </Button>
          )
        }
      />
    );
  }

  return (
    <>
      {/* Desktop */}
      <div className="hidden lg:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <SortHeader field="date" label="Data" />
              </TableHead>
              <TableHead>
                <SortHeader field="description" label="Descrição" />
              </TableHead>
              <TableHead>
                <SortHeader field="category" label="Categoria" />
              </TableHead>
              <TableHead>
                <SortHeader field="account" label="Conta / Cartão" />
              </TableHead>
              <TableHead>Forma</TableHead>
              <TableHead className="text-right">
                <SortHeader field="amount" label="Valor" />
              </TableHead>
              <TableHead>
                <SortHeader field="status" label="Status" />
              </TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((t) => (
              <TableRow key={t.id}>
                <TableCell className="text-muted-foreground">{formatDate(t.date)}</TableCell>
                <TableCell className="font-medium text-foreground max-w-[220px] truncate">
                  <div className="flex items-center gap-2">
                    {t.type === "TRANSFER" && <ArrowLeftRight className="h-3.5 w-3.5 text-info shrink-0" />}
                    {t.description}
                    {t.installmentNumber && t.installmentPurchase && (
                      <span className="text-xs text-muted-foreground shrink-0">
                        ({t.installmentNumber}/{t.installmentPurchase.installmentsCount})
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {t.category ? (
                    <span className="inline-flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full" style={{ background: t.category.color }} />
                      {t.category.name}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {t.type === "TRANSFER"
                    ? `${t.account?.name ?? "Investimento"} → ${t.transferToAccount?.name}`
                    : t.creditCard
                      ? `${t.creditCard.name} (cartão)`
                      : t.account?.name ?? "—"}
                </TableCell>
                <TableCell className="text-muted-foreground">{PAYMENT_METHODS[t.paymentMethod as keyof typeof PAYMENT_METHODS] ?? t.paymentMethod}</TableCell>
                <TableCell className="text-right">
                  <Money value={t.type === "EXPENSE" ? -t.amount : t.type === "TRANSFER" ? t.amount : t.amount} colorize={t.type !== "TRANSFER"} showSign={t.type !== "TRANSFER"} />
                </TableCell>
                <TableCell>
                  <Badge variant={statusVariant[t.status] ?? "default"}>{TRANSACTION_STATUSES[t.status as keyof typeof TRANSACTION_STATUSES] ?? t.status}</Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Btn variant="ghost" size="iconSm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Btn>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEdit(t)}>
                        <Pencil className="h-4 w-4" /> Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem destructive onClick={() => setDeletingId(t.id)}>
                        <Trash2 className="h-4 w-4" /> Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile */}
      <div className="lg:hidden space-y-2">
        {transactions.map((t) => (
          <button key={t.id} onClick={() => openEdit(t)} className="w-full text-left rounded-xl border border-border p-3 active:bg-surface-muted">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{t.description}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {formatDate(t.date)} · {t.category?.name ?? "Sem categoria"}
                </p>
              </div>
              <Money value={t.type === "EXPENSE" ? -t.amount : t.amount} showSign={t.type !== "TRANSFER"} colorize={t.type !== "TRANSFER"} className="text-sm font-semibold shrink-0" />
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant={statusVariant[t.status] ?? "default"}>{TRANSACTION_STATUSES[t.status as keyof typeof TRANSACTION_STATUSES] ?? t.status}</Badge>
              <span className="text-xs text-muted-foreground">
                {t.type === "TRANSFER" ? `${t.account?.name ?? "Investimento"} → ${t.transferToAccount?.name}` : t.account?.name ?? t.creditCard?.name ?? "—"}
              </span>
            </div>
          </button>
        ))}
      </div>

      <ConfirmationModal
        open={!!deletingId}
        onOpenChange={(o) => !o && setDeletingId(null)}
        title="Excluir lançamento?"
        description="Essa ação não pode ser desfeita."
        onConfirm={handleDelete}
        loading={deleting}
      />
    </>
  );
}
