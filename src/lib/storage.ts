// Acceso a localStorage tolerante a fallos (modo privado, bloqueos, cuotas).
export function readPref(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

/** Devuelve false si no se pudo guardar; la elección se mantiene en memoria durante la visita. */
export function writePref(key: string, value: string): boolean {
  try {
    window.localStorage.setItem(key, value);
    return window.localStorage.getItem(key) === value;
  } catch {
    return false;
  }
}

export const KEYS = {
  theme: "diego-moreno-theme",
  motion: "diego-moreno-background-motion",
  lang: "diego-moreno-lang",
} as const;
