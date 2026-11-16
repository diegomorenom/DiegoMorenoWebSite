import { useEffect, useRef, useState } from "react";
import type { Dictionary, Lang } from "../content/types";
import { site, type Page } from "../content/site";
import { KEYS, writePref } from "../lib/storage";
import { usePrefs } from "../lib/prefs";
import { Wordmark } from "./Wordmark";
import { sectionIds } from "../content/ids";
import { PrefsControls, PrefsPopover } from "./Prefs";

function altHref(page: Page, target: Lang) {
  if (page === "privacy") return site.routes.privacy[target];
  return site.routes.home[target];
}

export function LangSwitch({ t, page, className = "" }: { t: Dictionary; page: Page; className?: string }) {
  const langs: Lang[] = ["es", "en"];
  return (
    <nav aria-label={t.a11y.langLabel} className={className}>
      <ul className="flex items-center gap-1 font-mono text-[0.8125rem] tracking-[0.04em]">
        {langs.map((l) => {
          const current = l === t.lang;
          return (
            <li key={l}>
              <a
                href={altHref(page, l)}
                hrefLang={l}
                lang={l}
                aria-current={current ? "true" : undefined}
                onClick={() => writePref(KEYS.lang, l)}
                className={`inline-flex min-h-11 min-w-9 items-center justify-center rounded-md px-1.5 uppercase no-underline transition-colors duration-200 ${
                  current ? "text-ink underline decoration-accent decoration-2 underline-offset-[6px]" : "text-muted hover:text-ink"
                }`}
              >
                <span className="sr-only">{l === "es" ? "Español" : "English"} </span>
                <span aria-hidden="true">{l}</span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function Header({ t, page }: { t: Dictionary; page: Page }) {
  const { ready } = usePrefs();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuBtn = useRef<HTMLButtonElement>(null);
  const home = site.routes.home[t.lang];
  const anchor = (id: string) => (page === "home" ? `#${id}` : `${home}#${id}`);
  const sid = sectionIds(t.lang);
  const ids = { p: sid.projects, c: sid.capabilities, e: sid.experience, k: sid.contact };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
        menuBtn.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  const links = [
    { href: anchor(ids.p), label: t.nav.projects },
    { href: anchor(ids.c), label: t.nav.capabilities },
    { href: anchor(ids.e), label: t.nav.experience },
  ];

  return (
    <header
      className={`sticky top-0 z-40 border-b bg-bg transition-[border-color] duration-200 ${scrolled ? "border-line" : "border-transparent"}`}
    >
      <div className="wrap flex h-[4.5rem] items-center justify-between gap-6">
        <a href={home} aria-label={t.a11y.home} className="-ml-1 inline-flex min-h-11 items-center rounded-md px-1 text-ink">
          <Wordmark className="h-[1.6rem] w-auto" />
        </a>

        <nav aria-label={t.a11y.nav} className="hidden lg:block">
          <ul className="flex items-center gap-8 text-[1rem]">
            {links.map((l) => (
              <li key={l.href}>
                <a href={l.href} className="relative inline-flex min-h-11 items-center text-ink no-underline after:absolute after:inset-x-0 after:bottom-2.5 after:h-px after:origin-left after:scale-x-0 after:bg-current after:transition-transform after:duration-200 after:ease-[var(--ease-out)] hover:after:scale-x-100">
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-1.5 sm:gap-3">
          <LangSwitch t={t} page={page} className="hidden sm:block" />
          <div className="hidden lg:block">
            <PrefsPopover t={t} />
          </div>
          <a href={anchor(ids.k)} className="btn btn-primary hidden !min-h-11 !px-4 !text-[0.9375rem] md:inline-flex">
            {t.nav.cta}
          </a>
          <button
            ref={menuBtn}
            type="button"
            className="inline-flex size-11 items-center justify-center rounded-lg lg:hidden"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? t.a11y.menuClose : t.a11y.menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
            hidden={!ready}
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" className="size-6">
              <g fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                {menuOpen ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 8h16M4 16h16" />}
              </g>
            </svg>
          </button>
        </div>
      </div>

      {/* Menú móvil */}
      <div id="mobile-menu" hidden={!menuOpen} className="border-t border-line bg-bg lg:hidden">
        <div className="wrap grid gap-6 py-6">
          <nav aria-label={t.a11y.nav}>
            <ul className="grid gap-1 text-[1.25rem] font-display font-semibold">
              {links.map((l) => (
                <li key={l.href}>
                  <a href={l.href} onClick={() => setMenuOpen(false)} className="flex min-h-12 items-center no-underline">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <a href={anchor(ids.k)} onClick={() => setMenuOpen(false)} className="btn btn-primary w-full">
            {t.nav.cta}
          </a>
          <div className="grid gap-5 border-t border-line pt-6">
            <div className="flex items-center justify-between">
              <span className="text-[0.9375rem] font-semibold">{t.prefs.language}</span>
              <LangSwitch t={t} page={page} />
            </div>
            <PrefsControls t={t} idPrefix="mob" />
          </div>
        </div>
      </div>
    </header>
  );
}
