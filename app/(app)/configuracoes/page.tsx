import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { SettingsTabs } from "@/components/configuracoes/settings-tabs";

export default async function ConfiguracoesPage() {
  const sessionUser = await requireUser();
  const user = await prisma.user.findUniqueOrThrow({ where: { id: sessionUser.id } });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Configurações</h1>
        <p className="text-muted-foreground mt-1">Gerencie seu perfil, preferências e segurança.</p>
      </div>

      <SettingsTabs
        user={{
          name: user.name,
          email: user.email,
          image: user.image,
          firstDayOfMonth: user.firstDayOfMonth,
          dateFormat: user.dateFormat,
          currency: user.currency,
        }}
      />
    </div>
  );
}
