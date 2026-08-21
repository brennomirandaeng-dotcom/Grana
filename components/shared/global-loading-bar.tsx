"use client";
import { useGlobalBusy } from "@/lib/loading-bus";
import { cn } from "@/lib/utils";

/** Barra fina no topo da tela, visível sempre que alguma ação está em andamento. */
export function GlobalLoadingBar() {
  const busy = useGlobalBusy();

  return (
    <div
      aria-hidden={!busy}
      className={cn(
        "fixed top-0 inset-x-0 z-[200] h-[3px] overflow-hidden pointer-events-none transition-opacity duration-200",
        busy ? "opacity-100" : "opacity-0"
      )}
    >
      <div className={cn("h-full w-1/3 bg-brand rounded-full", busy && "animate-loading-bar")} />
    </div>
  );
}
