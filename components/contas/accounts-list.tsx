"use client";
import * as React from "react";
import { useActionRefresh } from "@/hooks/use-action-refresh";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Money } from "@/components/shared/money";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmationModal } from "@/components/shared/confirmation-modal";
import { AccountModal } from "@/components/contas/account-modal";
import { TransferModal } from "@/components/contas/transfer-modal";
import { archiveAccount, deleteAccount } from "@/lib/actions/accounts";
import { toast } from "@/hooks/use-toast";
import { ACCOUNT_TYPES } from "@/lib/constants";
import { Landmark, Plus, ArrowLeftRight, MoreHorizontal, Pencil, Archive, ArchiveRestore, Trash2 } from "lucide-react";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";

export interface AccountRow {
  id: string;
  name: string;
  institution: string | null;
  type: string;
  initialBalance: number;
  color: string;
  archived: boolean;
  balance: number;
  transactionCount: number;
}

export function AccountsList({ accounts }: { accounts: AccountRow[] }) {
  const { refresh } = useActionRefresh();
  const [modalOpen, setModalOpen] = React.useState(false);
  const [transferOpen, setTransferOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<AccountRow | null>(null);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  const activeAccounts = accounts.filter((a) => !a.archived);
  const totalBalance = activeAccounts.reduce((s, a) => s + a.balance, 0);

  async function handleArchive(id: string, archived: boolean) {
    setBusy(true);
    try {
      await archiveAccount(id, archived);
      toast({ title: archived ? "Conta arquivada" : "Conta reativada", variant: "success" });
      refresh();
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!deletingId) return;
    setBusy(true);
    try {
      await deleteAccount(deletingId);
      toast({ title: "Conta excluída", variant: "success" });
      refresh();
    } catch (err) {
      toast({ title: err instanceof Error ? err.message : "Erro ao excluir", variant: "destructive" });
    } finally {
      setBusy(false);
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="rounded-xl bg-surface-muted px-4 py-2.5">
          <p className="text-xs text-muted-foreground">Saldo total em contas</p>
          <Money value={totalBalance} className="text-lg font-semibold" colorize={false} />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setTransferOpen(true)} disabled={activeAccounts.length < 2}>
            <ArrowLeftRight className="h-4 w-4" /> Transferir
          </Button>
          <Button
            onClick={() => {
              setEditing(null);
              setModalOpen(true);
            }}
          >
            <Plus className="h-4 w-4" /> Nova conta
          </Button>
        </div>
      </div>

      {accounts.length === 0 ? (
        <EmptyState
          icon={Landmark}
          title="Nenhuma conta cadastrada"
          description="Cadastre suas contas bancárias, carteiras e dinheiro físico para começar a controlar seu saldo."
          action={
            <Button onClick={() => setModalOpen(true)}>
              <Plus className="h-4 w-4" /> Nova conta
            </Button>
          }
        />
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {accounts.map((a) => (
            <Card key={a.id} className={a.archived ? "opacity-60" : ""}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: `${a.color}22`, color: a.color }}>
                      <Landmark className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="font-medium text-foreground">{a.name}</p>
                      <p className="text-xs text-muted-foreground">{a.institution || ACCOUNT_TYPES[a.type as keyof typeof ACCOUNT_TYPES]}</p>
                    </div>
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
                          setEditing(a);
                          setModalOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" /> Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleArchive(a.id, !a.archived)} disabled={busy}>
                        {a.archived ? <ArchiveRestore className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
                        {a.archived ? "Reativar" : "Arquivar"}
                      </DropdownMenuItem>
                      <DropdownMenuItem destructive onClick={() => setDeletingId(a.id)}>
                        <Trash2 className="h-4 w-4" /> Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <p className="mt-4 text-2xl font-semibold tabular-nums">
                  <Money value={a.balance} colorize={false} />
                </p>

                <div className="mt-3 flex items-center gap-2">
                  <Badge variant={a.archived ? "default" : "positive"}>{a.archived ? "Arquivada" : "Ativa"}</Badge>
                  <span className="text-xs text-muted-foreground">{a.transactionCount} lançamentos</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AccountModal open={modalOpen} onOpenChange={setModalOpen} account={editing} />
      <TransferModal open={transferOpen} onOpenChange={setTransferOpen} accounts={activeAccounts} />
      <ConfirmationModal
        open={!!deletingId}
        onOpenChange={(o) => !o && setDeletingId(null)}
        title="Excluir conta?"
        description="Só é possível excluir contas sem lançamentos vinculados."
        onConfirm={handleDelete}
        loading={busy}
      />
    </div>
  );
}
