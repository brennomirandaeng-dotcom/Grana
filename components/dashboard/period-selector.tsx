"use client";
import * as React from "react";
import { useSearchParams, usePathname } from "next/navigation";
import { useNavigateWithBusy } from "@/hooks/use-navigate-with-busy";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PERIOD_LABELS, type PeriodKey } from "@/lib/queries/period";

export function PeriodSelector({ current }: { current: PeriodKey }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { navigate } = useNavigateWithBusy("Atualizando dashboard...");

  const [from, setFrom] = React.useState(searchParams.get("from") ?? "");
  const [to, setTo] = React.useState(searchParams.get("to") ?? "");

  function handlePeriodChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("period", value);
    if (value !== "personalizado") {
      params.delete("from");
      params.delete("to");
    }
    navigate(`${pathname}?${params.toString()}`);
  }

  function applyCustomRange() {
    if (!from || !to) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("period", "personalizado");
    params.set("from", from);
    params.set("to", to);
    navigate(`${pathname}?${params.toString()}`, "Atualizando dashboard...");
  }

  const invalidRange = !!from && !!to && to < from;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select value={current} onValueChange={handlePeriodChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(PERIOD_LABELS).map(([key, label]) => (
            <SelectItem key={key} value={key}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {current === "personalizado" && (
        <div className="flex flex-wrap items-center gap-2">
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-[150px]" aria-label="Data inicial" />
          <span className="text-sm text-muted-foreground">até</span>
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-[150px]" aria-label="Data final" />
          <Button type="button" size="sm" onClick={applyCustomRange} disabled={!from || !to || invalidRange}>
            Aplicar
          </Button>
          {invalidRange && <p className="w-full text-xs text-negative">A data final não pode ser anterior à inicial.</p>}
        </div>
      )}
    </div>
  );
}
