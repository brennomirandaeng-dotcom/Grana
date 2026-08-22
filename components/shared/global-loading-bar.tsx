"use client";
import * as React from "react";
import { useGlobalBusy, useDebouncedShow } from "@/lib/loading-bus";
import { cn } from "@/lib/utils";

const GROW_TARGET = 88; // nunca chega a 100% sozinha — só ao finalizar
const GROW_DURATION_MS = 7000; // crescimento lento, dá impressão de progresso real
const FINISH_DURATION_MS = 200;
const FADE_OUT_DELAY_MS = 250; // segura a barra cheia por um instante antes de sumir

/**
 * Barra fina no topo da tela que se enche progressivamente enquanto alguma
 * ação relevante está em andamento (salvar, excluir, filtrar, navegar). Como
 * não há um progresso real para medir, ela cresce devagar até ~88% e, ao
 * terminar a ação, completa até 100% e desaparece. Só aparece se a operação
 * passar de ~220ms, pra não "piscar" em ações instantâneas.
 */
export function GlobalLoadingBar() {
  const { busy } = useGlobalBusy();
  const show = useDebouncedShow(busy);

  const [width, setWidth] = React.useState(0);
  const [visible, setVisible] = React.useState(false);
  const [prevShow, setPrevShow] = React.useState(show);

  // Ajusta visible/width durante a própria renderização quando `show` muda
  // (em vez de num efeito) — padrão recomendado pelo React para "reagir a
  // uma mudança de valor", evita uma renderização extra desnecessária.
  if (show !== prevShow) {
    setPrevShow(show);
    if (show) {
      setVisible(true);
      setWidth(0);
    } else {
      setWidth(100);
    }
  }

  // Depois que a barra "nasce" zerada, cresce até quase o fim no próximo
  // frame — precisa ser um efeito: só anima se o navegador pintar a largura
  // 0% antes de mudar para o alvo.
  React.useEffect(() => {
    if (!show) return;
    const raf = requestAnimationFrame(() => setWidth(GROW_TARGET));
    return () => cancelAnimationFrame(raf);
  }, [show]);

  // Ao terminar (show vira false), a barra já foi completada até 100% (acima);
  // aqui só segura visível por um instante e depois some.
  React.useEffect(() => {
    if (show || !visible) return;
    const hide = setTimeout(() => setVisible(false), FADE_OUT_DELAY_MS);
    const reset = setTimeout(() => setWidth(0), FADE_OUT_DELAY_MS + 200);
    return () => {
      clearTimeout(hide);
      clearTimeout(reset);
    };
  }, [show, visible]);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-hidden={!visible}
      aria-label={visible ? "Carregando" : undefined}
      className={cn(
        "fixed top-0 inset-x-0 z-[200] h-[3px] overflow-hidden pointer-events-none transition-opacity duration-300",
        visible ? "opacity-100" : "opacity-0"
      )}
    >
      <div
        className="h-full bg-brand motion-safe:transition-[width] motion-safe:ease-out"
        style={{ width: `${width}%`, transitionDuration: `${width >= 100 ? FINISH_DURATION_MS : GROW_DURATION_MS}ms` }}
      />
    </div>
  );
}
