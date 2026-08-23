import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { ExpectedIncomeList } from "@/components/receitas-previstas/expected-income-list";

export default async function ReceitasPrevistasPage() {
  const user = await requireUser();
  const expectedIncomes = await prisma.expectedIncome.findMany({ where: { userId: user.id }, orderBy: { date: "asc" } });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Receitas previstas</h1>
        <p className="text-muted-foreground mt-1">Cadastre receitas que você espera receber e confirme quando o dinheiro cair na conta.</p>
      </div>

      <ExpectedIncomeList expectedIncomes={expectedIncomes} />
    </div>
  );
}
