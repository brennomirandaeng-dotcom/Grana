// Constantes e "enums" (SQLite não suporta enum nativo — validamos aqui)

export const ACCOUNT_TYPES = {
  CHECKING: "Conta corrente",
  DIGITAL: "Conta digital",
  SAVINGS: "Poupança",
  CASH: "Dinheiro físico",
  WALLET: "Carteira",
  INVESTMENT: "Conta de investimento",
} as const;
export type AccountType = keyof typeof ACCOUNT_TYPES;

export const CATEGORY_KINDS = {
  INCOME: "Receita",
  EXPENSE: "Despesa",
} as const;
export type CategoryKind = keyof typeof CATEGORY_KINDS;

export const TRANSACTION_TYPES = {
  INCOME: "Receita",
  EXPENSE: "Despesa",
  TRANSFER: "Transferência",
} as const;
export type TransactionType = keyof typeof TRANSACTION_TYPES;

export const PAYMENT_METHODS = {
  DINHEIRO: "Dinheiro",
  PIX: "PIX",
  DEBITO: "Débito",
  CREDITO: "Crédito",
  BOLETO: "Boleto",
  TRANSFERENCIA: "Transferência",
} as const;
export type PaymentMethod = keyof typeof PAYMENT_METHODS;

export const TRANSACTION_STATUSES = {
  PAGO: "Pago",
  PENDENTE: "Pendente",
  AGENDADO: "Agendado",
} as const;
export type TransactionStatus = keyof typeof TRANSACTION_STATUSES;

export const RECURRENCE_FREQUENCIES = {
  SEMANAL: "Semanal",
  QUINZENAL: "Quinzenal",
  MENSAL: "Mensal",
  ANUAL: "Anual",
} as const;
export type RecurrenceFrequency = keyof typeof RECURRENCE_FREQUENCIES;

export const USER_ROLES = {
  USER: "Usuário",
  ADMIN: "Administrador",
} as const;
export type UserRole = keyof typeof USER_ROLES;

export const GOAL_MOVEMENT_TYPES = {
  DEPOSIT: "Depósito",
  WITHDRAW: "Retirada",
} as const;
export type GoalMovementType = keyof typeof GOAL_MOVEMENT_TYPES;

export const INVESTMENT_CATEGORIES = {
  RENDA_FIXA: "Renda Fixa",
  TESOURO_DIRETO: "Tesouro Direto",
  CDB: "CDB",
  LCI_LCA: "LCI/LCA",
  ACOES: "Ações",
  FIIS: "FIIs",
  ETF: "ETFs",
  CRIPTO: "Criptomoedas",
  OUTROS: "Outros",
} as const;
export type InvestmentCategory = keyof typeof INVESTMENT_CATEGORIES;

export const ASSET_TYPES = {
  VEICULO: "Veículo",
  IMOVEL: "Imóvel",
  OUTRO: "Outro bem",
} as const;
export type AssetType = keyof typeof ASSET_TYPES;

export const LIABILITY_TYPES = {
  EMPRESTIMO: "Empréstimo",
  FINANCIAMENTO: "Financiamento",
  PARCELAMENTO: "Parcelamento",
  DIVIDA_PESSOAL: "Dívida pessoal",
} as const;
export type LiabilityType = keyof typeof LIABILITY_TYPES;

export const DEFAULT_CATEGORIES: { name: string; kind: CategoryKind; icon: string; color: string }[] = [
  { name: "Salário", kind: "INCOME", icon: "Wallet", color: "#10b981" },
  { name: "Freelance", kind: "INCOME", icon: "Briefcase", color: "#22c55e" },
  { name: "Investimentos", kind: "INCOME", icon: "TrendingUp", color: "#059669" },
  { name: "Outros", kind: "INCOME", icon: "Plus", color: "#84cc16" },
  { name: "Alimentação", kind: "EXPENSE", icon: "UtensilsCrossed", color: "#f97316" },
  { name: "Moradia", kind: "EXPENSE", icon: "Home", color: "#0ea5e9" },
  { name: "Transporte", kind: "EXPENSE", icon: "Car", color: "#6366f1" },
  { name: "Saúde", kind: "EXPENSE", icon: "HeartPulse", color: "#ef4444" },
  { name: "Educação", kind: "EXPENSE", icon: "GraduationCap", color: "#8b5cf6" },
  { name: "Lazer", kind: "EXPENSE", icon: "PartyPopper", color: "#ec4899" },
  { name: "Compras", kind: "EXPENSE", icon: "ShoppingBag", color: "#f59e0b" },
  { name: "Assinaturas", kind: "EXPENSE", icon: "Repeat", color: "#14b8a6" },
  { name: "Contas", kind: "EXPENSE", icon: "Receipt", color: "#64748b" },
  { name: "Viagens", kind: "EXPENSE", icon: "Plane", color: "#06b6d4" },
  { name: "Outros", kind: "EXPENSE", icon: "MoreHorizontal", color: "#94a3b8" },
];
