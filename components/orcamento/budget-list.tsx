"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Money } from "@/components/shared/money";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmationModal } from "@/components/shared/confirmation-modal";
import { BudgetModal } from "@/components/orcamento/budget-modal";
import { deleteBudget } from "@/lib/actions/budgets";
import { toast } from "@/hooks/use-toast";
import { getCategoryIcon } from "@/lib/icons";
import { PieChart, Plus, Trash2 } from "lucide-react";

export interface BudgetRow {
  id: string;
  categoryId: string;
  limit: number;
  spent: number;
  percent: number;
  remaining: number;
  category: { name: string; icon: string; color: string };
}

export function BudgetList({ budgets, month, categories }: { budgets: BudgetRow[]; month: string; categories: { id: string; name: string }[] }) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = React.useState(false);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  const totalLimit = budgets.reduce((s, b) => s + b.limit, 0);
  const totalSpent = budgets.reduce((s, b) => s + b.spent, 0);

  async function handleDelete() {
    if (!deletingId) return;
    setBusy(true);
    try {
      await deleteBudget(deletingId);
      toast({ title: "Orçamento removido", variant: "success" });
      router.refresh();
    } finally {
      setBusy(false);
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="rounded-xl bg-surface-muted px-4 py-2.5">
          <p className="text-xs text-muted-foreground">Total orçado / gasto no mês</p>
          <p className="text-lg font-semibold">
            <Money value={totalSpent} colorize={false} /> <span className="text-muted-foreground font-normal">/ {totalLimit.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="h-4 w-4" /> Novo orçamento
        </Button>
      </div>

      {budgets.length === 0 ? (
        <EmptyState
          icon={PieChart}
          title="Nenhum orçamento definido neste mês"
          description="Defina limites de gastos por categoria para acompanhar seu orçamento."
          action={
            <Button onClick={() => setModalOpen(true)}>
              <Plus className="h-4 w-4" /> Novo orçamento
            </Button>
          }
        />
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {budgets.map((b) => {
            const Icon = getCategoryIcon(b.category.icon);
            const over = b.percent > 100;
            const warn = b.percent >= 80 && b.percent <= 100;
            return (
              <Card key={b.id}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: `${b.category.color}22`, color: b.category.color }}>
                        <Icon className="h-4 w-4" />
                      </span>
                      <p className="font-medium text-foreground">{b.category.name}</p>
                    </div>
                    <Button variant="ghost" size="iconSm" onClick={() => setDeletingId(b.id)}>
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>

                  <div className="mt-3 flex items-baseline justify-between text-sm">
                    <span className="font-semibold">{b.spent.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
                    <span className="text-muted-foreground">de {b.limit.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
                  </div>

                  <Progress value={Math.min(100, b.percent)} className="mt-2" indicatorClassName={over ? "bg-negative" : warn ? "bg-warning" : "bg-positive"} />

                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{b.percent.toFixed(0)}% utilizado</span>
                    {over && <Badge variant="negative">Estourou o orçamento</Badge>}
                    {warn && !over && <Badge variant="warning">Atenção: perto do limite</Badge>}
                    {!warn && !over && <Badge variant="positive">Dentro do limite</Badge>}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <BudgetModal open={modalOpen} onOpenChange={setModalOpen} month={month} categories={categories} existingCategoryIds={budgets.map((b) => b.categoryId)} />
      <ConfirmationModal open={!!deletingId} onOpenChange={(o) => !o && setDeletingId(null)} title="Remover orçamento?" onConfirm={handleDelete} loading={busy} />
    </div>
  );
}
