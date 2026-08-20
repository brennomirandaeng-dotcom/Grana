import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

interface MoneyProps {
  value: number;
  className?: string;
  showSign?: boolean;
  colorize?: boolean;
}

export function Money({ value, className, showSign = false, colorize = true }: MoneyProps) {
  const isNegative = value < 0;
  const isPositive = value > 0;
  const sign = showSign && isPositive ? "+" : "";

  return (
    <span
      className={cn(
        "tabular-nums",
        colorize && isPositive && "text-positive",
        colorize && isNegative && "text-negative",
        className
      )}
    >
      {sign}
      {formatCurrency(value)}
    </span>
  );
}
