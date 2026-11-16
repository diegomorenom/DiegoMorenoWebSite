import { useEffect, useId, useRef, useState } from "react";
import type { Dictionary } from "../content/types";
import { usePrefs, type ThemePref } from "../lib/prefs";

/** Control de apariencia: Tema (select nativo) + Animación de fondo (switch). Solo se muestra con JS activo. */
export function PrefsControls({ t, idPrefix }: { t: Dictionary; idPrefix: string }) {
  const { theme, setTheme, motionPref, motionOn, reducedMotion, setMotion, storageFailed } = usePrefs();
  const themeId = `${idPrefix}-theme`;
  const motionLabelId = `${idPrefix}-motion-label`;
  const noteId = `${idPrefix}-motion-note`;

  return (
    <div className="grid gap-4">
      <div className="grid gap-1.5">
        <label htmlFor={themeId} className="text-[0.9375rem] font-semibold">
          {t.prefs.theme}
        </label>
        <div className="relative">
          <select
            id={themeId}
            value={theme}
            onChange={(e) => setTheme(e.target.value as ThemePref)}
            className="field appearance-none pr-10 !min-h-11 cursor-pointer"
          >
            <option value="system">{t.prefs.system}</option>
            <option value="light">{t.prefs.light}</option>
            <option value="dark">{t.prefs.dark}</option>
          </select>
          <svg aria-hidden="true" viewBox="0 0 16 16" className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2">
            <path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>

      <div className="grid gap-1.5">
        <span id={motionLabelId} className="text-[0.9375rem] font-semibold">
          {t.prefs.motion}
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={motionOn}
          aria-labelledby={motionLabelId}
          aria-describedby={reducedMotion ? noteId : undefined}
          disabled={reducedMotion}
          onClick={() => setMotion(motionPref === "on" ? "off" : "on")}
          className="group flex min-h-11 items-center justify-between gap-3 rounded-lg border border-border bg-surface px-3.5 text-left disabled:cursor-not-allowed disabled:opacity-80"
        >
          <span className="text-[0.9375rem]">{motionOn ? t.prefs.on : t.prefs.off}</span>
          <span
            aria-hidden="true"
            className="relative inline-flex h-6 w-10 shrink-0 items-center rounded-full border border-border transition-colors duration-200 group-aria-checked:bg-action"
          >
            <span className="absolute left-[3px] size-4 rounded-full bg-ink transition-transform duration-200 ease-[var(--ease-out)] group-aria-checked:translate-x-4 group-aria-checked:bg-action-ink" />
          </span>
        </button>
        {reducedMotion && (
          <p id={noteId} className="text-[0.875rem] leading-snug text-muted">
            {t.prefs.reducedNote}
          </p>
        )}
      </div>
      {storageFailed && (
        <p role="status" className="text-[0.875rem] leading-snug text-muted">
          {t.prefs.noStorage}
        </p>
      )}
    </div>
  );
}

/** Botón compacto + panel para escritorio. */
export function PrefsPopover({ t }: { t: Dictionary }) {
  const { ready } = usePrefs();
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        btnRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onDown);
    rootRef.current?.addEventListener("keydown", onKey);
    const node = rootRef.current;
    return () => {
      document.removeEventListener("pointerdown", onDown);
      node?.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!ready) return null; // sin JS no se muestra un control que no puede funcionar

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={btnRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={t.a11y.prefs}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex size-11 items-center justify-center rounded-lg text-ink transition-colors duration-200 hover:bg-[color-mix(in_srgb,var(--dm-text)_8%,transparent)]"
      >
        {/* icono de ajustes: dos reguladores, trazo 1.6 en retícula 24 */}
        <svg aria-hidden="true" viewBox="0 0 24 24" className="size-[22px]">
          <g fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
            <path d="M4 8h9M17 8h3M4 16h3M11 16h9" />
            <circle cx="15" cy="8" r="2.2" />
            <circle cx="9" cy="16" r="2.2" />
          </g>
        </svg>
      </button>
      <div
        id={panelId}
        hidden={!open}
        className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-72 origin-top-right rounded-xl border border-line bg-surface p-5 shadow-[0_12px_32px_-12px_rgb(23_43_45/0.35)]"
      >
        <p className="mb-4 font-display text-[1rem] font-bold">{t.a11y.prefs}</p>
        <PrefsControls t={t} idPrefix="desk" />
      </div>
    </div>
  );
}
