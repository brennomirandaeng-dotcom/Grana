"use client";
import * as React from "react";
import { useActionRefresh } from "@/hooks/use-action-refresh";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmationModal } from "@/components/shared/confirmation-modal";
import { GoalModal } from "@/components/metas/goal-modal";
import { ContributionModal } from "@/components/metas/contribution-modal";
import { deleteGoal, archiveGoal } from "@/lib/actions/goals";
import { toast } from "@/hooks/use-toast";
import { formatCurrency, formatDate } from "@/lib/format";
import { round2 } from "@/lib/finance";
import { Target, Plus, MoreHorizontal, Pencil, Archive, ArchiveRestore, Trash2, Wallet, CalendarClock } from "lucide-react";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";

export interface GoalRow {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: Date | string | null;
  color: string;
  archived: boolean;
}

function monthsUntil(deadline: Date) {
  const now = new Date();
  return Math.max(1, (deadline.getFullYear() - now.getFullYear()) * 12 + (deadline.getMonth() - now.getMonth()));
}

export function GoalsList({ goals }: { goals: GoalRow[] }) {
  const { refresh } = useActionRefresh();
  const [modalOpen, setModalOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<GoalRow | null>(null);
  const [contributingGoal, setContributingGoal] = React.useState<GoalRow | null>(null);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  async function handleArchive(id: string, archived: boolean) {
    setBusy(true);
    try {
      await archiveGoal(id, archived);
      toast({ title: archived ? "Meta arquivada" : "Meta reativada", variant: "success" });
      refresh("Atualizando meta...");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!deletingId) return;
    setBusy(true);
    try {
      await deleteGoal(deletingId);
      toast({ title: "Meta excluída", variant: "success" });
      refresh("Excluindo meta...");
    } finally {
      setBusy(false);
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button
          onClick={() => {
            setEditing(null);
            setModalOpen(true);
          }}
        >
          <Plus className="h-4 w-4" /> Nova meta
        </Button>
      </div>

      {goals.length === 0 ? (
        <EmptyState
          icon={Target}
          title="Nenhuma meta cadastrada"
          description="Crie metas financeiras e acompanhe seu progresso até alcançá-las."
          action={
            <Button onClick={() => setModalOpen(true)}>
              <Plus className="h-4 w-4" /> Nova meta
            </Button>
          }
        />
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {goals.map((g) => {
            const percent = g.targetAmount > 0 ? Math.min(100, round2((g.currentAmount / g.targetAmount) * 100)) : 0;
            const deadline = g.deadline ? new Date(g.deadline) : null;
            const monthlyNeeded = deadline && g.currentAmount < g.targetAmount ? round2((g.targetAmount - g.currentAmount) / monthsUntil(deadline)) : null;
            const achieved = g.currentAmount >= g.targetAmount;

            return (
              <Card key={g.id} className={g.archived ? "opacity-60" : ""}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: `${g.color}22`, color: g.color }}>
                        <Target className="h-4 w-4" />
                      </span>
                      <p className="font-medium text-foreground">{g.name}</p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="iconSm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setEditing(g);
                            setModalOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleArchive(g.id, !g.archived)} disabled={busy}>
                          {g.archived ? <ArchiveRestore className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
                          {g.archived ? "Reativar" : "Arquivar"}
                        </DropdownMenuItem>
                        <DropdownMenuItem destructive onClick={() => setDeletingId(g.id)}>
                          <Trash2 className="h-4 w-4" /> Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="mt-3 flex items-baseline justify-between text-sm">
                    <span className="font-semibold">{formatCurrency(g.currentAmount)}</span>
                    <span className="text-muted-foreground">de {formatCurrency(g.targetAmount)}</span>
                  </div>
                  <Progress value={percent} className="mt-2" indicatorClassName={achieved ? "bg-positive" : "bg-brand"} />
                  <p className="mt-1 text-xs text-muted-foreground">{percent.toFixed(0)}% concluído</p>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {achieved && <Badge variant="positive">Meta atingida 🎉</Badge>}
                    {deadline && (
                      <Badge variant="default">
                        <CalendarClock className="h-3 w-3" /> {formatDate(deadline)}
                      </Badge>
                    )}
                  </div>

                  {monthlyNeeded !== null && monthlyNeeded > 0 && (
                    <p className="mt-2 text-xs text-muted-foreground">Guarde {formatCurrency(monthlyNeeded)}/mês para atingir no prazo.</p>
                  )}

                  <Button variant="secondary" size="sm" className="w-full mt-4" onClick={() => setContributingGoal(g)}>
                    <Wallet className="h-3.5 w-3.5" /> Adicionar / retirar
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <GoalModal open={modalOpen} onOpenChange={setModalOpen} goal={editing} />
      {contributingGoal && (
        <ContributionModal open={!!contributingGoal} onOpenChange={(o) => !o && setContributingGoal(null)} goalId={contributingGoal.id} goalName={contributingGoal.name} />
      )}
      <ConfirmationModal open={!!deletingId} onOpenChange={(o) => !o && setDeletingId(null)} title="Excluir meta?" description="Essa ação não pode ser desfeita." onConfirm={handleDelete} loading={busy} />
    </div>
  );
}
