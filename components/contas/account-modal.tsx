"use client";
import * as React from "react";
import { useActionRefresh } from "@/hooks/use-action-refresh";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { CurrencyInput } from "@/components/shared/currency-input";
import { ACCOUNT_TYPES, type AccountType } from "@/lib/constants";
import { createAccount, updateAccount } from "@/lib/actions/accounts";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const COLORS = ["#10b981", "#8b5cf6", "#f97316", "#0ea5e9", "#ef4444", "#f59e0b", "#64748b"];

interface AccountModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account?: { id: string; name: string; institution: string | null; type: string; initialBalance: number; color: string } | null;
}

export function AccountModal({ open, onOpenChange, account }: AccountModalProps) {
  const { refresh } = useActionRefresh();
  const [name, setName] = React.useState("");
  const [institution, setInstitution] = React.useState("");
  const [type, setType] = React.useState("CHECKING");
  const [initialBalance, setInitialBalance] = React.useState(0);
  const [color, setColor] = React.useState(COLORS[0]);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) return;
    if (account) {
      setName(account.name);
      setInstitution(account.institution ?? "");
      setType(account.type);
      setInitialBalance(account.initialBalance);
      setColor(account.color);
    } else {
      setName("");
      setInstitution("");
      setType("CHECKING");
      setInitialBalance(0);
      setColor(COLORS[0]);
    }
    setError(null);
  }, [open, account]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = { name, institution: institution || null, type: type as AccountType, initialBalance, color };
      if (account) {
        await updateAccount(account.id, payload);
        toast({ title: "Conta atualizada", variant: "success" });
      } else {
        await createAccount(payload);
        toast({ title: "Conta criada", variant: "success" });
      }
      onOpenChange(false);
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar conta");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>{account ? "Editar conta" : "Nova conta"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="acc-name">Nome</Label>
            <Input id="acc-name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Nubank" />
          </div>
          <div>
            <Label htmlFor="acc-institution">Instituição (opcional)</Label>
            <Input id="acc-institution" value={institution} onChange={(e) => setInstitution(e.target.value)} placeholder="Ex: Nu Pagamentos" />
          </div>
          <div>
            <Label>Tipo</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(ACCOUNT_TYPES).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="acc-balance">Saldo inicial</Label>
            <CurrencyInput id="acc-balance" value={initialBalance} onChange={setInitialBalance} />
          </div>
          <div>
            <Label>Cor</Label>
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="h-7 w-7 rounded-full ring-offset-2 ring-offset-surface"
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
