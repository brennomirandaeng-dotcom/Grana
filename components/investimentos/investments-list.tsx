"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Money } from "@/components/shared/money";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmationModal } from "@/components/shared/confirmation-modal";
import { InvestmentModal } from "@/components/investimentos/investment-modal";
import { PortfolioChart } from "@/components/investimentos/portfolio-chart";
import { deleteInvestment } from "@/lib/actions/investments";
import { toast } from "@/hooks/use-toast";
import { INVESTMENT_CATEGORIES } from "@/lib/constants";
import { formatCurrency, formatPercent } from "@/lib/format";
import { round2 } from "@/lib/finance";
import { TrendingUp, Plus, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";

export interface InvestmentRow {
  id: string;
  name: string;
  category: string;
  investedAmount: number;
  currentAmount: number;
  date: Date | string;
  notes: string | null;
}

export function InvestmentsList({ investments }: { investments: InvestmentRow[] }) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<InvestmentRow | null>(null);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  const totalInvested = round2(investments.reduce((s, i) => s + i.investedAmount, 0));
  const totalCurrent = round2(investments.reduce((s, i) => s + i.currentAmount, 0));
  const totalProfit = round2(totalCurrent - totalInvested);
  const totalProfitPercent = totalInvested > 0 ? round2((totalProfit / totalInvested) * 100) : 0;

  const byCategory = Object.entries(
    investments.reduce<Record<string, number>>((acc, i) => {
      acc[i.category] = round2((acc[i.category] ?? 0) + i.currentAmount);
      return acc;
    }, {})
  ).map(([category, total]) => ({ category, total }));

  async function handleDelete() {
    if (!deletingId) return;
    setBusy(true);
    try {
      await deleteInvestment(deletingId);
      toast({ title: "Investimento excluído", variant: "success" });
      router.refresh();
    } finally {
      setBusy(false);
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground">Valor investido</p>
            <p className="text-xl font-semibold mt-1">{formatCurrency(totalInvested)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground">Valor atual</p>
            <p className="text-xl font-semibold mt-1">{formatCurrency(totalCurrent)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground">Lucro / Prejuízo</p>
            <Money value={totalProfit} className="text-xl font-semibold mt-1 block" />
            <p className={`text-xs mt-0.5 ${totalProfit >= 0 ? "text-positive" : "text-negative"}`}>{totalProfit >= 0 ? "+" : ""}{formatPercent(totalProfitPercent)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button
          onClick={() => {
            setEditing(null);
            setModalOpen(true);
          }}
        >
          <Plus className="h-4 w-4" /> Novo investimento
        </Button>
      </div>

      {investments.length === 0 ? (
        <EmptyState
          icon={TrendingUp}
          title="Nenhum investimento cadastrado"
          description="Registre seus investimentos para acompanhar rentabilidade e composição da carteira."
          action={
            <Button onClick={() => setModalOpen(true)}>
              <Plus className="h-4 w-4" /> Novo investimento
            </Button>
          }
        />
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Composição da carteira</CardTitle>
            </CardHeader>
            <CardContent>
              <PortfolioChart data={byCategory} />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead className="text-right">Investido</TableHead>
                    <TableHead className="text-right">Atual</TableHead>
                    <TableHead className="text-right">Rentabilidade</TableHead>
                    <TableHead className="text-right">% carteira</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {investments.map((inv) => {
                    const profit = round2(inv.currentAmount - inv.investedAmount);
                    const profitPercent = inv.investedAmount > 0 ? round2((profit / inv.investedAmount) * 100) : 0;
                    const portfolioPercent = totalCurrent > 0 ? round2((inv.currentAmount / totalCurrent) * 100) : 0;
                    return (
                      <TableRow key={inv.id}>
                        <TableCell className="font-medium text-foreground">{inv.name}</TableCell>
                        <TableCell className="text-muted-foreground">{INVESTMENT_CATEGORIES[inv.category as keyof typeof INVESTMENT_CATEGORIES]}</TableCell>
                        <TableCell className="text-right">{formatCurrency(inv.investedAmount)}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(inv.currentAmount)}</TableCell>
                        <TableCell className="text-right">
                          <Money value={profit} showSign className="text-sm" />
                          <span className={`block text-xs ${profit >= 0 ? "text-positive" : "text-negative"}`}>
                            {profit >= 0 ? "+" : ""}
                            {formatPercent(profitPercent)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">{formatPercent(portfolioPercent)}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="iconSm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => {
                                  setEditing(inv);
                                  setModalOpen(true);
                                }}
                              >
                                <Pencil className="h-4 w-4" /> Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem destructive onClick={() => setDeletingId(inv.id)}>
                                <Trash2 className="h-4 w-4" /> Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}

      <InvestmentModal open={modalOpen} onOpenChange={setModalOpen} investment={editing} />
      <ConfirmationModal open={!!deletingId} onOpenChange={(o) => !o && setDeletingId(null)} title="Excluir investimento?" onConfirm={handleDelete} loading={busy} />
    </div>
  );
}
