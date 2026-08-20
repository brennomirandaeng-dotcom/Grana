"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmationModal } from "@/components/shared/confirmation-modal";
import { AssetModal } from "@/components/patrimonio/asset-modal";
import { LiabilityModal } from "@/components/patrimonio/liability-modal";
import { deleteAsset, deleteLiability } from "@/lib/actions/net-worth";
import { toast } from "@/hooks/use-toast";
import { formatCurrency, formatDate } from "@/lib/format";
import { ASSET_TYPES, LIABILITY_TYPES } from "@/lib/constants";
import { Building2, Plus, Trash2, Wallet, Landmark, TrendingUp, CreditCard as CardIcon } from "lucide-react";

export interface AssetRow {
  id: string;
  name: string;
  type: string;
  value: number;
}
export interface LiabilityRow {
  id: string;
  name: string;
  type: string;
  originalAmount: number;
  remainingAmount: number;
  installmentsCount: number | null;
  installmentsPaid: number;
  interestRate: number | null;
  dueDate: Date | string | null;
}

export function NetWorthView({
  cashTotal,
  investmentsTotal,
  cardDebt,
  assets,
  liabilities,
}: {
  cashTotal: number;
  investmentsTotal: number;
  cardDebt: number;
  assets: AssetRow[];
  liabilities: LiabilityRow[];
}) {
  const router = useRouter();
  const [assetModalOpen, setAssetModalOpen] = React.useState(false);
  const [editingAsset, setEditingAsset] = React.useState<AssetRow | null>(null);
  const [liabilityModalOpen, setLiabilityModalOpen] = React.useState(false);
  const [editingLiability, setEditingLiability] = React.useState<LiabilityRow | null>(null);
  const [deleting, setDeleting] = React.useState<{ kind: "asset" | "liability"; id: string } | null>(null);
  const [busy, setBusy] = React.useState(false);

  async function handleDelete() {
    if (!deleting) return;
    setBusy(true);
    try {
      if (deleting.kind === "asset") await deleteAsset(deleting.id);
      else await deleteLiability(deleting.id);
      toast({ title: "Removido com sucesso", variant: "success" });
      router.refresh();
    } finally {
      setBusy(false);
      setDeleting(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* ATIVOS */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Ativos</h2>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setEditingAsset(null);
              setAssetModalOpen(true);
            }}
          >
            <Plus className="h-3.5 w-3.5" /> Novo bem
          </Button>
        </div>
        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <Wallet className="h-3.5 w-3.5" /> Dinheiro e contas
              </div>
              <p className="font-semibold">{formatCurrency(cashTotal)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <TrendingUp className="h-3.5 w-3.5" /> Investimentos
              </div>
              <p className="font-semibold">{formatCurrency(investmentsTotal)}</p>
            </CardContent>
          </Card>
          {assets.map((a) => (
            <Card key={a.id} className="group relative">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                  <Building2 className="h-3.5 w-3.5" /> {ASSET_TYPES[a.type as keyof typeof ASSET_TYPES]}
                </div>
                <p className="font-semibold">{formatCurrency(a.value)}</p>
                <p className="text-xs text-muted-foreground truncate">{a.name}</p>
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 flex gap-1">
                  <button
                    onClick={() => {
                      setEditingAsset(a);
                      setAssetModalOpen(true);
                    }}
                    className="text-xs text-muted-foreground hover:text-foreground underline"
                  >
                    editar
                  </button>
                  <button onClick={() => setDeleting({ kind: "asset", id: a.id })} className="text-muted-foreground hover:text-negative">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* PASSIVOS */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Passivos</h2>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setEditingLiability(null);
              setLiabilityModalOpen(true);
            }}
          >
            <Plus className="h-3.5 w-3.5" /> Nova dívida
          </Button>
        </div>
        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <CardIcon className="h-3.5 w-3.5" /> Dívida em cartões
              </div>
              <p className="font-semibold text-negative">{formatCurrency(cardDebt)}</p>
            </CardContent>
          </Card>
          {liabilities.length === 0 && (
            <div className="sm:col-span-3">
              <EmptyState icon={Landmark} title="Nenhuma outra dívida cadastrada" className="border-none py-6" />
            </div>
          )}
          {liabilities.map((l) => (
            <Card key={l.id} className="group relative">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                  <Landmark className="h-3.5 w-3.5" /> {LIABILITY_TYPES[l.type as keyof typeof LIABILITY_TYPES]}
                </div>
                <p className="font-semibold text-negative">{formatCurrency(l.remainingAmount)}</p>
                <p className="text-xs text-muted-foreground truncate">{l.name}</p>
                {l.installmentsCount && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {l.installmentsPaid}/{l.installmentsCount} parcelas
                  </p>
                )}
                {l.dueDate && <p className="text-xs text-muted-foreground">Vence {formatDate(l.dueDate)}</p>}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 flex gap-1">
                  <button
                    onClick={() => {
                      setEditingLiability(l);
                      setLiabilityModalOpen(true);
                    }}
                    className="text-xs text-muted-foreground hover:text-foreground underline"
                  >
                    editar
                  </button>
                  <button onClick={() => setDeleting({ kind: "liability", id: l.id })} className="text-muted-foreground hover:text-negative">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <AssetModal open={assetModalOpen} onOpenChange={setAssetModalOpen} asset={editingAsset} />
      <LiabilityModal open={liabilityModalOpen} onOpenChange={setLiabilityModalOpen} liability={editingLiability} />
      <ConfirmationModal open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)} title="Remover item?" onConfirm={handleDelete} loading={busy} />
    </div>
  );
}
