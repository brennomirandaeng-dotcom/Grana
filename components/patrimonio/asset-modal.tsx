"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { CurrencyInput } from "@/components/shared/currency-input";
import { ASSET_TYPES, type AssetType } from "@/lib/constants";
import { createAsset, updateAsset } from "@/lib/actions/net-worth";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export function AssetModal({ open, onOpenChange, asset }: { open: boolean; onOpenChange: (o: boolean) => void; asset?: { id: string; name: string; type: string; value: number } | null }) {
  const router = useRouter();
  const [name, setName] = React.useState("");
  const [type, setType] = React.useState("OUTRO");
  const [value, setValue] = React.useState(0);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) return;
    if (asset) {
      setName(asset.name);
      setType(asset.type);
      setValue(asset.value);
    } else {
      setName("");
      setType("OUTRO");
      setValue(0);
    }
    setError(null);
  }, [open, asset]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = { name, type: type as AssetType, value };
      if (asset) {
        await updateAsset(asset.id, payload);
        toast({ title: "Bem atualizado", variant: "success" });
      } else {
        await createAsset(payload);
        toast({ title: "Bem adicionado", variant: "success" });
      }
      onOpenChange(false);
      router.refresh();
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
          <DialogTitle>{asset ? "Editar bem" : "Novo ativo"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="asset-name">Nome</Label>
            <Input id="asset-name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Honda Civic 2021" />
          </div>
          <div>
            <Label>Tipo</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(ASSET_TYPES).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Valor estimado</Label>
            <CurrencyInput value={value} onChange={setValue} />
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
