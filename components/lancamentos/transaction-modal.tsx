"use client";
import * as React from "react";
import { useActionRefresh } from "@/hooks/use-action-refresh";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { CurrencyInput } from "@/components/shared/currency-input";
import { PAYMENT_METHODS, TRANSACTION_STATUSES, RECURRENCE_FREQUENCIES, type PaymentMethod, type TransactionStatus, type RecurrenceFrequency } from "@/lib/constants";
import { createTransaction, updateTransaction, deleteTransaction } from "@/lib/actions/transactions";
import { toast } from "@/hooks/use-toast";
import { playCashRegisterSound } from "@/lib/sound";
import type { TransactionWithRelations } from "@/lib/queries/transactions";
import { Loader2, Trash2 } from "lucide-react";
import { ConfirmationModal } from "@/components/shared/confirmation-modal";

interface Account {
  id: string;
  name: string;
  type: string;
  archived: boolean;
}
interface Category {
  id: string;
  name: string;
  kind: string;
}
interface CreditCard {
  id: string;
  name: string;
  closingDay: number;
}

type TxType = "INCOME" | "EXPENSE" | "TRANSFER";

interface TransactionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultType: TxType;
  editing: TransactionWithRelations | null;
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function TransactionModal({ open, onOpenChange, defaultType, editing }: TransactionModalProps) {
  const { refresh } = useActionRefresh();
  const [accounts, setAccounts] = React.useState<Account[]>([]);
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [cards, setCards] = React.useState<CreditCard[]>([]);
  const [loadingRefs, setLoadingRefs] = React.useState(false);

  const [type, setType] = React.useState<TxType>(defaultType);
  const [description, setDescription] = React.useState("");
  const [amount, setAmount] = React.useState(0);
  const [date, setDate] = React.useState(todayISO());
  const [categoryId, setCategoryId] = React.useState<string>("");
  const [accountId, setAccountId] = React.useState<string>("");
  const [transferToAccountId, setTransferToAccountId] = React.useState<string>("");
  const [paymentMethod, setPaymentMethod] = React.useState("PIX");
  const [creditCardId, setCreditCardId] = React.useState<string>("");
  const [status, setStatus] = React.useState("PAGO");
  const [notes, setNotes] = React.useState("");
  const [isRecurring, setIsRecurring] = React.useState(false);
  const [frequency, setFrequency] = React.useState<"SEMANAL" | "QUINZENAL" | "MENSAL" | "ANUAL">("MENSAL");
  const [endDate, setEndDate] = React.useState("");
  const [occurrences, setOccurrences] = React.useState<string>("");
  const [isInstallment, setIsInstallment] = React.useState(false);
  const [installmentsCount, setInstallmentsCount] = React.useState<string>("2");

  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setLoadingRefs(true);
    Promise.all([
      fetch("/api/accounts").then((r) => r.json()),
      fetch("/api/categories").then((r) => r.json()),
      fetch("/api/credit-cards").then((r) => r.json()),
    ])
      .then(([a, c, cc]) => {
        setAccounts(a);
        setCategories(c);
        setCards(cc);
      })
      .finally(() => setLoadingRefs(false));
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    if (editing) {
      setType(editing.type as TxType);
      setDescription(editing.description);
      setAmount(editing.amount);
      setDate(new Date(editing.date).toISOString().slice(0, 10));
      setCategoryId(editing.categoryId ?? "");
      setAccountId(editing.accountId ?? "");
      setTransferToAccountId(editing.transferToAccountId ?? "");
      setPaymentMethod(editing.paymentMethod);
      setCreditCardId(editing.creditCardId ?? "");
      setStatus(editing.status);
      setNotes(editing.notes ?? "");
      setIsRecurring(false);
      setIsInstallment(false);
      setInstallmentsCount("2");
    } else {
      setType(defaultType);
      setDescription("");
      setAmount(0);
      setDate(todayISO());
      setCategoryId("");
      setAccountId("");
      setTransferToAccountId("");
      setPaymentMethod("PIX");
      setCreditCardId("");
      setStatus("PAGO");
      setNotes("");
      setIsRecurring(false);
      setFrequency("MENSAL");
      setEndDate("");
      setOccurrences("");
      setIsInstallment(false);
      setInstallmentsCount("2");
    }
    setError(null);
  }, [open, editing, defaultType]);

  const isCreditExpense = type === "EXPENSE" && paymentMethod === "CREDITO";

  React.useEffect(() => {
    if (!isCreditExpense) setIsInstallment(false);
  }, [isCreditExpense]);

  const filteredCategories = categories.filter((c) => c.kind === (type === "INCOME" ? "INCOME" : "EXPENSE"));
  const activeAccounts = accounts.filter((a) => !a.archived);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const payload = {
        type,
        description,
        amount,
        date,
        categoryId: type === "TRANSFER" ? null : categoryId || null,
        accountId: type === "TRANSFER" ? accountId : paymentMethod === "CREDITO" ? null : accountId || null,
        transferToAccountId: type === "TRANSFER" ? transferToAccountId : null,
        paymentMethod: type === "TRANSFER" ? ("TRANSFERENCIA" as const) : (paymentMethod as PaymentMethod),
        status: status as TransactionStatus,
        notes: notes || null,
        isRecurring: type !== "TRANSFER" && !isCreditExpense && isRecurring,
        recurrence: !isCreditExpense && isRecurring
          ? { frequency, endDate: endDate || null, occurrences: occurrences ? Number(occurrences) : null }
          : null,
        creditCardId: paymentMethod === "CREDITO" ? creditCardId : null,
        isInstallment: isCreditExpense && isInstallment,
        installmentsCount: isCreditExpense && isInstallment ? Number(installmentsCount) : null,
      };

      if (editing) {
        await updateTransaction(editing.id, payload);
        toast({ title: "Lançamento atualizado", variant: "success" });
      } else {
        await createTransaction(payload);
        toast({ title: "Lançamento criado", variant: "success" });
        if (type === "INCOME") playCashRegisterSound();
      }
      onOpenChange(false);
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível salvar o lançamento");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!editing) return;
    setSaving(true);
    try {
      await deleteTransaction(editing.id);
      toast({ title: "Lançamento excluído", variant: "success" });
      setConfirmDeleteOpen(false);
      onOpenChange(false);
      refresh();
    } catch {
      toast({ title: "Erro ao excluir", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>{editing ? "Editar lançamento" : "Novo lançamento"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Tabs value={type} onValueChange={(v) => setType(v as TxType)}>
            <TabsList className="w-full grid grid-cols-3">
              <TabsTrigger value="EXPENSE">Despesa</TabsTrigger>
              <TabsTrigger value="INCOME">Receita</TabsTrigger>
              <TabsTrigger value="TRANSFER">Transferência</TabsTrigger>
            </TabsList>
          </Tabs>

          <div>
            <Label htmlFor="description">Descrição</Label>
            <Input id="description" required value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ex: Supermercado" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="amount">Valor</Label>
              <CurrencyInput id="amount" value={amount} onChange={setAmount} />
            </div>
            <div>
              <Label htmlFor="date">Data</Label>
              <Input id="date" type="date" required value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>

          {type !== "TRANSFER" && (
            <div>
              <Label>Categoria</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {filteredCategories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {type === "TRANSFER" ? (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>De</Label>
                <Select value={accountId} onValueChange={setAccountId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Conta de origem" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeAccounts.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Para</Label>
                <Select value={transferToAccountId} onValueChange={setTransferToAccountId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Conta de destino" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeAccounts.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Forma de pagamento</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PAYMENT_METHODS)
                      .filter(([key]) => key !== "TRANSFERENCIA")
                      .map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              {paymentMethod === "CREDITO" ? (
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
              ) : (
                <div>
                  <Label>Conta</Label>
                  <Select value={accountId} onValueChange={setAccountId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a conta" />
                    </SelectTrigger>
                    <SelectContent>
                      {activeAccounts.map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}

          {type !== "TRANSFER" && (
            <div>
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TRANSACTION_STATUSES).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label htmlFor="notes">Observação (opcional)</Label>
            <Input id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Detalhes adicionais" />
          </div>

          {isCreditExpense && !editing && (
            <div className="rounded-lg border border-border p-3 space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="installment" className="mb-0">
                  Compra parcelada
                </Label>
                <Switch id="installment" checked={isInstallment} onCheckedChange={setIsInstallment} />
              </div>
              {isInstallment && (
                <div>
                  <Label className="text-xs">Número de parcelas</Label>
                  <Input
                    type="number"
                    min={2}
                    max={48}
                    value={installmentsCount}
                    onChange={(e) => setInstallmentsCount(e.target.value)}
                    placeholder="Ex: 12"
                  />
                  {amount > 0 && Number(installmentsCount) >= 2 && (
                    <p className="mt-1.5 text-xs text-muted-foreground">
                      {Number(installmentsCount)}x de{" "}
                      <span className="font-medium text-foreground">
                        {(amount / Number(installmentsCount)).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                      </span>
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {!isCreditExpense && type !== "TRANSFER" && !editing && (
            <div className="rounded-lg border border-border p-3 space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="recurring" className="mb-0">
                  Lançamento recorrente
                </Label>
                <Switch id="recurring" checked={isRecurring} onCheckedChange={setIsRecurring} />
              </div>
              {isRecurring && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Frequência</Label>
                    <Select value={frequency} onValueChange={(v) => setFrequency(v as RecurrenceFrequency)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(RECURRENCE_FREQUENCIES).map(([key, label]) => (
                          <SelectItem key={key} value={key}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Data final (opcional)</Label>
                    <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs">Número de repetições (opcional, padrão 12)</Label>
                    <Input type="number" min={1} max={60} value={occurrences} onChange={(e) => setOccurrences(e.target.value)} placeholder="12" />
                  </div>
                </div>
              )}
            </div>
          )}

          {error && <p className="text-sm text-negative">{error}</p>}

          <DialogFooter className="justify-between sm:justify-between">
            {editing ? (
              <Button type="button" variant="ghost" className="text-negative hover:bg-negative-bg" onClick={() => setConfirmDeleteOpen(true)} disabled={saving}>
                <Trash2 className="h-4 w-4" /> Excluir
              </Button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving || loadingRefs}>
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Salvar
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>

      {editing && (
        <ConfirmationModal
          open={confirmDeleteOpen}
          onOpenChange={setConfirmDeleteOpen}
          title="Excluir lançamento?"
          description="Essa ação não pode ser desfeita."
          onConfirm={handleDelete}
          loading={saving}
        />
      )}
    </Dialog>
  );
}
