"use client";
import * as React from "react";
import { useActionRefresh } from "@/hooks/use-action-refresh";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { CurrencyInput } from "@/components/shared/currency-input";
import { LIABILITY_TYPES, type LiabilityType } from "@/lib/constants";
import { createLiability, updateLiability } from "@/lib/actions/net-worth";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface LiabilityModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  liability?: {
    id: string;
    name: string;
    type: string;
    originalAmount: number;
    remainingAmount: number;
    installmentsCount: number | null;
    installmentsPaid: number;
    interestRate: number | null;
    dueDate: Date | string | null;
  } | null;
}

export function LiabilityModal({ open, onOpenChange, liability }: LiabilityModalProps) {
  const { refresh } = useActionRefresh();
  const [name, setName] = React.useState("");
  const [type, setType] = React.useState("EMPRESTIMO");
  const [originalAmount, setOriginalAmount] = React.useState(0);
  const [remainingAmount, setRemainingAmount] = React.useState(0);
  const [installmentsCount, setInstallmentsCount] = React.useState("");
  const [installmentsPaid, setInstallmentsPaid] = React.useState("0");
  const [interestRate, setInterestRate] = React.useState("");
  const [dueDate, setDueDate] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) return;
    if (liability) {
      setName(liability.name);
      setType(liability.type);
      setOriginalAmount(liability.originalAmount);
      setRemainingAmount(liability.remainingAmount);
      setInstallmentsCount(liability.installmentsCount ? String(liability.installmentsCount) : "");
      setInstallmentsPaid(String(liability.installmentsPaid));
      setInterestRate(liability.interestRate ? String(liability.interestRate) : "");
      setDueDate(liability.dueDate ? new Date(liability.dueDate).toISOString().slice(0, 10) : "");
    } else {
      setName("");
      setType("EMPRESTIMO");
      setOriginalAmount(0);
      setRemainingAmount(0);
      setInstallmentsCount("");
      setInstallmentsPaid("0");
      setInterestRate("");
      setDueDate("");
    }
    setError(null);
  }, [open, liability]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = {
        name,
        type: type as LiabilityType,
        originalAmount,
        remainingAmount,
        installmentsCount: installmentsCount ? Number(installmentsCount) : null,
        installmentsPaid: Number(installmentsPaid) || 0,
        interestRate: interestRate ? Number(interestRate) : null,
        dueDate: dueDate || null,
      };
      if (liability) {
        await updateLiability(liability.id, payload);
        toast({ title: "Dívida atualizada", variant: "success" });
      } else {
        await createLiability(payload);
        toast({ title: "Dívida adicionada", variant: "success" });
      }
      onOpenChange(false);
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>{liability ? "Editar dívida" : "Nova dívida"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="liab-name">Nome</Label>
            <Input id="liab-name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Financiamento do carro" />
          </div>
          <div>
            <Label>Tipo</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(LIABILITY_TYPES).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Valor original</Label>
              <CurrencyInput value={originalAmount} onChange={setOriginalAmount} />
            </div>
            <div>
              <Label>Saldo devedor</Label>
              <CurrencyInput value={remainingAmount} onChange={setRemainingAmount} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="liab-count">Parcelas totais</Label>
              <Input id="liab-count" type="number" min={1} value={installmentsCount} onChange={(e) => setInstallmentsCount(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="liab-paid">Parcelas pagas</Label>
              <Input id="liab-paid" type="number" min={0} value={installmentsPaid} onChange={(e) => setInstallmentsPaid(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="liab-rate">Taxa de juros (% a.m., opcional)</Label>
              <Input id="liab-rate" type="number" step="0.01" value={interestRate} onChange={(e) => setInterestRate(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="liab-due">Vencimento (opcional)</Label>
              <Input id="liab-due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
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
