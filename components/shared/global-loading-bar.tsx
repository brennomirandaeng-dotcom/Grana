"use client";
import { useGlobalBusy, useDebouncedShow } from "@/lib/loading-bus";
import { cn } from "@/lib/utils";

/**
 * Barra fina no topo da tela + pill de mensagem contextual, visível sempre
 * que alguma ação relevante está em andamento (salvar, excluir, filtrar,
 * navegar). Só aparece se a operação passar de ~220ms, pra não "piscar" em
 * ações instantâneas.
 */
export function GlobalLoadingBar() {
  const { busy, message } = useGlobalBusy();
  const show = useDebouncedShow(busy);

  return (
    <>
      <div
        aria-hidden={!show}
        className={cn(
          "fixed top-0 inset-x-0 z-[200] h-[3px] overflow-hidden pointer-events-none transition-opacity duration-200",
          show ? "opacity-100" : "opacity-0"
        )}
      >
        <div className={cn("h-full w-1/3 bg-brand rounded-full", show && "motion-safe:animate-loading-bar")} />
      </div>

      {show && message && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-3 right-3 z-[200] flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground shadow-sm animate-in fade-in slide-in-from-top-1"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-brand motion-safe:animate-pulse" />
          {message}
        </div>
      )}
    </>
  );
}
