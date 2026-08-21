"use client";
import * as React from "react";
import { useActionRefresh } from "@/hooks/use-action-refresh";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmationModal } from "@/components/shared/confirmation-modal";
import { CategoryModal } from "@/components/categorias/category-modal";
import { deleteCategory } from "@/lib/actions/categories";
import { toast } from "@/hooks/use-toast";
import { getCategoryIcon } from "@/lib/icons";
import { Tags, Plus, MoreHorizontal, Pencil, Trash2, CornerDownRight } from "lucide-react";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";

export interface CategoryRow {
  id: string;
  name: string;
  kind: string;
  icon: string;
  color: string;
  parentId: string | null;
  transactionCount: number;
}

export function CategoriesList({ categories }: { categories: CategoryRow[] }) {
  const { refresh } = useActionRefresh();
  const [kind, setKind] = React.useState<"EXPENSE" | "INCOME">("EXPENSE");
  const [modalOpen, setModalOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<CategoryRow | null>(null);
  const [defaultParentId, setDefaultParentId] = React.useState<string | null>(null);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  const filtered = categories.filter((c) => c.kind === kind);
  const roots = filtered.filter((c) => !c.parentId);
  const childrenOf = (id: string) => filtered.filter((c) => c.parentId === id);

  async function handleDelete() {
    if (!deletingId) return;
    setBusy(true);
    try {
      await deleteCategory(deletingId);
      toast({ title: "Categoria excluída", variant: "success" });
      refresh();
    } catch (err) {
      toast({ title: err instanceof Error ? err.message : "Erro ao excluir", variant: "destructive" });
    } finally {
      setBusy(false);
      setDeletingId(null);
    }
  }

  function renderRow(c: CategoryRow, isChild = false) {
    const Icon = getCategoryIcon(c.icon);
    return (
      <div key={c.id} className={`flex items-center justify-between rounded-lg px-3 py-2.5 hover:bg-surface-muted ${isChild ? "ml-8" : ""}`}>
        <div className="flex items-center gap-3 min-w-0">
          {isChild && <CornerDownRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
          <span className="flex h-8 w-8 items-center justify-center rounded-lg shrink-0" style={{ background: `${c.color}22`, color: c.color }}>
            <Icon className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{c.name}</p>
            <p className="text-xs text-muted-foreground">{c.transactionCount} lançamentos</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {!isChild && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setEditing(null);
                setDefaultParentId(c.id);
                setModalOpen(true);
              }}
            >
              <Plus className="h-3.5 w-3.5" /> Subcategoria
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="iconSm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => {
                  setEditing(c);
                  setModalOpen(true);
                }}
              >
                <Pencil className="h-4 w-4" /> Editar
              </DropdownMenuItem>
              <DropdownMenuItem destructive onClick={() => setDeletingId(c.id)}>
                <Trash2 className="h-4 w-4" /> Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <Tabs value={kind} onValueChange={(v) => setKind(v as "EXPENSE" | "INCOME")}>
          <TabsList>
            <TabsTrigger value="EXPENSE">Despesas</TabsTrigger>
            <TabsTrigger value="INCOME">Receitas</TabsTrigger>
          </TabsList>
        </Tabs>
        <Button
          onClick={() => {
            setEditing(null);
            setDefaultParentId(null);
            setModalOpen(true);
          }}
        >
          <Plus className="h-4 w-4" /> Nova categoria
        </Button>
      </div>

      <Card>
        <CardContent className="p-2">
          {roots.length === 0 ? (
            <EmptyState icon={Tags} title="Nenhuma categoria cadastrada" className="border-none py-12" />
          ) : (
            <div className="space-y-1">
              {roots.map((c) => (
                <React.Fragment key={c.id}>
                  {renderRow(c)}
                  {childrenOf(c.id).map((child) => renderRow(child, true))}
                </React.Fragment>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <CategoryModal open={modalOpen} onOpenChange={setModalOpen} category={editing} parentCandidates={categories} defaultParentId={defaultParentId} />
      <ConfirmationModal
        open={!!deletingId}
        onOpenChange={(o) => !o && setDeletingId(null)}
        title="Excluir categoria?"
        description="Só é possível excluir categorias sem lançamentos ou subcategorias vinculadas."
        onConfirm={handleDelete}
        loading={busy}
      />
    </div>
  );
}
