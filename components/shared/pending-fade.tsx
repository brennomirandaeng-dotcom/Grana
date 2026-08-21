"use client";
import { useGlobalBusy, useDebouncedShow } from "@/lib/loading-bus";
import { cn } from "@/lib/utils";

/**
 * Envolve uma área de conteúdo (tabela, cards, gráficos) que depende de
 * dados carregados via URL (filtros, período, ordenação). Enquanto uma
 * dessas navegações está em andamento, esmaece o conteúdo antigo em vez de
 * deixá-lo parado sem nenhum feedback — sem precisar de skeleton por rota
 * (que apresentou um bug de streaming neste ambiente, ver commit anterior).
 */
export function PendingFade({ children, className }: { children: React.ReactNode; className?: string }) {
  const { busy } = useGlobalBusy();
  const show = useDebouncedShow(busy);

  return (
    <div aria-busy={show} className={cn("transition-opacity duration-200", show && "opacity-40 pointer-events-none", className)}>
      {children}
    </div>
  );
}
