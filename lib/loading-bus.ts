"use client";
import * as React from "react";

// Pub-sub simples para sinalizar "o app está ocupado" globalmente (ex: barra
// de progresso no topo) a partir de qualquer componente, sem precisar de um
// Context Provider por página. Suporta múltiplas operações simultâneas
// (contador) e uma mensagem contextual (a da operação mais recente).

interface BusyState {
  busy: boolean;
  message: string | null;
}

const stack: string[] = []; // pilha de mensagens das operações em andamento
const listeners: ((state: BusyState) => void)[] = [];

function currentState(): BusyState {
  return { busy: stack.length > 0, message: stack[stack.length - 1] ?? null };
}

function emit() {
  const state = currentState();
  listeners.forEach((l) => l(state));
}

/** Marca o início de uma operação. Guarde o retorno e chame-o quando terminar. */
export function pushBusy(message?: string): () => void {
  const entry = message ?? "";
  stack.push(entry);
  emit();
  let released = false;
  return () => {
    if (released) return;
    released = true;
    const idx = stack.lastIndexOf(entry);
    if (idx > -1) stack.splice(idx, 1);
    emit();
  };
}

/** @deprecated use o callback retornado por pushBusy() */
export function popBusy() {
  stack.pop();
  emit();
}

export function useGlobalBusy(): BusyState {
  const [state, setState] = React.useState<BusyState>(currentState);
  React.useEffect(() => {
    listeners.push(setState);
    setState(currentState());
    return () => {
      const idx = listeners.indexOf(setState);
      if (idx > -1) listeners.splice(idx, 1);
    };
  }, []);
  return state;
}

const SHOW_DELAY_MS = 220; // evita "pisca" em operações quase instantâneas

/** Só fica true depois que `active` estiver true por `delay`ms seguidos. */
export function useDebouncedShow(active: boolean, delay = SHOW_DELAY_MS) {
  const [show, setShow] = React.useState(false);
  React.useEffect(() => {
    if (!active) {
      setShow(false);
      return;
    }
    const timer = setTimeout(() => setShow(true), delay);
    return () => clearTimeout(timer);
  }, [active, delay]);
  return show;
}
