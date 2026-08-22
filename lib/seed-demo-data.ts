import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { DEFAULT_CATEGORIES } from "@/lib/constants";
import { getInvoiceMonth, splitInstallments } from "@/lib/finance";

/**
 * Popula a conta recém-criada com dados fictícios de demonstração, para que o
 * usuário nunca veja o app totalmente vazio na primeira execução (seção 33).
 *
 * IDs são pré-gerados em memória (em vez de depender do @default(cuid()) do
 * banco) para poder disparar as escritas em lotes paralelos por nível de
 * dependência de FK, ao invés de dezenas de round-trips sequenciais — isso
 * importa porque, contra um pooler remoto (Supabase), cada round-trip
 * sequencial soma latência de rede, e uma cadeia de ~20 delas facilmente
 * estoura o timeout de function serverless da hospedagem.
 */
export async function seedDemoData(userId: string) {
  const today = new Date();

  // ---- Nível 1: entidades sem dependência de FK entre si (só de userId) ----

  const categories = DEFAULT_CATEGORIES.map((c) => ({ id: randomUUID(), userId, ...c }));
  const cat = (name: string) => categories.find((c) => c.name === name)!.id;

  const accounts = {
    nubank: { id: randomUUID(), name: "Nubank", institution: "Nu Pagamentos", type: "DIGITAL", initialBalance: 3200, color: "#8b5cf6" },
    itau: { id: randomUUID(), name: "Itaú", institution: "Itaú Unibanco", type: "CHECKING", initialBalance: 5100, color: "#f97316" },
    caixa: { id: randomUUID(), name: "Caixa", institution: "Caixa Econômica", type: "SAVINGS", initialBalance: 2000, color: "#0ea5e9" },
    dinheiro: { id: randomUUID(), name: "Dinheiro", institution: null as string | null, type: "CASH", initialBalance: 450, color: "#22c55e" },
  };
  const accountId = (name: "Nubank" | "Itaú" | "Caixa" | "Dinheiro") =>
    ({ Nubank: accounts.nubank.id, Itaú: accounts.itau.id, Caixa: accounts.caixa.id, Dinheiro: accounts.dinheiro.id }[name]);

  const cards = {
    nubank: { id: randomUUID(), name: "Nubank", bank: "Nu Pagamentos", limitAmount: 10000, closingDay: 25, dueDay: 5, brand: "mastercard", color: "#8b5cf6" },
    itau: { id: randomUUID(), name: "Itaú", bank: "Itaú Unibanco", limitAmount: 8000, closingDay: 20, dueDay: 28, brand: "visa", color: "#f97316" },
  };

  const goal1Id = randomUUID();
  const goal2Id = randomUUID();
  const purchaseId = randomUUID();

  await Promise.all([
    prisma.category.createMany({ data: categories.map(({ id, userId, name, kind, icon, color }) => ({ id, userId, name, kind, icon, color })) }),
    prisma.account.createMany({ data: Object.values(accounts).map((a) => ({ userId, ...a })) }),
    prisma.creditCard.createMany({ data: Object.values(cards).map((c) => ({ userId, ...c })) }),
    prisma.goal.createMany({
      data: [
        { id: goal1Id, userId, name: "Comprar carro", targetAmount: 60000, currentAmount: 18000, deadline: new Date(2027, 11, 31), color: "#f59e0b", icon: "Car" },
        { id: goal2Id, userId, name: "Reserva de emergência", targetAmount: 25000, currentAmount: 12500, deadline: new Date(2027, 5, 30), color: "#10b981", icon: "ShieldCheck" },
      ],
    }),
    prisma.investment.createMany({
      data: [
        { userId, name: "Tesouro Selic 2029", category: "TESOURO_DIRETO", investedAmount: 8000, currentAmount: 8620, date: new Date(today.getFullYear() - 1, 3, 10) },
        { userId, name: "CDB Banco Inter 120% CDI", category: "CDB", investedAmount: 6000, currentAmount: 6410, date: new Date(today.getFullYear() - 1, 6, 1) },
        { userId, name: "ITSA4", category: "ACOES", investedAmount: 4000, currentAmount: 4380, date: new Date(today.getFullYear() - 1, 8, 20) },
        { userId, name: "HGLG11", category: "FIIS", investedAmount: 5000, currentAmount: 5290, date: new Date(today.getFullYear() - 1, 9, 5) },
        { userId, name: "Bitcoin", category: "CRIPTO", investedAmount: 2000, currentAmount: 1100, date: new Date(today.getFullYear() - 1, 10, 15) },
      ],
    }),
    prisma.asset.create({ data: { userId, name: "Honda Civic 2021", type: "VEICULO", value: 95000 } }),
    prisma.liability.create({ data: { userId, name: "Financiamento do carro", type: "FINANCIAMENTO", originalAmount: 60000, remainingAmount: 32000, installmentsCount: 48, installmentsPaid: 26, interestRate: 1.2, dueDate: new Date(today.getFullYear() + 2, 2, 10) } }),
  ]);

  // ---- Nível 2: depende do nível 1 existir no banco (FKs) ----

  const txs: { description: string; amount: number; type: "INCOME" | "EXPENSE"; category: string; account: "Nubank" | "Itaú" | "Caixa" | "Dinheiro"; day: number; monthOffset: number; paymentMethod: "PIX" | "DEBITO" | "DINHEIRO" | "BOLETO"; status?: "PAGO" | "PENDENTE" | "AGENDADO" }[] = [];
  for (let m = 5; m >= 0; m--) {
    txs.push({ description: "Salário", amount: 8000, type: "INCOME", category: "Salário", account: "Itaú", day: 5, monthOffset: m, paymentMethod: "PIX" });
    if (m % 2 === 0) txs.push({ description: "Projeto freelance", amount: 950, type: "INCOME", category: "Freelance", account: "Nubank", day: 18, monthOffset: m, paymentMethod: "PIX" });
    txs.push({ description: "Aluguel", amount: 1500, type: "EXPENSE", category: "Moradia", account: "Itaú", day: 10, monthOffset: m, paymentMethod: "BOLETO" });
    txs.push({ description: "Supermercado", amount: 420 + m * 12, type: "EXPENSE", category: "Alimentação", account: "Nubank", day: 8, monthOffset: m, paymentMethod: "PIX" });
    txs.push({ description: "Feira", amount: 95, type: "EXPENSE", category: "Alimentação", account: "Dinheiro", day: 15, monthOffset: m, paymentMethod: "DINHEIRO" });
    txs.push({ description: "Combustível", amount: 260, type: "EXPENSE", category: "Transporte", account: "Nubank", day: 12, monthOffset: m, paymentMethod: "DEBITO" });
    txs.push({ description: "Internet + energia", amount: 220, type: "EXPENSE", category: "Contas", account: "Itaú", day: 14, monthOffset: m, paymentMethod: "BOLETO" });
    txs.push({ description: "Academia", amount: 110, type: "EXPENSE", category: "Saúde", account: "Nubank", day: 6, monthOffset: m, paymentMethod: "PIX" });
    if (m % 2 === 1) txs.push({ description: "Cinema", amount: 80, type: "EXPENSE", category: "Lazer", account: "Dinheiro", day: 20, monthOffset: m, paymentMethod: "DINHEIRO" });
  }
  txs.push({ description: "Consulta odontológica", amount: 180, type: "EXPENSE", category: "Saúde", account: "Nubank", day: Math.min(today.getDate() + 3, 27), monthOffset: 0, paymentMethod: "PIX", status: "PENDENTE" });
  txs.push({ description: "13º adiantamento", amount: 1500, type: "INCOME", category: "Salário", account: "Itaú", day: Math.min(today.getDate() + 10, 27), monthOffset: 0, paymentMethod: "PIX", status: "AGENDADO" });

  const netflixCategory = cat("Assinaturas");
  const purchaseDate = new Date(today.getFullYear(), today.getMonth() - 1, 10);

  await Promise.all([
    prisma.transaction.createMany({
      data: txs.map((t) => ({
        userId,
        type: t.type,
        description: t.description,
        amount: t.amount,
        date: new Date(today.getFullYear(), today.getMonth() - t.monthOffset, t.day),
        categoryId: cat(t.category),
        accountId: accountId(t.account),
        paymentMethod: t.paymentMethod,
        status: t.status ?? "PAGO",
      })),
    }),
    prisma.recurringTransaction.createMany({
      data: [
        { userId, description: "Netflix", amount: 39.9, type: "EXPENSE", categoryId: netflixCategory, accountId: accounts.nubank.id, frequency: "MENSAL", startDate: new Date(today.getFullYear(), today.getMonth() - 3, 14), dayOfMonth: 14, active: true },
        { userId, description: "Spotify", amount: 21.9, type: "EXPENSE", categoryId: netflixCategory, accountId: accounts.nubank.id, frequency: "MENSAL", startDate: new Date(today.getFullYear(), today.getMonth() - 3, 3), dayOfMonth: 3, active: true },
      ],
    }),
    prisma.installmentPurchase.create({
      data: { id: purchaseId, userId, creditCardId: cards.nubank.id, description: "Notebook (loja Amazon)", totalAmount: 897, installmentsCount: 3, categoryId: cat("Compras"), purchaseDate },
    }),
    prisma.budget.createMany({
      data: [
        { userId, categoryId: cat("Alimentação"), month: `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`, limit: 1000 },
        { userId, categoryId: cat("Transporte"), month: `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`, limit: 500 },
        { userId, categoryId: cat("Lazer"), month: `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`, limit: 400 },
        { userId, categoryId: cat("Compras"), month: `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`, limit: 600 },
      ],
    }),
    prisma.goalContribution.createMany({
      data: [
        { goalId: goal1Id, amount: 18000, type: "DEPOSIT", note: "Aporte inicial" },
        { goalId: goal2Id, amount: 12500, type: "DEPOSIT", note: "Aporte inicial" },
      ],
    }),
  ]);

  // ---- Nível 3: depende da compra parcelada (nível 2) existir ----

  const installmentParts = splitInstallments(897, 3);
  const baseInvoiceMonth = getInvoiceMonth(purchaseDate, cards.nubank.closingDay, cards.nubank.dueDay);
  const [baseY, baseM] = baseInvoiceMonth.split("-").map(Number);

  await prisma.transaction.createMany({
    data: [
      ...installmentParts.map((amount, idx) => {
        const d = new Date(baseY, baseM - 1 + idx, 1);
        return {
          userId,
          type: "EXPENSE" as const,
          description: `Notebook (loja Amazon) ${idx + 1}/${installmentParts.length}`,
          amount,
          date: purchaseDate,
          categoryId: cat("Compras"),
          creditCardId: cards.nubank.id,
          invoiceMonth: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
          installmentPurchaseId: purchaseId,
          installmentNumber: idx + 1,
          paymentMethod: "CREDITO" as const,
          status: "PAGO" as const,
        };
      }),
      ...[2, 1, 0].map((m) => ({
        userId,
        type: "EXPENSE" as const,
        description: "Netflix",
        amount: 39.9,
        date: new Date(today.getFullYear(), today.getMonth() - m, 14),
        categoryId: netflixCategory,
        accountId: accounts.nubank.id,
        paymentMethod: "CREDITO" as const,
        status: "PAGO" as const,
      })),
      {
        userId,
        type: "EXPENSE" as const,
        description: "Restaurante",
        amount: 150,
        date: new Date(today.getFullYear(), today.getMonth(), 8),
        categoryId: cat("Alimentação"),
        creditCardId: cards.itau.id,
        invoiceMonth: getInvoiceMonth(new Date(today.getFullYear(), today.getMonth(), 8), cards.itau.closingDay, cards.itau.dueDay),
        paymentMethod: "CREDITO" as const,
        status: "PAGO" as const,
      },
    ],
  });
}
