"use client";
import * as React from "react";
import { useActionRefresh } from "@/hooks/use-action-refresh";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { CurrencyInput } from "@/components/shared/currency-input";
import { transferInvestment } from "@/lib/actions/investments";
import { toast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/format";
import { Loader2 } from "lucide-react";

interface InvestmentOption {
  id: string;
  name: string;
}

export function TransferInvestmentModal({
  open,
  onOpenChange,
  investmentId,
  investmentName,
  currentAmount,
  otherInvestments,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  investmentId: string;
  investmentName: string;
  currentAmount: number;
  otherInvestments: InvestmentOption[];
}) {
  const { refresh } = useActionRefresh();
  const [amount, setAmount] = React.useState(0);
  const [toInvestmentId, setToInvestmentId] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [prevOpen, setPrevOpen] = React.useState(open);

  // Reseta o formulário ao abrir, ajustando o estado durante a própria
  // renderização (em vez de um efeito) — evita uma renderização extra.
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setAmount(0);
      setToInvestmentId("");
      setError(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await transferInvestment(investmentId, { amount, toInvestmentId });
      toast({ title: "Transferência registrada", variant: "success" });
      onOpenChange(false);
      refresh("Transferindo investimento...");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível transferir");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>Transferir investimento</DialogTitle>
          <DialogDescription>
            {investmentName} · disponível {formatCurrency(currentAmount)}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Valor a transferir</Label>
            <CurrencyInput value={amount} onChange={setAmount} autoFocus />
          </div>
          <div>
            <Label>Para qual investimento?</Label>
            <Select value={toInvestmentId} onValueChange={setToInvestmentId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o investimento de destino" />
              </SelectTrigger>
              <SelectContent>
                {otherInvestments.map((i) => (
                  <SelectItem key={i.id} value={i.id}>
                    {i.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {error && <p className="text-sm text-negative">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving || amount <= 0 || amount > currentAmount || !toInvestmentId}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {saving ? "Transferindo..." : "Confirmar transferência"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
