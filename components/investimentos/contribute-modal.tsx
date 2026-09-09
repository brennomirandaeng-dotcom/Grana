"use client";
import * as React from "react";
import { useActionRefresh } from "@/hooks/use-action-refresh";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { CurrencyInput } from "@/components/shared/currency-input";
import { contributeInvestment } from "@/lib/actions/investments";
import { toast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/format";
import { Loader2 } from "lucide-react";

interface Account {
  id: string;
  name: string;
  archived: boolean;
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function ContributeModal({
  open,
  onOpenChange,
  investmentId,
  investmentName,
  currentAmount,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  investmentId: string;
  investmentName: string;
  currentAmount: number;
}) {
  const { refresh } = useActionRefresh();
  const [accounts, setAccounts] = React.useState<Account[]>([]);
  const [amount, setAmount] = React.useState(0);
  const [accountId, setAccountId] = React.useState("");
  const [date, setDate] = React.useState(todayISO());
  const [notes, setNotes] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [prevOpen, setPrevOpen] = React.useState(open);

  // Reseta o formulário ao abrir, ajustando o estado durante a própria
  // renderização (em vez de um efeito) — evita uma renderização extra.
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setAmount(0);
      setAccountId("");
      setDate(todayISO());
      setNotes("");
      setError(null);
    }
  }

  React.useEffect(() => {
    if (!open) return;
    fetch("/api/accounts")
      .then((r) => r.json())
      .then(setAccounts);
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await contributeInvestment(investmentId, { amount, accountId, date, notes: notes || null });
      toast({ title: "Aporte registrado", variant: "success" });
      onOpenChange(false);
      refresh("Registrando aporte...");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível registrar o aporte");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>Aportar em investimento</DialogTitle>
          <DialogDescription>
            {investmentName} · valor atual {formatCurrency(currentAmount)}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Valor do aporte</Label>
            <CurrencyInput value={amount} onChange={setAmount} autoFocus />
          </div>
          <div>
            <Label>De qual conta saiu o dinheiro?</Label>
            <Select value={accountId} onValueChange={setAccountId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a conta" />
              </SelectTrigger>
              <SelectContent>
                {accounts.filter((a) => !a.archived).map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Data</Label>
            <Input type="date" required value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <Label>Observação (opcional)</Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Detalhes adicionais" />
          </div>

          {error && <p className="text-sm text-negative">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving || amount <= 0 || !accountId}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {saving ? "Registrando..." : "Confirmar aporte"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
