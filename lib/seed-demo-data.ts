import { prisma } from "@/lib/prisma";
import { DEFAULT_CATEGORIES } from "@/lib/constants";
import { getInvoiceMonth, splitInstallments } from "@/lib/finance";

/**
 * Popula a conta recém-criada com dados fictícios de demonstração, para que o
 * usuário nunca veja o app totalmente vazio na primeira execução (seção 33).
 */
export async function seedDemoData(userId: string) {
  const categories = await prisma.$transaction(
    DEFAULT_CATEGORIES.map((c) =>
      prisma.category.create({
        data: { userId, name: c.name, kind: c.kind, icon: c.icon, color: c.color },
      })
    )
  );
  const cat = (name: string) => categories.find((c) => c.name === name)!.id;

  const [nubank, itau, caixa, dinheiro] = await prisma.$transaction([
    prisma.account.create({ data: { userId, name: "Nubank", institution: "Nu Pagamentos", type: "DIGITAL", initialBalance: 3200, color: "#8b5cf6" } }),
    prisma.account.create({ data: { userId, name: "Itaú", institution: "Itaú Unibanco", type: "CHECKING", initialBalance: 5100, color: "#f97316" } }),
    prisma.account.create({ data: { userId, name: "Caixa", institution: "Caixa Econômica", type: "SAVINGS", initialBalance: 2000, color: "#0ea5e9" } }),
    prisma.account.create({ data: { userId, name: "Dinheiro", institution: null, type: "CASH", initialBalance: 450, color: "#22c55e" } }),
  ]);

  const [nubankCard, itauCard] = await prisma.$transaction([
    prisma.creditCard.create({ data: { userId, name: "Nubank", bank: "Nu Pagamentos", limitAmount: 10000, closingDay: 25, dueDay: 5, brand: "mastercard", color: "#8b5cf6" } }),
    prisma.creditCard.create({ data: { userId, name: "Itaú", bank: "Itaú Unibanco", limitAmount: 8000, closingDay: 20, dueDay: 28, brand: "visa", color: "#f97316" } }),
  ]);

  const today = new Date();
  const txs: { description: string; amount: number; type: "INCOME" | "EXPENSE"; category: string; account: string; day: number; monthOffset: number; paymentMethod: "PIX" | "DEBITO" | "DINHEIRO" | "BOLETO"; status?: "PAGO" | "PENDENTE" | "AGENDADO" }[] = [];

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
  // pendências no mês atual
  txs.push({ description: "Consulta odontológica", amount: 180, type: "EXPENSE", category: "Saúde", account: "Nubank", day: Math.min(today.getDate() + 3, 27), monthOffset: 0, paymentMethod: "PIX", status: "PENDENTE" });
  txs.push({ description: "13º adiantamento", amount: 1500, type: "INCOME", category: "Salário", account: "Itaú", day: Math.min(today.getDate() + 10, 27), monthOffset: 0, paymentMethod: "PIX", status: "AGENDADO" });

  const accountId = (name: string) => ({ Nubank: nubank.id, Itaú: itau.id, Caixa: caixa.id, Dinheiro: dinheiro.id }[name]!);

  await prisma.$transaction(
    txs.map((t) => {
      const date = new Date(today.getFullYear(), today.getMonth() - t.monthOffset, t.day);
      return prisma.transaction.create({
        data: {
          userId,
          type: t.type,
          description: t.description,
          amount: t.amount,
          date,
          categoryId: cat(t.category),
          accountId: accountId(t.account),
          paymentMethod: t.paymentMethod,
          status: t.status ?? "PAGO",
        },
      });
    })
  );

  // Assinaturas recorrentes (com histórico já lançado + recorrência ativa)
  const netflixCategory = cat("Assinaturas");
  await prisma.$transaction([
    prisma.recurringTransaction.create({
      data: {
        userId,
        description: "Netflix",
        amount: 39.9,
        type: "EXPENSE",
        categoryId: netflixCategory,
        accountId: nubank.id,
        frequency: "MENSAL",
        startDate: new Date(today.getFullYear(), today.getMonth() - 3, 14),
        dayOfMonth: 14,
        active: true,
      },
    }),
    prisma.recurringTransaction.create({
      data: {
        userId,
        description: "Spotify",
        amount: 21.9,
        type: "EXPENSE",
        categoryId: netflixCategory,
        accountId: nubank.id,
        frequency: "MENSAL",
        startDate: new Date(today.getFullYear(), today.getMonth() - 3, 3),
        dayOfMonth: 3,
        active: true,
      },
    }),
  ]);
  for (let m = 2; m >= 0; m--) {
    await prisma.transaction.create({
      data: { userId, type: "EXPENSE", description: "Netflix", amount: 39.9, date: new Date(today.getFullYear(), today.getMonth() - m, 14), categoryId: netflixCategory, accountId: nubank.id, paymentMethod: "CREDITO", status: "PAGO" },
    });
  }

  // Compra parcelada de exemplo no cartão Nubank
  const purchaseDate = new Date(today.getFullYear(), today.getMonth() - 1, 10);
  const installmentsCount = 3;
  const totalAmount = 897;
  const parts = splitInstallments(totalAmount, installmentsCount);
  const purchase = await prisma.installmentPurchase.create({
    data: {
      userId,
      creditCardId: nubankCard.id,
      description: "Notebook (loja Amazon)",
      totalAmount,
      installmentsCount,
      categoryId: cat("Compras"),
      purchaseDate,
    },
  });
  await prisma.$transaction(
    parts.map((amount, idx) => {
      const invMonth = getInvoiceMonth(purchaseDate, 25);
      const [y, mo] = invMonth.split("-").map(Number);
      const invoiceMonth = `${new Date(y, mo - 1 + idx, 1).getFullYear()}-${String(new Date(y, mo - 1 + idx, 1).getMonth() + 1).padStart(2, "0")}`;
      return prisma.transaction.create({
        data: {
          userId,
          type: "EXPENSE",
          description: `Notebook (loja Amazon) ${idx + 1}/${installmentsCount}`,
          amount,
          date: purchaseDate,
          categoryId: cat("Compras"),
          creditCardId: nubankCard.id,
          invoiceMonth,
          installmentPurchaseId: purchase.id,
          installmentNumber: idx + 1,
          paymentMethod: "CREDITO",
          status: "PAGO",
        },
      });
    })
  );

  // Compra simples no cartão Itaú (mês atual)
  await prisma.transaction.create({
    data: {
      userId,
      type: "EXPENSE",
      description: "Restaurante",
      amount: 150,
      date: new Date(today.getFullYear(), today.getMonth(), 8),
      categoryId: cat("Alimentação"),
      creditCardId: itauCard.id,
      invoiceMonth: getInvoiceMonth(new Date(today.getFullYear(), today.getMonth(), 8), 20),
      paymentMethod: "CREDITO",
      status: "PAGO",
    },
  });

  // Orçamentos do mês atual
  const monthKeyNow = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  await prisma.$transaction([
    prisma.budget.create({ data: { userId, categoryId: cat("Alimentação"), month: monthKeyNow, limit: 1000 } }),
    prisma.budget.create({ data: { userId, categoryId: cat("Transporte"), month: monthKeyNow, limit: 500 } }),
    prisma.budget.create({ data: { userId, categoryId: cat("Lazer"), month: monthKeyNow, limit: 400 } }),
    prisma.budget.create({ data: { userId, categoryId: cat("Compras"), month: monthKeyNow, limit: 600 } }),
  ]);

  // Metas
  const goal = await prisma.goal.create({
    data: { userId, name: "Comprar carro", targetAmount: 60000, currentAmount: 18000, deadline: new Date(2027, 11, 31), color: "#f59e0b", icon: "Car" },
  });
  await prisma.goalContribution.create({ data: { goalId: goal.id, amount: 18000, type: "DEPOSIT", note: "Aporte inicial" } });
  const goal2 = await prisma.goal.create({
    data: { userId, name: "Reserva de emergência", targetAmount: 25000, currentAmount: 12500, deadline: new Date(2027, 5, 30), color: "#10b981", icon: "ShieldCheck" },
  });
  await prisma.goalContribution.create({ data: { goalId: goal2.id, amount: 12500, type: "DEPOSIT", note: "Aporte inicial" } });

  // Investimentos
  await prisma.$transaction([
    prisma.investment.create({ data: { userId, name: "Tesouro Selic 2029", category: "TESOURO_DIRETO", investedAmount: 8000, currentAmount: 8620, date: new Date(today.getFullYear() - 1, 3, 10) } }),
    prisma.investment.create({ data: { userId, name: "CDB Banco Inter 120% CDI", category: "CDB", investedAmount: 6000, currentAmount: 6410, date: new Date(today.getFullYear() - 1, 6, 1) } }),
    prisma.investment.create({ data: { userId, name: "ITSA4", category: "ACOES", investedAmount: 4000, currentAmount: 4380, date: new Date(today.getFullYear() - 1, 8, 20) } }),
    prisma.investment.create({ data: { userId, name: "HGLG11", category: "FIIS", investedAmount: 5000, currentAmount: 5290, date: new Date(today.getFullYear() - 1, 9, 5) } }),
    prisma.investment.create({ data: { userId, name: "Bitcoin", category: "CRIPTO", investedAmount: 2000, currentAmount: 1100, date: new Date(today.getFullYear() - 1, 10, 15) } }),
  ]);

  // Patrimônio: ativos e passivos
  await prisma.$transaction([
    prisma.asset.create({ data: { userId, name: "Honda Civic 2021", type: "VEICULO", value: 95000 } }),
    prisma.liability.create({ data: { userId, name: "Financiamento do carro", type: "FINANCIAMENTO", originalAmount: 60000, remainingAmount: 32000, installmentsCount: 48, installmentsPaid: 26, interestRate: 1.2, dueDate: new Date(today.getFullYear() + 2, 2, 10) } }),
  ]);
}
