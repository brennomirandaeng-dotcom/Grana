import { z } from "zod";

/**
 * Faz o parse validando com zod, mas lança um erro com uma mensagem legível
 * (a do primeiro campo inválido) em vez do JSON bruto de `ZodError.message`
 * — que, sem isso, vaza pra tela do usuário como texto ilegível quando o
 * catch de um formulário exibe `err.message`.
 */
export function parseInput<T>(schema: z.ZodType<T>, raw: unknown): T {
  const result = schema.safeParse(raw);
  if (!result.success) {
    throw new Error(result.error.issues[0]?.message ?? "Dados inválidos");
  }
  return result.data;
}

export const registerSchema = z.object({
  name: z.string().min(2, "Informe seu nome completo"),
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "A senha deve ter ao menos 6 caracteres"),
});

export const transactionSchema = z.object({
  type: z.enum(["INCOME", "EXPENSE", "TRANSFER"]),
  description: z.string().min(1, "Informe uma descrição"),
  amount: z.number().positive("O valor deve ser maior que zero"),
  date: z.string().min(1, "Informe a data"),
  categoryId: z.string().optional().nullable(),
  accountId: z.string().optional().nullable(),
  transferToAccountId: z.string().optional().nullable(),
  paymentMethod: z.enum(["DINHEIRO", "PIX", "DEBITO", "CREDITO", "BOLETO", "TRANSFERENCIA"]),
  status: z.enum(["PAGO", "PENDENTE", "AGENDADO"]),
  notes: z.string().optional().nullable(),
  isRecurring: z.boolean().optional(),
  recurrence: z
    .object({
      frequency: z.enum(["SEMANAL", "QUINZENAL", "MENSAL", "ANUAL"]),
      endDate: z.string().optional().nullable(),
      occurrences: z.number().int().positive().optional().nullable(),
    })
    .optional()
    .nullable(),
  isInstallment: z.boolean().optional(),
  installmentsCount: z.number().int().min(2).max(48).optional().nullable(),
});

export const accountSchema = z.object({
  name: z.string().min(1, "Informe o nome da conta"),
  institution: z.string().optional().nullable(),
  type: z.enum(["CHECKING", "DIGITAL", "SAVINGS", "CASH", "WALLET", "INVESTMENT"]),
  initialBalance: z.number(),
  color: z.string().optional(),
});

export const transferSchema = z.object({
  fromAccountId: z.string().min(1),
  toAccountId: z.string().min(1),
  amount: z.number().positive(),
  date: z.string().min(1),
  notes: z.string().optional().nullable(),
});

export const creditCardSchema = z.object({
  name: z.string().min(1),
  bank: z.string().min(1),
  limitAmount: z.number().positive(),
  closingDay: z.number().int().min(1).max(31),
  dueDay: z.number().int().min(1).max(31),
  brand: z.string().optional(),
  color: z.string().optional(),
});

export const installmentPurchaseSchema = z.object({
  creditCardId: z.string().min(1),
  description: z.string().min(1),
  totalAmount: z.number().positive(),
  installmentsCount: z.number().int().min(1).max(48),
  categoryId: z.string().optional().nullable(),
  purchaseDate: z.string().min(1),
});

export const categorySchema = z.object({
  name: z.string().min(1),
  kind: z.enum(["INCOME", "EXPENSE"]),
  icon: z.string().optional(),
  color: z.string().optional(),
  parentId: z.string().optional().nullable(),
});

export const budgetSchema = z.object({
  categoryId: z.string().min(1),
  month: z.string().min(1),
  limit: z.number().positive(),
});

export const goalSchema = z.object({
  name: z.string().min(1),
  targetAmount: z.number().positive(),
  currentAmount: z.number().min(0).optional(),
  deadline: z.string().optional().nullable(),
  color: z.string().optional(),
  icon: z.string().optional(),
});

export const goalContributionSchema = z.object({
  amount: z.number().positive(),
  type: z.enum(["DEPOSIT", "WITHDRAW"]),
  note: z.string().optional().nullable(),
});

export const investmentSchema = z.object({
  name: z.string().min(1),
  category: z.enum(["RENDA_FIXA", "TESOURO_DIRETO", "CDB", "LCI_LCA", "ACOES", "FIIS", "ETF", "CRIPTO", "OUTROS"]),
  investedAmount: z.number().positive(),
  currentAmount: z.number().min(0),
  date: z.string().min(1),
  notes: z.string().optional().nullable(),
});

export const investmentWithdrawSchema = z.object({
  amount: z.number().positive("O valor deve ser maior que zero"),
  accountId: z.string().min(1, "Selecione a conta de destino"),
  date: z.string().min(1),
  notes: z.string().optional().nullable(),
});

export const investmentTransferSchema = z.object({
  amount: z.number().positive("O valor deve ser maior que zero"),
  toInvestmentId: z.string().min(1, "Selecione o investimento de destino"),
});

export const expectedIncomeSchema = z.object({
  description: z.string().min(1, "Informe a descrição"),
  amount: z.number().positive("O valor deve ser maior que zero"),
  date: z.string().min(1, "Informe a data prevista"),
});

export const confirmExpectedIncomeSchema = z.object({
  accountId: z.string().min(1, "Selecione a conta"),
  receivedDate: z.string().min(1, "Informe a data em que recebeu"),
});

export const assetSchema = z.object({
  name: z.string().min(1),
  type: z.enum(["VEICULO", "IMOVEL", "OUTRO"]),
  value: z.number().positive(),
});

export const liabilitySchema = z.object({
  name: z.string().min(1),
  type: z.enum(["EMPRESTIMO", "FINANCIAMENTO", "PARCELAMENTO", "DIVIDA_PESSOAL"]),
  originalAmount: z.number().positive(),
  remainingAmount: z.number().min(0),
  installmentsCount: z.number().int().positive().optional().nullable(),
  installmentsPaid: z.number().int().min(0).optional(),
  interestRate: z.number().optional().nullable(),
  dueDate: z.string().optional().nullable(),
});
