import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  subMonths,
  startOfYear,
  endOfYear,
  subDays,
} from "date-fns";

export type PeriodKey = "hoje" | "semana" | "mes" | "mes_anterior" | "3m" | "6m" | "ano" | "personalizado";

export const PERIOD_LABELS: Record<PeriodKey, string> = {
  hoje: "Hoje",
  semana: "Esta semana",
  mes: "Este mês",
  mes_anterior: "Mês anterior",
  "3m": "Últimos 3 meses",
  "6m": "Últimos 6 meses",
  ano: "Este ano",
  personalizado: "Personalizado",
};

export interface Range {
  from: Date;
  to: Date;
}

export function getPeriodRange(period: PeriodKey, now = new Date(), customFrom?: string, customTo?: string): Range {
  switch (period) {
    case "hoje":
      return { from: startOfDay(now), to: endOfDay(now) };
    case "semana":
      return { from: startOfWeek(now, { weekStartsOn: 0 }), to: endOfWeek(now, { weekStartsOn: 0 }) };
    case "mes":
      return { from: startOfMonth(now), to: endOfMonth(now) };
    case "mes_anterior": {
      const prev = subMonths(now, 1);
      return { from: startOfMonth(prev), to: endOfMonth(prev) };
    }
    case "3m":
      return { from: startOfMonth(subMonths(now, 2)), to: endOfMonth(now) };
    case "6m":
      return { from: startOfMonth(subMonths(now, 5)), to: endOfMonth(now) };
    case "ano":
      return { from: startOfYear(now), to: endOfYear(now) };
    case "personalizado":
      return {
        from: customFrom ? startOfDay(new Date(customFrom)) : startOfMonth(now),
        to: customTo ? endOfDay(new Date(customTo)) : endOfDay(now),
      };
  }
}

/** Range imediatamente anterior, com a mesma duração, para comparação percentual. */
export function getPreviousRange(range: Range): Range {
  const durationMs = range.to.getTime() - range.from.getTime();
  return {
    from: new Date(range.from.getTime() - durationMs - 1),
    to: new Date(range.from.getTime() - 1),
  };
}

export function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return ((current - previous) / Math.abs(previous)) * 100;
}

export { subDays };
