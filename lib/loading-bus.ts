"use client";
import * as React from "react";

// Pub-sub simples para sinalizar "o app está ocupado" globalmente (ex: barra
// de progresso no topo) a partir de qualquer componente, sem precisar de um
// Context Provider por página.

let busyCount = 0;
const listeners: ((busy: boolean) => void)[] = [];

function emit() {
  const busy = busyCount > 0;
  listeners.forEach((l) => l(busy));
}

export function pushBusy() {
  busyCount += 1;
  emit();
}

export function popBusy() {
  busyCount = Math.max(0, busyCount - 1);
  emit();
}

export function useGlobalBusy() {
  const [busy, setBusy] = React.useState(busyCount > 0);
  React.useEffect(() => {
    listeners.push(setBusy);
    return () => {
      const idx = listeners.indexOf(setBusy);
      if (idx > -1) listeners.splice(idx, 1);
    };
  }, []);
  return busy;
}
