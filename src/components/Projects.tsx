import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import type { CaseStudy, Dictionary } from "../content/types";
import { sectionIds } from "../content/ids";
import { onShowCase, requestContact } from "../lib/contactBus";
import { usePrefs } from "../lib/prefs";
import { track } from "../lib/track";

gsap.registerPlugin(useGSAP, ScrollTrigger);

/** Diagrama simplificado del caso: tres pasos conectados. Explica la idea, no representa una arquitectura real. */
function Flow({ steps, label, active }: { steps: [string, string, string]; label: string; active: boolean }) {
  const ref = useRef<HTMLOListElement>(null);
  const { ready, motionOn } = usePrefs();
  useGSAP(
    () => {
      if (!ready || !motionOn || !active || !ref.current) return;
      const tl = gsap.timeline();
      tl.from(ref.current.querySelectorAll(".flow-node"), { opacity: 0, y: 8, duration: 0.4, ease: "expo.out", stagger: 0.12 })
        .from(ref.current.querySelectorAll(".flow-link"), { scaleX: 0, transformOrigin: "left center", duration: 0.35, ease: "power2.out", stagger: 0.12 }, 0.15)
        .fromTo(
          ref.current.querySelectorAll(".flow-dot"),
          { opacity: 0, xPercent: -50, left: "0%" },
          { opacity: 1, left: "100%", duration: 0.7, ease: "power2.inOut", stagger: 0.25, onComplete: () => void gsap.to(ref.current?.querySelectorAll(".flow-dot") ?? [], { opacity: 0, duration: 0.3 }) },
          0.5,
        );
    },
    { scope: ref, dependencies: [active, ready, motionOn], revertOnUpdate: true },
  );
  return (
    <figure className="mt-6">
      <figcaption className="label-mono mb-3">{label}</figcaption>
      <ol ref={ref} className="flow grid items-center gap-2 sm:grid-cols-[1fr_2.5rem_1fr_2.5rem_1fr]">
        {steps.map((s, i) => (
          <li key={s} className="contents">
            <span
              className={`flow-node flex items-center gap-2.5 rounded-lg border px-3.5 py-2.5 sm:min-h-[4.25rem] sm:py-3 text-[0.9375rem] font-semibold leading-snug ${
                i === 1 ? "border-action bg-[color-mix(in_srgb,var(--dm-action)_8%,transparent)]" : "border-line"
              }`}
            >
              <span aria-hidden="true" className={`size-2 shrink-0 rounded-full ${i === 2 ? "bg-accent" : "border-[1.5px] border-accent"}`} />
              {s}
            </span>
            {i < 2 && (
              <span aria-hidden="true" className="relative ml-[1.15rem] h-3 w-px sm:mx-auto sm:h-px sm:w-full">
                <span className="flow-link absolute inset-0 bg-border" />
                <span className="flow-dot absolute top-1/2 hidden size-2 -translate-y-1/2 rounded-full bg-accent opacity-0 sm:block" />
              </span>
            )}
          </li>
        ))}
      </ol>
    </figure>
  );
}

function CasePanel({ c, t, contactId, active, onDetail }: { c: CaseStudy; t: Dictionary; contactId: string; active: boolean; onDetail: (open: boolean) => void }) {
  const [more, setMore] = useState(false);
  useEffect(() => {
    if (!active && more) {
      setMore(false);
      onDetail(false);
    }
  }, [active, more, onDetail]);
  const detailId = useId();
  return (
    <div className="case-panel">
      <p className="text-lead text-ink">{c.short}</p>
      <Flow steps={c.flow} label={t.projects.flowLabel} active={active} />
      <dl className="mt-6 grid gap-4 sm:grid-cols-[9.5rem_1fr]">
        <dt className="label-mono pt-0.5">{c.contributionLabel}</dt>
        <dd className="text-ink-2">{c.contribution}</dd>
        <dt className="label-mono pt-1.5">Stack</dt>
        <dd>
          <ul className="flex flex-wrap gap-1.5">
            {c.stack.map((s) => (
              <li key={s} className="rounded-md border border-line px-2.5 py-1 font-mono text-[0.75rem] leading-5 text-ink-2">
                {s}
              </li>
            ))}
          </ul>
        </dd>
      </dl>

      <div id={detailId} className="case-detail" data-open={more} inert={!more}>
        <div>
          <div className="mt-6 grid gap-4 border-t border-line pt-6">
            <p className="max-w-[62ch] text-ink-2">{c.summary}</p>
            <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-[9.5rem_1fr]">
              {c.detail.map((d) => (
                <div key={d.label} className="contents">
                  <dt className="label-mono pt-[0.2rem]">{d.label}</dt>
                  <dd className="max-w-[56ch] text-ink-2">{d.text}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>

      <div className="mt-7 flex flex-wrap items-center gap-3">
        <a href={`#${contactId}`} onClick={() => requestContact({ intent: c.intent, origin: c.title })} className="btn btn-secondary">
          {c.contactPrompt}
        </a>
        <button
          type="button"
          aria-expanded={more}
          aria-controls={detailId}
          onClick={() => {
            const next = !more;
            setMore(next);
            onDetail(next);
            if (next) track("case_view", { case_id: c.id });
          }}
          className="btn btn-tertiary"
        >
          {more ? t.projects.close : t.projects.open}
          <svg aria-hidden="true" viewBox="0 0 16 16" className={`size-4 transition-transform duration-300 ease-[var(--ease-out)] ${more ? "rotate-180" : ""}`}>
            <path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export function Projects({ t }: { t: Dictionary }) {
  const ids = sectionIds(t.lang);
  const cases = t.projects.cases;
  const [active, setActive] = useState(0);
  const [more, setMore] = useState(false);
  const moreId = useId();
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const trackRef = useRef<HTMLDivElement>(null);
  const panelsRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLSpanElement>(null);
  const stRef = useRef<ScrollTrigger | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const { ready, motionOn } = usePrefs();

  // Escritorio: el caso activo avanza con el scroll nativo dentro de un recorrido fijo (sticky). Sin capturar la rueda.
  useGSAP(
    () => {
      const track = trackRef.current;
      if (!ready || !track) return;
      const mm = gsap.matchMedia();
      mm.add("(min-width: 64rem)", () => {
        if (detailOpen) return;
        const st = ScrollTrigger.create({
          trigger: track,
          start: "top top+=96",
          end: "bottom bottom",
          onUpdate: (self) => {
            const i = Math.min(cases.length - 1, Math.floor(self.progress * cases.length * 0.999));
            setActive((prev) => (prev === i ? prev : i));
            if (progressRef.current) progressRef.current.style.transform = `scaleY(${self.progress})`;
          },
        });
        stRef.current = st;
        return () => {
          st.kill();
          stRef.current = null;
        };
      });
      return () => mm.revert();
    },
    { dependencies: [ready, detailOpen, cases.length] },
  );

  // Transición suave del panel al cambiar de caso
  useGSAP(
    () => {
      if (!ready || !motionOn) return;
      const panel = panelsRef.current?.querySelector(`[data-panel="${active}"]`);
      if (panel) gsap.fromTo(panel, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" });
    },
    { dependencies: [active, ready, motionOn] },
  );

  /** Al pulsar un caso en escritorio, se desplaza hasta su tramo del recorrido (así el scroll y la selección coinciden). */
  const select = (i: number) => {
    const st = stRef.current;
    if (st) {
      const y = st.start + ((st.end - st.start) * (i + 0.5)) / cases.length;
      const reduce = document.documentElement.getAttribute("data-motion") === "off";
      window.scrollTo({ top: y, behavior: reduce ? "auto" : "smooth" });
    }
    setActive(i);
  };

  useEffect(
    () =>
      onShowCase((id) => {
        const i = cases.findIndex((c) => c.id === id);
        if (i >= 0) select(i);
      }),
    [cases],
  );

  // Navegación con flechas entre casos (patrón de pestañas accesible)
  const onKey = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    const n = cases.length;
    let next = -1;
    if (e.key === "ArrowDown" || e.key === "ArrowRight") next = (i + 1) % n;
    if (e.key === "ArrowUp" || e.key === "ArrowLeft") next = (i - 1 + n) % n;
    if (e.key === "Home") next = 0;
    if (e.key === "End") next = n - 1;
    if (next >= 0) {
      e.preventDefault();
      select(next);
      tabRefs.current[next]?.focus();
    }
  };

  return (
    <section id={ids.projects} aria-labelledby="projects-title" data-route className="py-20 md:py-24">
      <div className="wrap">
        <div className="grid gap-6 md:grid-cols-12 md:gap-8">
          <h2 id="projects-title" data-reveal className="text-section md:col-span-7">
            {t.projects.title}
          </h2>
          <p className="max-w-[52ch] text-ink-2 md:col-span-5 md:pt-2">{t.projects.intro}</p>
        </div>

        {/* Selector de casos: lista a la izquierda y detalle a la derecha (escritorio); acordeón en móvil */}
        <div ref={trackRef} className={`showcase-track mt-12 md:mt-14 ${detailOpen ? "is-static" : ""}`} data-steps={cases.length}>
        <div className="showcase">
          <div role="tablist" aria-orientation="vertical" aria-label={t.projects.title} className="showcase-tabs">
            <span aria-hidden="true" className="showcase-progress"><span ref={progressRef} /></span>
            {cases.map((c, i) => (
              <button
                key={c.id}
                ref={(el) => void (tabRefs.current[i] = el)}
                role="tab"
                id={`tab-${c.id}`}
                aria-selected={active === i}
                aria-controls={`caso-${c.id}`}
                tabIndex={active === i ? 0 : -1}
                onClick={() => select(i)}
                onKeyDown={(e) => onKey(e, i)}
                className="showcase-tab group"
              >
                <span className="label-mono block">{c.sector}</span>
                <span className="mt-1.5 flex items-start justify-between gap-4">
                  <span className="font-display text-[1.1875rem] font-semibold leading-snug tracking-[-0.01em]">{c.title}</span>
                  <svg aria-hidden="true" viewBox="0 0 20 20" className="showcase-arrow mt-1 size-[18px] shrink-0">
                    <path d="M4 10h11M11 5.5 15.5 10 11 14.5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </button>
            ))}
          </div>
          <div ref={panelsRef} className="showcase-panels">
            {cases.map((c, i) => (
              <div
                key={c.id}
                id={`caso-${c.id}`}
                role="tabpanel"
                aria-labelledby={`tab-${c.id}`}
                hidden={active !== i}
                data-panel={i}
                tabIndex={0}
                className="outline-none"
              >
                <h3 className="sr-only">{c.title}</h3>
                <CasePanel c={c} t={t} contactId={ids.contact} active={active === i} onDetail={setDetailOpen} />
              </div>
            ))}
          </div>
        </div>
        </div>

        {/* Más proyectos: colapsado por defecto */}
        <div className="mt-14 flex flex-col gap-5 border-t border-line pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-[52ch] text-ink-2">{t.projects.moreIntro}</p>
          <button type="button" aria-expanded={more} aria-controls={moreId} onClick={() => setMore((v) => !v)} className="btn btn-secondary shrink-0">
            {more ? t.projects.moreClose : `${t.projects.moreButton} (${t.projects.inventory.length})`}
            <svg aria-hidden="true" viewBox="0 0 16 16" className={`size-4 transition-transform duration-300 ease-[var(--ease-out)] ${more ? "rotate-180" : ""}`}>
              <path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
        <div id={moreId} className="case-detail" data-open={more} inert={!more}>
          <div>
            <h3 className="sr-only">{t.projects.moreTitle}</h3>
            <ul className="mt-6 grid gap-x-10 sm:grid-cols-2 lg:grid-cols-3">
              {t.projects.inventory.map((p) => (
                <li key={p.title} className="border-t border-line py-5">
                  <p className="label-mono flex flex-wrap items-center gap-x-2">
                    {p.sector}
                    {p.status && (
                      <>
                        <span aria-hidden="true" className="size-1 rounded-full bg-accent" />
                        <span className="text-ink">{p.status}</span>
                      </>
                    )}
                  </p>
                  <h4 className="mt-1.5 font-display text-[1.0625rem] font-semibold leading-snug">{p.title}</h4>
                  <p className="mt-1.5 text-[0.9375rem] leading-relaxed text-ink-2">{p.text}</p>
                  <p className="mt-2 font-mono text-[0.75rem] leading-relaxed text-muted">{p.stack.join(" · ")}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-5 rounded-xl bg-[color-mix(in_srgb,var(--dm-action)_7%,transparent)] px-6 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p className="font-display text-[1.25rem] font-semibold tracking-[-0.01em]">{t.projects.afterCta}</p>
          <a href={`#${ids.contact}`} onClick={() => requestContact({ intent: "project", origin: t.projects.title })} className="btn btn-primary shrink-0">
            {t.hero.cta}
            <svg aria-hidden="true" viewBox="0 0 20 20" className="btn-arrow size-[18px]">
              <path d="M4 10h11M11 5.5 15.5 10 11 14.5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}
