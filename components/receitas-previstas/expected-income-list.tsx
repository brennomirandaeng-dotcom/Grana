"use client";
import * as React from "react";
import { useActionRefresh } from "@/hooks/use-action-refresh";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmationModal } from "@/components/shared/confirmation-modal";
import { ExpectedIncomeModal } from "@/components/receitas-previstas/expected-income-modal";
import { ConfirmIncomeModal } from "@/components/receitas-previstas/confirm-income-modal";
import { deleteExpectedIncome } from "@/lib/actions/expected-income";
import { toast } from "@/hooks/use-toast";
import { formatCurrency, formatDate } from "@/lib/format";
import { Coins, Plus, MoreHorizontal, Pencil, Trash2, CheckCircle2, Clock } from "lucide-react";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";

export interface ExpectedIncomeRow {
  id: string;
  description: string;
  amount: number;
  date: Date | string;
  confirmed: boolean;
  confirmedDate: Date | string | null;
}

export function ExpectedIncomeList({ expectedIncomes }: { expectedIncomes: ExpectedIncomeRow[] }) {
  const { refresh } = useActionRefresh();
  const [modalOpen, setModalOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<ExpectedIncomeRow | null>(null);
  const [confirming, setConfirming] = React.useState<ExpectedIncomeRow | null>(null);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  const total = expectedIncomes.reduce((sum, e) => sum + e.amount, 0);

  async function handleDelete() {
    if (!deletingId) return;
    setBusy(true);
    try {
      await deleteExpectedIncome(deletingId);
      toast({ title: "Receita prevista excluída", variant: "success" });
      refresh("Excluindo receita prevista...");
    } finally {
      setBusy(false);
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Card className="sm:max-w-xs">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Total de receitas previstas</p>
            <p className="mt-1 text-2xl font-semibold text-foreground">{formatCurrency(total)}</p>
          </CardContent>
        </Card>

        <Button
          className="sm:self-start"
          onClick={() => {
            setEditing(null);
            setModalOpen(true);
          }}
        >
          <Plus className="h-4 w-4" /> Nova receita prevista
        </Button>
      </div>

      {expectedIncomes.length === 0 ? (
        <EmptyState
          icon={Coins}
          title="Nenhuma receita prevista"
          description="Cadastre receitas que você espera receber e confirme quando o dinheiro cair na conta."
          action={
            <Button onClick={() => setModalOpen(true)}>
              <Plus className="h-4 w-4" /> Nova receita prevista
            </Button>
          }
        />
      ) : (
        <div className="space-y-2">
          {expectedIncomes.map((e) => (
            <Card key={e.id}>
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-positive/10 text-positive">
                    <Coins className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="font-medium text-foreground truncate">{e.description}</p>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-0.5">
                      <span className="text-xs text-muted-foreground">Previsto para {formatDate(e.date)}</span>
                      {e.confirmed ? (
                        <Badge variant="positive">
                          <CheckCircle2 className="h-3 w-3" /> Recebida em {formatDate(e.confirmedDate!)}
                        </Badge>
                      ) : (
                        <Badge variant="default">
                          <Clock className="h-3 w-3" /> Pendente
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-semibold tabular-nums">{formatCurrency(e.amount)}</span>
                  {!e.confirmed && (
                    <Button size="sm" variant="secondary" onClick={() => setConfirming(e)}>
                      Confirmar
                    </Button>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="iconSm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        disabled={e.confirmed}
                        onClick={() => {
                          setEditing(e);
                          setModalOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" /> Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem destructive onClick={() => setDeletingId(e.id)}>
                        <Trash2 className="h-4 w-4" /> Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ExpectedIncomeModal open={modalOpen} onOpenChange={setModalOpen} expectedIncome={editing} />
      {confirming && (
        <ConfirmIncomeModal
          open={!!confirming}
          onOpenChange={(o) => !o && setConfirming(null)}
          expectedIncomeId={confirming.id}
          description={confirming.description}
          amount={confirming.amount}
        />
      )}
      <ConfirmationModal
        open={!!deletingId}
        onOpenChange={(o) => !o && setDeletingId(null)}
        title="Excluir receita prevista?"
        description="Se ela já tiver sido confirmada, o lançamento de recebimento correspondente também será excluído."
        onConfirm={handleDelete}
        loading={busy}
      />
    </div>
  );
}
