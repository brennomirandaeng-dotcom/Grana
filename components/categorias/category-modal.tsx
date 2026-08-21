"use client";
import * as React from "react";
import { useActionRefresh } from "@/hooks/use-action-refresh";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { createCategory, updateCategory } from "@/lib/actions/categories";
import { toast } from "@/hooks/use-toast";
import { CATEGORY_ICON_NAMES, getCategoryIcon } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

const COLORS = ["#6366f1", "#10b981", "#f97316", "#0ea5e9", "#ef4444", "#f59e0b", "#8b5cf6", "#ec4899", "#14b8a6", "#64748b"];

export interface CategoryOption {
  id: string;
  name: string;
  kind: string;
  parentId: string | null;
}

interface CategoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: { id: string; name: string; kind: string; icon: string; color: string; parentId: string | null } | null;
  parentCandidates: CategoryOption[];
  defaultParentId?: string | null;
}

export function CategoryModal({ open, onOpenChange, category, parentCandidates, defaultParentId }: CategoryModalProps) {
  const { refresh } = useActionRefresh();
  const [name, setName] = React.useState("");
  const [kind, setKind] = React.useState<"INCOME" | "EXPENSE">("EXPENSE");
  const [icon, setIcon] = React.useState("Circle");
  const [color, setColor] = React.useState(COLORS[0]);
  const [parentId, setParentId] = React.useState<string>("none");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) return;
    if (category) {
      setName(category.name);
      setKind(category.kind as "INCOME" | "EXPENSE");
      setIcon(category.icon);
      setColor(category.color);
      setParentId(category.parentId ?? "none");
    } else {
      setName("");
      setKind("EXPENSE");
      setIcon("Circle");
      setColor(COLORS[0]);
      setParentId(defaultParentId ?? "none");
    }
    setError(null);
  }, [open, category, defaultParentId]);

  const availableParents = parentCandidates.filter((c) => c.kind === kind && c.id !== category?.id && !c.parentId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = { name, kind, icon, color, parentId: parentId === "none" ? null : parentId };
      if (category) {
        await updateCategory(category.id, payload);
        toast({ title: "Categoria atualizada", variant: "success" });
      } else {
        await createCategory(payload);
        toast({ title: "Categoria criada", variant: "success" });
      }
      onOpenChange(false);
      refresh("Salvando categoria...");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar categoria");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>{category ? "Editar categoria" : "Nova categoria"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Tabs value={kind} onValueChange={(v) => setKind(v as "INCOME" | "EXPENSE")}>
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="EXPENSE">Despesa</TabsTrigger>
              <TabsTrigger value="INCOME">Receita</TabsTrigger>
            </TabsList>
          </Tabs>

          <div>
            <Label htmlFor="cat-name">Nome</Label>
            <Input id="cat-name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Restaurante" />
          </div>

          <div>
            <Label>Categoria pai (opcional — cria uma subcategoria)</Label>
            <Select value={parentId} onValueChange={setParentId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhuma (categoria principal)</SelectItem>
                {availableParents.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Ícone</Label>
            <div className="grid grid-cols-8 gap-2">
              {CATEGORY_ICON_NAMES.map((iconName) => {
                const Icon = getCategoryIcon(iconName);
                return (
                  <button
                    key={iconName}
                    type="button"
                    onClick={() => setIcon(iconName)}
                    className={cn("h-8 w-8 flex items-center justify-center rounded-lg border border-border hover:bg-surface-muted", icon === iconName && "bg-brand text-brand-foreground border-brand")}
                  >
                    <Icon className="h-4 w-4" />
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <Label>Cor</Label>
            <div className="flex flex-wrap gap-2">
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
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
