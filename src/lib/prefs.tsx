import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { KEYS, readPref, writePref } from "./storage";

export type ThemePref = "system" | "light" | "dark";
export type Effective = "light" | "dark";
export type MotionPref = "on" | "off";

interface PrefsState {
  ready: boolean;
  theme: ThemePref;
  effective: Effective;
  setTheme: (t: ThemePref) => void;
  motionPref: MotionPref;
  reducedMotion: boolean;
  /** Movimiento efectivo: preferencia del visitante subordinada a prefers-reduced-motion. */
  motionOn: boolean;
  setMotion: (m: MotionPref) => void;
  storageFailed: boolean;
}

const Ctx = createContext<PrefsState | null>(null);

const isTheme = (v: string | null): v is ThemePref => v === "system" || v === "light" || v === "dark";

function apply(theme: ThemePref, effective: Effective, motionOn: boolean, motionPref: MotionPref) {
  const d = document.documentElement;
  d.setAttribute("data-theme", theme);
  d.setAttribute("data-effective-theme", effective);
  d.style.colorScheme = effective;
  d.setAttribute("data-motion", motionOn ? "on" : "off");
  d.setAttribute("data-motion-pref", motionPref);
  const meta = document.querySelector('meta[name="theme-color"]:not([media])');
  if (meta) meta.setAttribute("content", effective === "dark" ? "#172B2D" : "#F3EFE6");
}

export function PrefsProvider({ children }: { children: ReactNode }) {
  // Valores neutros en SSR/hidratación; el DOM ya fue resuelto por /theme-init.js antes del primer pintado.
  const [ready, setReady] = useState(false);
  const [theme, setThemeState] = useState<ThemePref>("system");
  const [systemDark, setSystemDark] = useState(false);
  const [motionPref, setMotionPref] = useState<MotionPref>("on");
  const [reducedMotion, setReduced] = useState(false);
  const [storageFailed, setStorageFailed] = useState(false);

  useEffect(() => {
    const t = readPref(KEYS.theme);
    setThemeState(isTheme(t) ? t : "system");
    const m = readPref(KEYS.motion);
    setMotionPref(m === "off" ? "off" : "on");

    const mqDark = window.matchMedia("(prefers-color-scheme: dark)");
    const mqReduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    setSystemDark(mqDark.matches);
    setReduced(mqReduce.matches);
    const onDark = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    const onReduce = (e: MediaQueryListEvent) => setReduced(e.matches);
    mqDark.addEventListener("change", onDark);
    mqReduce.addEventListener("change", onReduce);
    setReady(true);
    return () => {
      mqDark.removeEventListener("change", onDark);
      mqReduce.removeEventListener("change", onReduce);
    };
  }, []);

  const effective: Effective = theme === "system" ? (systemDark ? "dark" : "light") : theme;
  const motionOn = motionPref === "on" && !reducedMotion;

  useEffect(() => {
    if (ready) apply(theme, effective, motionOn, motionPref);
  }, [ready, theme, effective, motionOn, motionPref]);

  const setTheme = useCallback((t: ThemePref) => {
    setThemeState(t); // primero la interfaz, después intentar persistir
    if (!writePref(KEYS.theme, t)) setStorageFailed(true);
  }, []);

  const setMotion = useCallback((m: MotionPref) => {
    setMotionPref(m);
    if (!writePref(KEYS.motion, m)) setStorageFailed(true);
  }, []);

  const value = useMemo(
    () => ({ ready, theme, effective, setTheme, motionPref, reducedMotion, motionOn, setMotion, storageFailed }),
    [ready, theme, effective, setTheme, motionPref, reducedMotion, motionOn, setMotion, storageFailed],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function usePrefs() {
  const v = useContext(Ctx);
  if (!v) throw new Error("usePrefs fuera de PrefsProvider");
  return v;
}
