import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { InvestmentsList } from "@/components/investimentos/investments-list";

export default async function InvestimentosPage() {
  const user = await requireUser();
  const investments = await prisma.investment.findMany({ where: { userId: user.id }, orderBy: { date: "desc" } });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Investimentos</h1>
        <p className="text-muted-foreground mt-1">Acompanhe rentabilidade e composição da sua carteira.</p>
      </div>

      <InvestmentsList investments={investments} />
    </div>
  );
}
