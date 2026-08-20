import { prisma } from "@/lib/prisma";
import { round2 } from "@/lib/finance";
import { getAccountsWithBalance } from "@/lib/queries/accounts";
import { getTotalCardDebt } from "@/lib/queries/credit-cards";

export async function getNetWorth(userId: string) {
  const [accounts, investments, assets, liabilities, cardDebt] = await Promise.all([
    getAccountsWithBalance(userId),
    prisma.investment.findMany({ where: { userId } }),
    prisma.asset.findMany({ where: { userId } }),
    prisma.liability.findMany({ where: { userId } }),
    getTotalCardDebt(userId),
  ]);

  const cashTotal = round2(accounts.reduce((sum, a) => sum + a.balance, 0));
  const investmentsTotal = round2(investments.reduce((sum, i) => sum + i.currentAmount, 0));
  const otherAssetsTotal = round2(assets.reduce((sum, a) => sum + a.value, 0));
  const liabilitiesTotal = round2(liabilities.reduce((sum, l) => sum + l.remainingAmount, 0));

  const totalAssets = round2(cashTotal + investmentsTotal + otherAssetsTotal);
  const totalLiabilities = round2(liabilitiesTotal + cardDebt);
  const netWorth = round2(totalAssets - totalLiabilities);

  return {
    cashTotal,
    investmentsTotal,
    otherAssetsTotal,
    liabilitiesTotal,
    cardDebt,
    totalAssets,
    totalLiabilities,
    netWorth,
  };
}
