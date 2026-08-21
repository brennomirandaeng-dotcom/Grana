"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { pushBusy } from "@/lib/loading-bus";

/**
 * Mesma ideia do useActionRefresh, mas para navegação via router.push (troca
 * de filtro, período, ordenação, mês) — mantém a barra global visível durante
 * a transição para os novos dados, em vez de a tela ficar parada sem feedback.
 */
export function useNavigateWithBusy(defaultMessage = "Atualizando...") {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();
  const messageRef = React.useRef(defaultMessage);

  React.useEffect(() => {
    if (!isPending) return;
    return pushBusy(messageRef.current);
  }, [isPending]);

  const navigate = React.useCallback(
    (url: string, message?: string) => {
      messageRef.current = message ?? defaultMessage;
      startTransition(() => {
        router.push(url);
      });
    },
    [router, defaultMessage]
  );

  return { navigate, isPending };
}
