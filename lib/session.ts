import { auth } from "@/lib/auth";

/** Retorna a sessão atual ou lança erro — usar em Server Actions/Components dentro de rotas protegidas. */
export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Não autenticado");
  return session.user as { id: string; name?: string | null; email?: string | null; image?: string | null };
}
