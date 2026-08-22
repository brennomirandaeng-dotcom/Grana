import { Card, CardContent } from "@/components/ui/card";
import { Money } from "@/components/shared/money";
import { formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Wallet, ArrowUpCircle, ArrowDownCircle, CheckCircle2, Clock, Scale, TrendingUp, Building2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface CardData {
  label: string;
  value: number;
  icon: LucideIcon;
  change?: number | null;
  colorize?: boolean;
  tone?: "default" | "positive" | "negative";
}

export function SummaryCards({
  balance,
  balanceChange,
  income,
  expense,
  expensePaid,
  expensePending,
  result,
  investments,
  netWorth,
}: {
  balance: number;
  balanceChange: number | null;
  income: number;
  expense: number;
  expensePaid: number;
  expensePending: number;
  result: number;
  investments: number;
  netWorth: number;
}) {
  const cards: CardData[] = [
    { label: "Saldo atual", value: balance, icon: Wallet, change: balanceChange },
    { label: "Receitas", value: income, icon: ArrowUpCircle, tone: "positive" },
    { label: "Despesas", value: expense, icon: ArrowDownCircle, tone: "negative" },
    { label: "Despesas já pagas", value: expensePaid, icon: CheckCircle2, tone: "negative" },
    { label: "Despesas a pagar", value: expensePending, icon: Clock, tone: "negative" },
    { label: "Resultado do período", value: result, icon: Scale, colorize: true },
    { label: "Investimentos", value: investments, icon: TrendingUp },
    { label: "Patrimônio líquido", value: netWorth, icon: Building2 },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {cards.map((c) => (
        <Card key={c.label}>
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <p className="text-sm font-medium text-muted-foreground">{c.label}</p>
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-lg",
                  c.tone === "positive" && "bg-positive-bg text-positive",
                  c.tone === "negative" && "bg-negative-bg text-negative",
                  !c.tone && "bg-surface-muted text-muted-foreground"
                )}
              >
                <c.icon className="h-4 w-4" />
              </div>
            </div>
            <p
              className={cn(
                "mt-2 text-2xl font-semibold tabular-nums",
                c.tone === "positive" && "text-positive",
                c.tone === "negative" && "text-negative",
                c.colorize && c.value < 0 && "text-negative",
                c.colorize && c.value >= 0 && "text-positive"
              )}
            >
              <Money value={c.value} colorize={false} />
            </p>
            {c.change !== undefined && c.change !== null && (
              <p className={cn("mt-1 text-xs font-medium", c.change >= 0 ? "text-positive" : "text-negative")}>
                {c.change >= 0 ? "+" : ""}
                {formatPercent(c.change)} em relação ao período anterior
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
