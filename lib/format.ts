export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function formatCompactCurrency(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${value < 0 ? "-" : ""}R$ ${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${value < 0 ? "-" : ""}R$ ${(abs / 1_000).toFixed(1)}mil`;
  return formatCurrency(value);
}

// Datas de lançamentos/metas/etc. são armazenadas como meia-noite UTC do dia
// escolhido (a partir de um input "YYYY-MM-DD"). Formatar em UTC evita que o
// fuso horário local (ex: UTC-3 no Brasil) exiba o dia anterior.
export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(d);
}

export function formatDateLong(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "long", year: "numeric", timeZone: "UTC" }).format(d);
}

export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals).replace(".", ",")}%`;
}

export function formatMonthLabel(monthKey: string): string {
  // monthKey: "YYYY-MM"
  const [year, month] = monthKey.split("-").map(Number);
  const d = new Date(year, month - 1, 1);
  const label = new Intl.DateTimeFormat("pt-BR", { month: "short", year: "2-digit" }).format(d);
  return label.charAt(0).toUpperCase() + label.slice(1).replace(".", "");
}

export function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}
