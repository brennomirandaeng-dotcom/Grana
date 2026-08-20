import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getNetWorth } from "@/lib/queries/net-worth";
import { recordNetWorthSnapshot } from "@/lib/actions/net-worth";
import { formatCurrency, formatDate } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NetWorthView } from "@/components/patrimonio/net-worth-view";
import { NetWorthChart } from "@/components/patrimonio/net-worth-chart";

export default async function PatrimonioPage() {
  const user = await requireUser();
  const netWorth = await getNetWorth(user.id);

  await recordNetWorthSnapshot(user.id, netWorth.netWorth, netWorth.totalAssets, netWorth.totalLiabilities);

  const [assets, liabilities, snapshots] = await Promise.all([
    prisma.asset.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } }),
    prisma.liability.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } }),
    prisma.netWorthSnapshot.findMany({ where: { userId: user.id }, orderBy: { date: "asc" } }),
  ]);

  const chartData = snapshots.map((s) => ({ label: formatDate(s.date), netWorth: s.netWorth }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Patrimônio</h1>
        <p className="text-muted-foreground mt-1">Seus ativos, passivos e patrimônio líquido.</p>
      </div>

      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground">Patrimônio líquido</p>
          <p className="text-4xl font-semibold mt-1">{formatCurrency(netWorth.netWorth)}</p>
          <div className="grid grid-cols-2 gap-6 mt-4 max-w-sm">
            <div>
              <p className="text-xs text-muted-foreground">Total de ativos</p>
              <p className="font-medium text-positive">{formatCurrency(netWorth.totalAssets)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total de passivos</p>
              <p className="font-medium text-negative">{formatCurrency(netWorth.totalLiabilities)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Evolução do patrimônio</CardTitle>
        </CardHeader>
        <CardContent>
          <NetWorthChart data={chartData} />
        </CardContent>
      </Card>

      <NetWorthView cashTotal={netWorth.cashTotal} investmentsTotal={netWorth.investmentsTotal} cardDebt={netWorth.cardDebt} assets={assets} liabilities={liabilities} />
    </div>
  );
}
