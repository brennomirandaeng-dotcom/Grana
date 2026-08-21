"use client";
import * as React from "react";
import Link from "next/link";
import { useActionRefresh } from "@/hooks/use-action-refresh";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Money } from "@/components/shared/money";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmationModal } from "@/components/shared/confirmation-modal";
import { CreditCardModal } from "@/components/cartoes/credit-card-modal";
import { InstallmentPurchaseModal } from "@/components/cartoes/installment-purchase-modal";
import { archiveCreditCard, deleteCreditCard } from "@/lib/actions/credit-cards";
import { toast } from "@/hooks/use-toast";
import { CreditCard as CardIcon, Plus, ShoppingCart, MoreHorizontal, Pencil, Archive, ArchiveRestore, Trash2 } from "lucide-react";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";

export interface CardRow {
  id: string;
  name: string;
  bank: string;
  limitAmount: number;
  closingDay: number;
  dueDay: number;
  brand: string;
  color: string;
  archived: boolean;
  totalDebt: number;
  available: number;
}

export function CreditCardsList({ cards, categories }: { cards: CardRow[]; categories: { id: string; name: string }[] }) {
  const { refresh } = useActionRefresh();
  const [modalOpen, setModalOpen] = React.useState(false);
  const [purchaseOpen, setPurchaseOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<CardRow | null>(null);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  async function handleArchive(id: string, archived: boolean) {
    setBusy(true);
    try {
      await archiveCreditCard(id, archived);
      toast({ title: archived ? "Cartão arquivado" : "Cartão reativado", variant: "success" });
      refresh("Atualizando cartão...");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!deletingId) return;
    setBusy(true);
    try {
      await deleteCreditCard(deletingId);
      toast({ title: "Cartão excluído", variant: "success" });
      refresh("Excluindo cartão...");
    } catch (err) {
      toast({ title: err instanceof Error ? err.message : "Erro ao excluir", variant: "destructive" });
    } finally {
      setBusy(false);
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => setPurchaseOpen(true)} disabled={cards.length === 0}>
          <ShoppingCart className="h-4 w-4" /> Nova compra
        </Button>
        <Button
          onClick={() => {
            setEditing(null);
            setModalOpen(true);
          }}
        >
          <Plus className="h-4 w-4" /> Novo cartão
        </Button>
      </div>

      {cards.length === 0 ? (
        <EmptyState
          icon={CardIcon}
          title="Nenhum cartão cadastrado"
          description="Cadastre seus cartões de crédito para controlar faturas e compras parceladas."
          action={
            <Button onClick={() => setModalOpen(true)}>
              <Plus className="h-4 w-4" /> Novo cartão
            </Button>
          }
        />
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {cards.map((c) => {
            const usagePercent = c.limitAmount > 0 ? Math.min(100, (c.totalDebt / c.limitAmount) * 100) : 0;
            return (
              <Card key={c.id} className={c.archived ? "opacity-60" : ""}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <Link href={`/cartoes/${c.id}`} className="flex items-center gap-2.5">
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: `${c.color}22`, color: c.color }}>
                        <CardIcon className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="font-medium text-foreground">{c.name}</p>
                        <p className="text-xs text-muted-foreground">{c.bank}</p>
                      </div>
                    </Link>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="iconSm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setEditing(c);
                            setModalOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleArchive(c.id, !c.archived)} disabled={busy}>
                          {c.archived ? <ArchiveRestore className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
                          {c.archived ? "Reativar" : "Arquivar"}
                        </DropdownMenuItem>
                        <DropdownMenuItem destructive onClick={() => setDeletingId(c.id)}>
                          <Trash2 className="h-4 w-4" /> Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="mt-4">
                    <p className="text-xs text-muted-foreground">Total devido</p>
                    <Money value={c.totalDebt} colorize={false} className="text-xl font-semibold" />
                  </div>

                  <Progress value={usagePercent} className="mt-3" indicatorClassName={usagePercent >= 90 ? "bg-negative" : usagePercent >= 70 ? "bg-warning" : "bg-brand"} />
                  <div className="mt-1.5 flex justify-between text-xs text-muted-foreground">
                    <span>Disponível: {c.available.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
                    <span>Limite: {c.limitAmount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
                  </div>

                  <p className="mt-3 text-xs text-muted-foreground">
                    Fecha dia {c.closingDay} · Vence dia {c.dueDay}
                  </p>

                  <Link href={`/cartoes/${c.id}`} className="mt-4 block">
                    <Button variant="secondary" size="sm" className="w-full">
                      Ver fatura
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <CreditCardModal open={modalOpen} onOpenChange={setModalOpen} card={editing} />
      <InstallmentPurchaseModal open={purchaseOpen} onOpenChange={setPurchaseOpen} cards={cards.filter((c) => !c.archived)} categories={categories} />
      <ConfirmationModal
        open={!!deletingId}
        onOpenChange={(o) => !o && setDeletingId(null)}
        title="Excluir cartão?"
        description="Só é possível excluir cartões sem compras vinculadas."
        onConfirm={handleDelete}
        loading={busy}
      />
    </div>
  );
}
