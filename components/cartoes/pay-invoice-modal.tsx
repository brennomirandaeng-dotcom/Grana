"use client";
import * as React from "react";
import { useActionRefresh } from "@/hooks/use-action-refresh";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { CurrencyInput } from "@/components/shared/currency-input";
import { payInvoice } from "@/lib/actions/credit-cards";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export function PayInvoiceModal({
  open,
  onOpenChange,
  creditCardId,
  invoiceMonth,
  suggestedAmount,
  accounts,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  creditCardId: string;
  invoiceMonth: string;
  suggestedAmount: number;
  accounts: { id: string; name: string }[];
}) {
  const { refresh } = useActionRefresh();
  const [accountId, setAccountId] = React.useState("");
  const [amount, setAmount] = React.useState(suggestedAmount);
  const [paidDate, setPaidDate] = React.useState(() => new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setAmount(suggestedAmount);
      setAccountId("");
      setPaidDate(new Date().toISOString().slice(0, 10));
      setError(null);
    }
  }, [open, suggestedAmount]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await payInvoice(creditCardId, invoiceMonth, accountId, amount, paidDate);
      toast({ title: "Fatura paga", variant: "success" });
      onOpenChange(false);
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao pagar fatura");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>Pagar fatura</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Conta de pagamento</Label>
            <Select value={accountId} onValueChange={setAccountId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a conta" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Valor</Label>
              <CurrencyInput value={amount} onChange={setAmount} />
            </div>
            <div>
              <Label>Data do pagamento</Label>
              <Input type="date" required value={paidDate} onChange={(e) => setPaidDate(e.target.value)} />
            </div>
          </div>

          {error && <p className="text-sm text-negative">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving || !accountId}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Confirmar pagamento
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
