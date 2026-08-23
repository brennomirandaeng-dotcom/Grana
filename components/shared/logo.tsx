import { cn } from "@/lib/utils";

/**
 * O arquivo em /public/logo.png é branco sólido sobre fundo transparente —
 * não dá pra usar direto como <img> em fundos claros (fica invisível).
 * Renderizado aqui como máscara CSS (o alfa do PNG define o formato),
 * pintada com a cor de texto do contexto (bg-current), então acompanha o
 * tema claro/escuro e qualquer painel colorido automaticamente.
 */
export function Logo({ className }: { className?: string }) {
  return (
    <span
      role="img"
      aria-label="Grana"
      className={cn("inline-block bg-current shrink-0", className)}
      style={{
        maskImage: "url(/logo.png)",
        maskSize: "contain",
        maskRepeat: "no-repeat",
        maskPosition: "left center",
        WebkitMaskImage: "url(/logo.png)",
        WebkitMaskSize: "contain",
        WebkitMaskRepeat: "no-repeat",
        WebkitMaskPosition: "left center",
      }}
    />
  );
}
