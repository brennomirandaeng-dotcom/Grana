"use client";
import * as React from "react";
import { useActionRefresh } from "@/hooks/use-action-refresh";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CurrencyInput } from "@/components/shared/currency-input";
import { createGoal, updateGoal } from "@/lib/actions/goals";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const COLORS = ["#f59e0b", "#10b981", "#6366f1", "#0ea5e9", "#ef4444", "#8b5cf6", "#ec4899"];

interface GoalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goal?: { id: string; name: string; targetAmount: number; deadline: Date | string | null; color: string } | null;
}

export function GoalModal({ open, onOpenChange, goal }: GoalModalProps) {
  const { refresh } = useActionRefresh();
  const [name, setName] = React.useState("");
  const [targetAmount, setTargetAmount] = React.useState(0);
  const [currentAmount, setCurrentAmount] = React.useState(0);
  const [deadline, setDeadline] = React.useState("");
  const [color, setColor] = React.useState(COLORS[0]);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) return;
    if (goal) {
      setName(goal.name);
      setTargetAmount(goal.targetAmount);
      setCurrentAmount(0);
      setDeadline(goal.deadline ? new Date(goal.deadline).toISOString().slice(0, 10) : "");
      setColor(goal.color);
    } else {
      setName("");
      setTargetAmount(0);
      setCurrentAmount(0);
      setDeadline("");
      setColor(COLORS[0]);
    }
    setError(null);
  }, [open, goal]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = { name, targetAmount, currentAmount, deadline: deadline || null, color, icon: "Target" };
      if (goal) {
        await updateGoal(goal.id, payload);
        toast({ title: "Meta atualizada", variant: "success" });
      } else {
        await createGoal(payload);
        toast({ title: "Meta criada", variant: "success" });
      }
      onOpenChange(false);
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar meta");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>{goal ? "Editar meta" : "Nova meta"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="goal-name">Nome da meta</Label>
            <Input id="goal-name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Comprar carro" />
          </div>
          <div>
            <Label>Valor objetivo</Label>
            <CurrencyInput value={targetAmount} onChange={setTargetAmount} />
          </div>
          {!goal && (
            <div>
              <Label>Já guardado (opcional)</Label>
              <CurrencyInput value={currentAmount} onChange={setCurrentAmount} />
            </div>
          )}
          <div>
            <Label htmlFor="goal-deadline">Prazo (opcional)</Label>
            <Input id="goal-deadline" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
          </div>
          <div>
            <Label>Cor</Label>
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button key={c} type="button" onClick={() => setColor(c)} className="h-7 w-7 rounded-full" style={{ background: c, boxShadow: color === c ? `0 0 0 2px ${c}` : undefined }} />
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
