"use client";
import * as React from "react";
import { useActionRefresh } from "@/hooks/use-action-refresh";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { CurrencyInput } from "@/components/shared/currency-input";
import { createInstallmentPurchase } from "@/lib/actions/credit-cards";
import { toast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/format";
import { Loader2 } from "lucide-react";

interface CardOption {
  id: string;
  name: string;
}
interface CategoryOption {
  id: string;
  name: string;
}

export function InstallmentPurchaseModal({
  open,
  onOpenChange,
  cards,
  categories,
  defaultCardId,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  cards: CardOption[];
  categories: CategoryOption[];
  defaultCardId?: string;
}) {
  const { refresh } = useActionRefresh();
  const [creditCardId, setCreditCardId] = React.useState(defaultCardId ?? "");
  const [description, setDescription] = React.useState("");
  const [totalAmount, setTotalAmount] = React.useState(0);
  const [installmentsCount, setInstallmentsCount] = React.useState("1");
  const [categoryId, setCategoryId] = React.useState("");
  const [purchaseDate, setPurchaseDate] = React.useState(() => new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setCreditCardId(defaultCardId ?? "");
      setDescription("");
      setTotalAmount(0);
      setInstallmentsCount("1");
      setCategoryId("");
      setPurchaseDate(new Date().toISOString().slice(0, 10));
      setError(null);
    }
  }, [open, defaultCardId]);

  const count = Math.max(1, Number(installmentsCount) || 1);
  const perInstallment = totalAmount / count;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await createInstallmentPurchase({
        creditCardId,
        description,
        totalAmount,
        installmentsCount: count,
        categoryId: categoryId || null,
        purchaseDate,
      });
      toast({ title: "Compra parcelada registrada", variant: "success" });
      onOpenChange(false);
      refresh("Registrando parcelas...");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao registrar compra");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>Nova compra no cartão</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Cartão</Label>
            <Select value={creditCardId} onValueChange={setCreditCardId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o cartão" />
              </SelectTrigger>
              <SelectContent>
                {cards.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="ip-desc">Descrição</Label>
            <Input id="ip-desc" required value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ex: Notebook" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Valor total</Label>
              <CurrencyInput value={totalAmount} onChange={setTotalAmount} />
            </div>
            <div>
              <Label htmlFor="ip-installments">Parcelas</Label>
              <Input id="ip-installments" type="number" min={1} max={48} value={installmentsCount} onChange={(e) => setInstallmentsCount(e.target.value)} />
            </div>
          </div>
          {totalAmount > 0 && count > 1 && (
            <p className="text-xs text-muted-foreground">
              {count}x de {formatCurrency(perInstallment)}
            </p>
          )}
          <div>
            <Label>Categoria</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="ip-date">Data da compra</Label>
            <Input id="ip-date" type="date" required value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} />
          </div>

          {error && <p className="text-sm text-negative">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving || !creditCardId}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
