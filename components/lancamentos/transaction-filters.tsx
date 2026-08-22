"use client";
import * as React from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useNavigateWithBusy } from "@/hooks/use-navigate-with-busy";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/shared/currency-input";
import { TRANSACTION_TYPES, TRANSACTION_STATUSES } from "@/lib/constants";
import { Search, X, SlidersHorizontal } from "lucide-react";

interface Option {
  id: string;
  name: string;
}

export function TransactionFilters({
  categories,
  accounts,
  cards,
}: {
  categories: Option[];
  accounts: Option[];
  cards: Option[];
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { navigate } = useNavigateWithBusy("Atualizando resultados...");

  const [query, setQuery] = React.useState(searchParams.get("q") ?? "");
  const [showMore, setShowMore] = React.useState(false);
  const [minAmount, setMinAmount] = React.useState(Number(searchParams.get("min") ?? 0));
  const [maxAmount, setMaxAmount] = React.useState(Number(searchParams.get("max") ?? 0));

  function setParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    navigate(`${pathname}?${params.toString()}`);
  }

  // Busca automática: aplica o termo digitado sem precisar apertar Enter,
  // com um pequeno atraso para não disparar uma navegação a cada tecla.
  React.useEffect(() => {
    if (query === (searchParams.get("q") ?? "")) return;
    const timer = setTimeout(() => setParam("q", query || null), 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    setParam("q", query || null);
  }

  function applyAmountRange() {
    const params = new URLSearchParams(searchParams.toString());
    if (minAmount > 0) params.set("min", String(minAmount));
    else params.delete("min");
    if (maxAmount > 0) params.set("max", String(maxAmount));
    else params.delete("max");
    navigate(`${pathname}?${params.toString()}`);
  }

  const hasActiveFilters = ["type", "categoryId", "accountId", "creditCardId", "status", "min", "max", "q"].some((k) => searchParams.get(k));

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 items-center">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por descrição..." className="pl-9" />
        </form>

        <Select value={searchParams.get("type") ?? "all"} onValueChange={(v) => setParam("type", v === "all" ? null : v)}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            {Object.entries(TRANSACTION_TYPES).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={searchParams.get("categoryId") ?? "all"} onValueChange={(v) => setParam("categoryId", v === "all" ? null : v)}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas categorias</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={searchParams.get("status") ?? "all"} onValueChange={(v) => setParam("status", v === "all" ? null : v)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos status</SelectItem>
            {Object.entries(TRANSACTION_STATUSES).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button type="button" variant="outline" size="sm" onClick={() => setShowMore((s) => !s)}>
          <SlidersHorizontal className="h-4 w-4" /> Mais filtros
        </Button>

        {hasActiveFilters && (
          <Button type="button" variant="ghost" size="sm" onClick={() => navigate(pathname, "Limpando filtros...")}>
            <X className="h-4 w-4" /> Limpar
          </Button>
        )}
      </div>

      {showMore && (
        <div className="flex flex-wrap gap-2 items-end rounded-lg border border-border p-3">
          <Select value={searchParams.get("accountId") ?? "all"} onValueChange={(v) => setParam("accountId", v === "all" ? null : v)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Conta" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas contas</SelectItem>
              {accounts.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={searchParams.get("creditCardId") ?? "all"} onValueChange={(v) => setParam("creditCardId", v === "all" ? null : v)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Cartão" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos cartões</SelectItem>
              {cards.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="w-[130px]">
            <CurrencyInput value={minAmount} onChange={setMinAmount} placeholder="Valor mín." />
          </div>
          <div className="w-[130px]">
            <CurrencyInput value={maxAmount} onChange={setMaxAmount} placeholder="Valor máx." />
          </div>
          <Button type="button" size="sm" onClick={applyAmountRange}>
            Aplicar
          </Button>
        </div>
      )}
    </div>
  );
}
