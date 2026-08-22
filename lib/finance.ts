// Regras de cálculo financeiro centralizadas (ver seção 34 do briefing do produto).

/**
 * Cartões cujo vencimento cai num dia numericamente menor que o fechamento
 * (ex: fecha dia 25, vence dia 03) têm vencimento no mês seguinte ao do
 * fechamento. Cartões com vencimento no mesmo mês do fechamento (ex: fecha
 * dia 22, vence dia 29) têm offset 0. Esse deslocamento é constante para um
 * mesmo cartão, independente do ciclo.
 */
export function dueMonthOffset(closingDay: number, dueDay: number): 0 | 1 {
  return dueDay < closingDay ? 1 : 0;
}

/**
 * Determina a qual fatura (mês de vencimento) uma compra no cartão pertence,
 * com base no dia de fechamento e no dia de vencimento do cartão. Primeiro
 * identifica o mês em que o ciclo da compra fecha (mês seguinte, se a compra
 * ocorrer no dia de fechamento ou depois); depois desloca para o mês de
 * vencimento correspondente àquele fechamento.
 */
export function getInvoiceMonth(purchaseDate: Date, closingDay: number, dueDay: number): string {
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

  const closingKey = `${year}-${String(month + 1).padStart(2, "0")}`;
  return addMonthsToKey(closingKey, dueMonthOffset(closingDay, dueDay));
}

/** Soma meses (positivos ou negativos) a uma chave "YYYY-MM". */
export function addMonthsToKey(key: string, amount: number): string {
  const [year, month] = key.split("-").map(Number);
  const date = new Date(year, month - 1 + amount, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function getInvoicePeriod(invoiceMonth: string, closingDay: number, dueDay: number) {
  const closing = addMonthsToKey(invoiceMonth, -dueMonthOffset(closingDay, dueDay));
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
