"use client";
import * as React from "react";
import { useActionRefresh } from "@/hooks/use-action-refresh";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ConfirmationModal } from "@/components/shared/confirmation-modal";
import { formatDate, formatCurrency } from "@/lib/format";
import { deleteTransaction } from "@/lib/actions/transactions";
import { toast } from "@/hooks/use-toast";
import { useQuickAdd } from "@/components/providers/quick-add-provider";
import type { TransactionWithRelations } from "@/lib/queries/transactions";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";

export function InvoicePurchasesTable({ purchases }: { purchases: TransactionWithRelations[] }) {
  const { refresh } = useActionRefresh();
  const { openEdit } = useQuickAdd();
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  async function handleDelete() {
    if (!deletingId) return;
    setDeleting(true);
    try {
      await deleteTransaction(deletingId);
      toast({ title: "Lançamento excluído", variant: "success" });
      refresh("Excluindo lançamento...");
    } catch {
      toast({ title: "Erro ao excluir", variant: "destructive" });
    } finally {
      setDeleting(false);
      setDeletingId(null);
    }
  }

  return (
    <>
      {/* Desktop */}
      <div className="hidden lg:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Compra</TableHead>
              <TableHead>Parcela</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {purchases.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="text-muted-foreground">{formatDate(p.date)}</TableCell>
                <TableCell className="font-medium text-foreground">{p.description}</TableCell>
                <TableCell className="text-muted-foreground">{p.installmentPurchase ? `${p.installmentNumber}/${p.installmentPurchase.installmentsCount}` : "1/1"}</TableCell>
                <TableCell>
                  {p.category ? (
                    <span className="inline-flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full" style={{ background: p.category.color }} />
                      {p.category.name}
                    </span>
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell className="text-right font-medium">{formatCurrency(p.amount)}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="iconSm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEdit(p)}>
                        <Pencil className="h-4 w-4" /> Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem destructive onClick={() => setDeletingId(p.id)}>
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
      <div className="lg:hidden space-y-2 p-4">
        {purchases.map((p) => (
          <button key={p.id} onClick={() => openEdit(p)} className="w-full text-left rounded-xl border border-border p-3 active:bg-surface-muted">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {p.description}
                  {p.installmentPurchase && (
                    <span className="ml-1.5 text-xs text-muted-foreground">
                      ({p.installmentNumber}/{p.installmentPurchase.installmentsCount})
                    </span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {formatDate(p.date)} · {p.category?.name ?? "Sem categoria"}
                </p>
              </div>
              <span className="text-sm font-semibold shrink-0 tabular-nums">{formatCurrency(p.amount)}</span>
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
