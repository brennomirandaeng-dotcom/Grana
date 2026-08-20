import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { GoalsList } from "@/components/metas/goals-list";

export default async function MetasPage() {
  const user = await requireUser();
  const goals = await prisma.goal.findMany({ where: { userId: user.id }, orderBy: { createdAt: "asc" } });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Metas</h1>
        <p className="text-muted-foreground mt-1">Defina objetivos financeiros e acompanhe seu progresso.</p>
      </div>

      <GoalsList goals={goals} />
    </div>
  );
}
