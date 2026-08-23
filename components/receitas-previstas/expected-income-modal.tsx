"use client";
import * as React from "react";
import { useActionRefresh } from "@/hooks/use-action-refresh";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CurrencyInput } from "@/components/shared/currency-input";
import { createExpectedIncome, updateExpectedIncome } from "@/lib/actions/expected-income";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

interface ExpectedIncomeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expectedIncome?: { id: string; description: string; amount: number; date: Date | string } | null;
}

export function ExpectedIncomeModal({ open, onOpenChange, expectedIncome }: ExpectedIncomeModalProps) {
  const { refresh } = useActionRefresh();
  const [description, setDescription] = React.useState("");
  const [amount, setAmount] = React.useState(0);
  const [date, setDate] = React.useState(todayISO());
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [prevOpen, setPrevOpen] = React.useState(open);

  // Reseta o formulário ao abrir, ajustando o estado durante a própria
  // renderização (em vez de um efeito) — evita uma renderização extra.
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      if (expectedIncome) {
        setDescription(expectedIncome.description);
        setAmount(expectedIncome.amount);
        setDate(new Date(expectedIncome.date).toISOString().slice(0, 10));
      } else {
        setDescription("");
        setAmount(0);
        setDate(todayISO());
      }
      setError(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = { description, amount, date };
      if (expectedIncome) {
        await updateExpectedIncome(expectedIncome.id, payload);
        toast({ title: "Receita prevista atualizada", variant: "success" });
      } else {
        await createExpectedIncome(payload);
        toast({ title: "Receita prevista criada", variant: "success" });
      }
      onOpenChange(false);
      refresh("Salvando receita prevista...");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar receita prevista");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>{expectedIncome ? "Editar receita prevista" : "Nova receita prevista"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="expected-income-description">Descrição</Label>
            <Input
              id="expected-income-description"
              required
              autoFocus
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: 13º salário"
            />
          </div>
          <div>
            <Label>Valor</Label>
            <CurrencyInput value={amount} onChange={setAmount} />
          </div>
          <div>
            <Label htmlFor="expected-income-date">Data prevista</Label>
            <Input id="expected-income-date" type="date" required value={date} onChange={(e) => setDate(e.target.value)} />
          </div>

          {error && <p className="text-sm text-negative">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving || amount <= 0}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
