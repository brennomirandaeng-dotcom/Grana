"use client";
import * as React from "react";
import { useActionRefresh } from "@/hooks/use-action-refresh";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CurrencyInput } from "@/components/shared/currency-input";
import { createCreditCard, updateCreditCard } from "@/lib/actions/credit-cards";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const COLORS = ["#8b5cf6", "#f97316", "#0ea5e9", "#10b981", "#ef4444", "#f59e0b", "#64748b"];

interface CardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  card?: { id: string; name: string; bank: string; limitAmount: number; closingDay: number; dueDay: number; brand: string; color: string } | null;
}

export function CreditCardModal({ open, onOpenChange, card }: CardModalProps) {
  const { refresh } = useActionRefresh();
  const [name, setName] = React.useState("");
  const [bank, setBank] = React.useState("");
  const [limitAmount, setLimitAmount] = React.useState(0);
  const [closingDay, setClosingDay] = React.useState("5");
  const [dueDay, setDueDay] = React.useState("15");
  const [brand, setBrand] = React.useState("mastercard");
  const [color, setColor] = React.useState(COLORS[0]);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) return;
    if (card) {
      setName(card.name);
      setBank(card.bank);
      setLimitAmount(card.limitAmount);
      setClosingDay(String(card.closingDay));
      setDueDay(String(card.dueDay));
      setBrand(card.brand);
      setColor(card.color);
    } else {
      setName("");
      setBank("");
      setLimitAmount(0);
      setClosingDay("5");
      setDueDay("15");
      setBrand("mastercard");
      setColor(COLORS[0]);
    }
    setError(null);
  }, [open, card]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = { name, bank, limitAmount, closingDay: Number(closingDay), dueDay: Number(dueDay), brand, color };
      if (card) {
        await updateCreditCard(card.id, payload);
        toast({ title: "Cartão atualizado", variant: "success" });
      } else {
        await createCreditCard(payload);
        toast({ title: "Cartão criado", variant: "success" });
      }
      onOpenChange(false);
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar cartão");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>{card ? "Editar cartão" : "Novo cartão"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="card-name">Nome</Label>
              <Input id="card-name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Nubank" />
            </div>
            <div>
              <Label htmlFor="card-bank">Banco</Label>
              <Input id="card-bank" required value={bank} onChange={(e) => setBank(e.target.value)} placeholder="Ex: Nu Pagamentos" />
            </div>
          </div>
          <div>
            <Label>Limite</Label>
            <CurrencyInput value={limitAmount} onChange={setLimitAmount} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="closing-day">Dia de fechamento</Label>
              <Input id="closing-day" type="number" min={1} max={31} required value={closingDay} onChange={(e) => setClosingDay(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="due-day">Dia de vencimento</Label>
              <Input id="due-day" type="number" min={1} max={31} required value={dueDay} onChange={(e) => setDueDay(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Cor</Label>
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="h-7 w-7 rounded-full"
                  style={{ background: c, boxShadow: color === c ? `0 0 0 2px ${c}` : undefined }}
                />
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-negative">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
