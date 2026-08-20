// Regras de cálculo financeiro centralizadas (ver seção 34 do briefing do produto).

/**
 * Determina a qual fatura (mês) uma compra no cartão pertence, com base no dia
 * de fechamento do cartão. Se a compra ocorrer no dia de fechamento ou depois,
 * ela cai na fatura do mês seguinte.
 */
export function getInvoiceMonth(purchaseDate: Date, closingDay: number): string {
  const day = purchaseDate.getDate();
  let year = purchaseDate.getFullYear();
  let month = purchaseDate.getMonth(); // 0-based

  if (day >= closingDay) {
    month += 1;
    if (month > 11) {
      month = 0;
      year += 1;
    }
  }

  return `${year}-${String(month + 1).padStart(2, "0")}`;
}

/** Soma meses (positivos ou negativos) a uma chave "YYYY-MM". */
export function addMonthsToKey(key: string, amount: number): string {
  const [year, month] = key.split("-").map(Number);
  const date = new Date(year, month - 1 + amount, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function getInvoicePeriod(invoiceMonth: string, closingDay: number, dueDay: number) {
  const closing = addMonthsToKey(invoiceMonth, -1);
  const [closeY, closeM] = closing.split("-").map(Number);
  const closingDate = new Date(closeY, closeM - 1, closingDay);

  const [dueY, dueM] = invoiceMonth.split("-").map(Number);
  const dueDate = new Date(dueY, dueM - 1, dueDay);

  return { closingDate, dueDate };
}

export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/** Divide um valor total em N parcelas, ajustando centavos na última parcela. */
export function splitInstallments(total: number, count: number): number[] {
  const base = Math.floor((total / count) * 100) / 100;
  const installments = Array(count).fill(base);
  const remainder = round2(total - base * count);
  installments[count - 1] = round2(installments[count - 1] + remainder);
  return installments;
}
