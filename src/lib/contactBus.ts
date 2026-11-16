import type { Intent } from "../content/types";

export interface Prefill {
  intent: Intent;
  origin: string;
}

const EVT = "dm:contact-prefill";

/** Preselecciona intención y origen en el formulario sin escribir en el mensaje del visitante. */
export function requestContact(p: Prefill) {
  window.dispatchEvent(new CustomEvent<Prefill>(EVT, { detail: p }));
}

export function onContactRequest(fn: (p: Prefill) => void) {
  const h = (e: Event) => fn((e as CustomEvent<Prefill>).detail);
  window.addEventListener(EVT, h);
  return () => window.removeEventListener(EVT, h);
}

const CASE_EVT = "dm:show-case";
/** Abre un caso destacado desde otra sección (p. ej. Capacidades). */
export function showCase(id: string) {
  window.dispatchEvent(new CustomEvent<string>(CASE_EVT, { detail: id }));
}
export function onShowCase(fn: (id: string) => void) {
  const h = (e: Event) => fn((e as CustomEvent<string>).detail);
  window.addEventListener(CASE_EVT, h);
  return () => window.removeEventListener(CASE_EVT, h);
}
