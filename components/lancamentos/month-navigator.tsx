"use client";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { addMonthsToKey } from "@/lib/finance";

function monthLabel(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);
  const label = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(new Date(year, month - 1, 1));
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function MonthNavigator({ month, isAll }: { month: string; isAll: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function goTo(value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set("month", value);
    else params.delete("month");
    router.push(`${pathname}?${params.toString()}`);
  }

  if (isAll) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-foreground">Todos os lançamentos</span>
        <Button type="button" variant="outline" size="sm" onClick={() => goTo(null)}>
          <CalendarDays className="h-4 w-4" /> Ver por mês
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <Button type="button" variant="ghost" size="iconSm" onClick={() => goTo(addMonthsToKey(month, -1))} aria-label="Mês anterior">
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="text-sm font-medium text-foreground min-w-[140px] text-center">{monthLabel(month)}</span>
      <Button type="button" variant="ghost" size="iconSm" onClick={() => goTo(addMonthsToKey(month, 1))} aria-label="Próximo mês">
        <ChevronRight className="h-4 w-4" />
      </Button>
      <Button type="button" variant="outline" size="sm" className="ml-2" onClick={() => goTo("all")}>
        Ver tudo
      </Button>
    </div>
  );
}
