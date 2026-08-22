"use client";
import * as React from "react";
import { useLinkStatus } from "next/link";
import { pushBusy } from "@/lib/loading-bus";

/**
 * Coloque como filho de um <Link> para conectar o estado de navegação dele
 * (useLinkStatus) à barra de carregamento global — sem isso, trocar de tela
 * pelo menu (barra inferior no celular, gaveta, sidebar) não dava nenhum
 * feedback visual entre o toque e a tela nova aparecer.
 */
export function LinkBusyBridge({ message = "Carregando..." }: { message?: string }) {
  const { pending } = useLinkStatus();

  React.useEffect(() => {
    if (!pending) return;
    return pushBusy(message);
  }, [pending, message]);

  return null;
}
