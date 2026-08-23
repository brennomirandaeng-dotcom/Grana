"use client";
import * as React from "react";
import { useActionRefresh } from "@/hooks/use-action-refresh";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { CurrencyInput } from "@/components/shared/currency-input";
import { confirmExpectedIncome } from "@/lib/actions/expected-income";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface Account {
  id: string;
  name: string;
  archived: boolean;
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function ConfirmIncomeModal({
  open,
  onOpenChange,
  expectedIncomeId,
  description,
  predictedAmount,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expectedIncomeId: string;
  description: string;
  predictedAmount: number;
}) {
  const { refresh } = useActionRefresh();
  const [accounts, setAccounts] = React.useState<Account[]>([]);
  const [accountId, setAccountId] = React.useState("");
  const [amount, setAmount] = React.useState(predictedAmount);
  const [receivedDate, setReceivedDate] = React.useState(todayISO());
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [prevOpen, setPrevOpen] = React.useState(open);

  // Reseta o formulário ao abrir, ajustando o estado durante a própria
  // renderização (em vez de um efeito) — evita uma renderização extra.
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setAccountId("");
      setAmount(predictedAmount);
      setReceivedDate(todayISO());
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
      await confirmExpectedIncome(expectedIncomeId, { accountId, receivedDate, amount });
      toast({ title: "Receita confirmada", variant: "success" });
      onOpenChange(false);
      refresh("Confirmando receita...");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível confirmar a receita");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>Confirmar recebimento</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Valor recebido</Label>
            <CurrencyInput value={amount} onChange={setAmount} autoFocus />
          </div>
          <div>
            <Label>Em qual conta o dinheiro entrou?</Label>
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
            <Label htmlFor="confirm-income-date">Data em que recebeu</Label>
            <Input id="confirm-income-date" type="date" required value={receivedDate} onChange={(e) => setReceivedDate(e.target.value)} />
          </div>

          {error && <p className="text-sm text-negative">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving || !accountId || amount <= 0}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {saving ? "Confirmando..." : "Confirmar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
