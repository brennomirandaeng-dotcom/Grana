import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Memoizado em memória (por instância do servidor) só pro lado "true": uma
// vez que exista um admin, isso nunca deixa de ser verdade na prática, então
// não há necessidade de reconferir no banco. O lado "false" nunca é
// cacheado — sempre reconsulta ao vivo, já que é o estado transitório de
// bootstrap (antes do primeiro admin existir) onde a resposta correta
// importa a cada requisição.
let cachedAdminExists = false;

/**
 * Se já existe algum administrador cadastrado. Usado no layout raiz — que
 * roda em toda navegação e a cada router.refresh() depois de qualquer ação
 * — só pra decidir se o link "Administração" aparece pra quem ainda não é
 * admin. Sem essa memoização, toda ação de todo usuário comum pagava uma
 * consulta extra ao banco só pra essa checagem.
 */
export async function adminExists() {
  if (cachedAdminExists) return true;
  cachedAdminExists = (await prisma.user.count({ where: { role: "ADMIN" } })) > 0;
  return cachedAdminExists;
}

/**
 * Retorna a sessão atual ou lança erro — usar em Server Actions/Components
 * dentro de rotas protegidas. Também confere se a conta ainda está ativa:
 * uma conta desativada por um administrador perde acesso imediatamente,
 * mesmo com uma sessão (JWT) ainda válida.
 */
export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Não autenticado");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, image: true, role: true, active: true },
  });
  if (!user || !user.active) throw new Error("Sua conta foi desativada. Entre em contato com o administrador.");

  return user;
}

/**
 * Como requireUser(), mas exige que o usuário seja administrador. Se ainda
 * não existe nenhum administrador no sistema, promove automaticamente o
 * usuário mais antigo cadastrado (bootstrap) — evita precisar de acesso
 * direto ao banco para criar o primeiro admin.
 */
export async function requireAdmin() {
  const user = await requireUser();
  if (user.role === "ADMIN") return user;

  const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
  if (adminCount === 0) {
    const oldest = await prisma.user.findFirst({ orderBy: { createdAt: "asc" }, select: { id: true } });
    if (oldest?.id === user.id) {
      await prisma.user.update({ where: { id: user.id }, data: { role: "ADMIN" } });
      return { ...user, role: "ADMIN" as const };
    }
  }

  throw new Error("Acesso restrito a administradores");
}
