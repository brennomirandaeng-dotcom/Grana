"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { CurrencyInput } from "@/components/shared/currency-input";
import { INVESTMENT_CATEGORIES, type InvestmentCategory } from "@/lib/constants";
import { createInvestment, updateInvestment } from "@/lib/actions/investments";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface InvestmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  investment?: { id: string; name: string; category: string; investedAmount: number; currentAmount: number; date: Date | string; notes: string | null } | null;
}

export function InvestmentModal({ open, onOpenChange, investment }: InvestmentModalProps) {
  const router = useRouter();
  const [name, setName] = React.useState("");
  const [category, setCategory] = React.useState("RENDA_FIXA");
  const [investedAmount, setInvestedAmount] = React.useState(0);
  const [currentAmount, setCurrentAmount] = React.useState(0);
  const [date, setDate] = React.useState(() => new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) return;
    if (investment) {
      setName(investment.name);
      setCategory(investment.category);
      setInvestedAmount(investment.investedAmount);
      setCurrentAmount(investment.currentAmount);
      setDate(new Date(investment.date).toISOString().slice(0, 10));
      setNotes(investment.notes ?? "");
    } else {
      setName("");
      setCategory("RENDA_FIXA");
      setInvestedAmount(0);
      setCurrentAmount(0);
      setDate(new Date().toISOString().slice(0, 10));
      setNotes("");
    }
    setError(null);
  }, [open, investment]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = { name, category: category as InvestmentCategory, investedAmount, currentAmount, date, notes: notes || null };
      if (investment) {
        await updateInvestment(investment.id, payload);
        toast({ title: "Investimento atualizado", variant: "success" });
      } else {
        await createInvestment(payload);
        toast({ title: "Investimento adicionado", variant: "success" });
      }
      onOpenChange(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar investimento");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>{investment ? "Editar investimento" : "Novo investimento"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="inv-name">Nome</Label>
            <Input id="inv-name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Tesouro Selic 2029" />
          </div>
          <div>
            <Label>Categoria</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(INVESTMENT_CATEGORIES).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Valor investido</Label>
              <CurrencyInput value={investedAmount} onChange={setInvestedAmount} />
            </div>
            <div>
              <Label>Valor atual</Label>
              <CurrencyInput value={currentAmount} onChange={setCurrentAmount} />
            </div>
          </div>
          <div>
            <Label htmlFor="inv-date">Data do investimento</Label>
            <Input id="inv-date" type="date" required value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="inv-notes">Observações (opcional)</Label>
            <Input id="inv-notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
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
