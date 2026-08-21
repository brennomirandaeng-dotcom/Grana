"use client";
import { useSearchParams, usePathname } from "next/navigation";
import { useNavigateWithBusy } from "@/hooks/use-navigate-with-busy";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { PERIOD_LABELS, type PeriodKey } from "@/lib/queries/period";

export function PeriodSelector({ current }: { current: PeriodKey }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { navigate } = useNavigateWithBusy("Atualizando dashboard...");

  function handleChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("period", value);
    navigate(`${pathname}?${params.toString()}`);
  }

  return (
    <Select value={current} onValueChange={handleChange}>
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
  );
}
