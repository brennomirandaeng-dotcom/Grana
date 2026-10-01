/**
 * As Server Actions agora retornam { error: string } em vez de lançar erro
 * de validação (lançar faz o Next.js ocultar a mensagem em produção,
 * tratando como bug interno — ver node_modules/next/dist/docs/01-app/
 * 01-getting-started/10-error-handling.md). Este helper faz a ponte pro
 * padrão já usado em toda a UI (try/catch + toast com err.message): chama
 * a action e, se ela voltar com { error }, relança como um Error comum do
 * lado do cliente — sem precisar mudar nenhum componente que já captura o
 * erro dessa forma.
 */
export async function callAction<T>(promise: Promise<T | { error: string }>): Promise<T> {
  const result = await promise;
  if (result && typeof result === "object" && "error" in result && typeof (result as { error: unknown }).error === "string") {
    throw new Error((result as { error: string }).error);
  }
  return result as T;
}
