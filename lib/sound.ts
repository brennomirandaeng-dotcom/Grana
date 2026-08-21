// Efeitos sonoros curtos, sintetizados via Web Audio API — sem depender de
// arquivos de áudio externos (evita questões de licenciamento e mantém o
// bundle leve).

let sharedContext: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!sharedContext) sharedContext = new Ctor();
  if (sharedContext.state === "suspended") sharedContext.resume();
  return sharedContext;
}

function tone(ctx: AudioContext, freq: number, startAt: number, duration: number, volume: number, type: OscillatorType = "triangle") {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0, ctx.currentTime + startAt);
  gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + startAt + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + startAt + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime + startAt);
  osc.stop(ctx.currentTime + startAt + duration + 0.02);
}

/** Toca um "cha-ching" de caixa registradora — usado ao registrar uma nova receita. */
export function playCashRegisterSound() {
  const ctx = getContext();
  if (!ctx) return;

  // "cha": dois cliques metálicos rápidos e graves
  tone(ctx, 1046.5, 0, 0.09, 0.1, "square");
  tone(ctx, 1318.5, 0.02, 0.09, 0.08, "square");

  // "ching": acorde agudo e brilhante, com ressonância mais longa
  tone(ctx, 2093, 0.1, 0.55, 0.13, "triangle");
  tone(ctx, 2637, 0.12, 0.5, 0.1, "triangle");
  tone(ctx, 3136, 0.14, 0.45, 0.08, "triangle");
}
