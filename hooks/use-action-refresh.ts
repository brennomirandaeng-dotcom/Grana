"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { pushBusy, popBusy } from "@/lib/loading-bus";

/**
 * Atualiza os dados da página (router.refresh) marcando o app como "ocupado"
 * globalmente (barra de progresso no topo) até a nova renderização terminar —
 * sem isso, entre o fechar do modal e os dados novos aparecerem, a tela fica
 * parada sem nenhum indício de que algo está acontecendo.
 */
export function useActionRefresh() {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();

  React.useEffect(() => {
    if (!isPending) return;
    pushBusy();
    return () => popBusy();
  }, [isPending]);

  const refresh = React.useCallback(() => {
    startTransition(() => {
      router.refresh();
    });
  }, [router]);

  return { refresh, isPending };
}
