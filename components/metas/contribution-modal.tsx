"use client";
import * as React from "react";
import { useActionRefresh } from "@/hooks/use-action-refresh";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CurrencyInput } from "@/components/shared/currency-input";
import { addGoalContribution } from "@/lib/actions/goals";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export function ContributionModal({ open, onOpenChange, goalId, goalName }: { open: boolean; onOpenChange: (o: boolean) => void; goalId: string; goalName: string }) {
  const { refresh } = useActionRefresh();
  const [type, setType] = React.useState<"DEPOSIT" | "WITHDRAW">("DEPOSIT");
  const [amount, setAmount] = React.useState(0);
  const [note, setNote] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setType("DEPOSIT");
      setAmount(0);
      setNote("");
      setError(null);
    }
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await addGoalContribution(goalId, { amount, type, note: note || null });
      toast({ title: type === "DEPOSIT" ? "Depósito adicionado" : "Retirada registrada", variant: "success" });
      onOpenChange(false);
      refresh("Registrando movimento...");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao registrar movimento");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>{goalName}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Tabs value={type} onValueChange={(v) => setType(v as "DEPOSIT" | "WITHDRAW")}>
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="DEPOSIT">Adicionar dinheiro</TabsTrigger>
              <TabsTrigger value="WITHDRAW">Retirar dinheiro</TabsTrigger>
            </TabsList>
          </Tabs>

          <div>
            <Label>Valor</Label>
            <CurrencyInput value={amount} onChange={setAmount} autoFocus />
          </div>
          <div>
            <Label>Observação (opcional)</Label>
            <Input value={note} onChange={(e) => setNote(e.target.value)} />
          </div>

          {error && <p className="text-sm text-negative">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving || amount <= 0}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {saving ? "Registrando..." : "Confirmar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
