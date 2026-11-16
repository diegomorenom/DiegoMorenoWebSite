import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import type { Dictionary } from "../content/types";
import { sectionIds } from "../content/ids";
import { site } from "../content/site";
import { requestContact, showCase } from "../lib/contactBus";
import { usePrefs } from "../lib/prefs";
import { CapabilityArt } from "./CapabilityArt";

gsap.registerPlugin(useGSAP);

/**
 * «En qué puedo ayudarte» como índice de un cuaderno de campo: a la izquierda, las capacidades como entradas
 * editoriales; a la derecha, una lámina fija que se dibuja con la capacidad activa. La entrada activa sigue
 * al scroll nativo (la que cruza el centro de la pantalla) y también al cursor o al foco del teclado.
 */
export function Capabilities({ t }: { t: Dictionary }) {
  const ids = sectionIds(t.lang);
  const items = t.capabilities.items;
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLOListElement>(null);
  const plateRef = useRef<HTMLDivElement>(null);
  const markerRef = useRef<HTMLSpanElement>(null);
  const { ready, motionOn } = usePrefs();

  // Entrada activa según el scroll (escritorio): la más cercana al centro de la pantalla, calculada en cada frame
  // de scroll. Así ninguna entrada se salta aunque sea corta o el scroll sea rápido.
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const mq = window.matchMedia("(min-width: 64rem)");
    const rows = Array.from(list.querySelectorAll<HTMLElement>("[data-cap]"));
    let raf = 0;
    const pick = () => {
      raf = 0;
      if (!mq.matches) return;
      const mid = window.innerHeight * 0.5;
      const first = rows[0].getBoundingClientRect();
      const last = rows[rows.length - 1].getBoundingClientRect();
      if (first.top > window.innerHeight || last.bottom < 0) return;
      let best = 0;
      let bestD = Infinity;
      rows.forEach((r, i) => {
        const b = r.getBoundingClientRect();
        const d = Math.abs(b.top + b.height / 2 - mid);
        if (d < bestD) {
          bestD = d;
          best = i;
        }
      });
      setActive((prev) => (prev === best ? prev : best));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(pick);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    pick();
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  // Marcador cobre compartido: viaja hasta la entrada activa
  useEffect(() => {
    const row = listRef.current?.querySelector<HTMLElement>(`[data-cap="${active}"]`);
    const title = row?.querySelector<HTMLElement>(".cap-title");
    if (row && title && markerRef.current) markerRef.current.style.transform = `translateY(${row.offsetTop + title.offsetTop + 10}px)`;
  }, [active]);

  // La lámina activa se dibuja: trazos, luego nodos, luego lo accesorio
  useGSAP(
    () => {
      const plate = plateRef.current?.querySelector<SVGSVGElement>(`[data-art="${active}"]`);
      if (!plate || !ready) return;
      if (!motionOn) return;
      const tl = gsap.timeline();
      tl.fromTo(plate.querySelectorAll(".art-draw"), { strokeDasharray: 1, strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.9, ease: "power2.inOut", stagger: 0.08 })
        .fromTo(plate.querySelectorAll(".art-pop"), { opacity: 0, scale: 0.4, transformOrigin: "50% 50%" }, { opacity: 1, scale: 1, duration: 0.4, ease: "back.out(2)", stagger: 0.02 }, 0.35)
        .fromTo(plate.querySelectorAll(".art-fade"), { opacity: 0 }, { opacity: 1, duration: 0.5, ease: "power1.out" }, 0.2);
    },
    { scope: plateRef, dependencies: [active, ready, motionOn], revertOnUpdate: true },
  );

  return (
    <section id={ids.capabilities} aria-labelledby="cap-title" data-route className="py-20 md:py-24">
      <div className="wrap">
        <div className="grid gap-6 md:grid-cols-12 md:gap-8">
          <h2 id="cap-title" data-reveal className="text-section md:col-span-7">
            {t.capabilities.title}
          </h2>
        </div>

        <div className="mt-10 grid gap-10 lg:mt-14 lg:grid-cols-12 lg:gap-14">
          <div className="relative lg:col-span-6">
            <span ref={markerRef} aria-hidden="true" className="cap-marker hidden lg:block" />
            <ol ref={listRef} className="cap-list">
              {items.map((c, i) => (
                <li
                  key={c.id}
                  data-cap={i}
                  data-active={active === i}
                  onPointerEnter={() => setActive(i)}
                  onFocus={() => setActive(i)}
                  className="cap-row"
                >
                  <div className="flex items-start justify-between gap-6">
                    <div className="min-w-0">
                      <h3 id={`cap-${c.id}`} className="cap-title">
                        {c.title}
                      </h3>
                      <p className="mt-2 max-w-[46ch] text-[0.9844rem] leading-relaxed text-ink-2">{c.text}</p>
                      <p className="mt-3 font-mono text-[0.75rem] leading-relaxed text-muted">{c.tags.join(" · ")}</p>
                      {c.relatedCase && (
                        <a href={`#${ids.projects}`} onClick={() => showCase(c.relatedCase!)} className="cap-link">
                          {c.relatedLabel}
                          <svg aria-hidden="true" viewBox="0 0 20 20" className="size-4">
                            <path d="M4 10h11M11 5.5 15.5 10 11 14.5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </a>
                      )}
                    </div>
                    {/* En móvil la lámina acompaña a cada entrada, en pequeño y estática */}
                    <CapabilityArt id={c.id} className="cap-art-inline lg:hidden" />
                  </div>
                </li>
              ))}
            </ol>
            <p className="mt-8 flex flex-wrap items-center gap-x-3 gap-y-1 text-ink-2">
              {t.lang === "es" ? "¿Tu reto no encaja del todo aquí?" : "Is your challenge outside these areas?"}
              <a
                href={`#${ids.contact}`}
                onClick={() => requestContact({ intent: "project", origin: t.capabilities.title })}
                className="btn btn-tertiary !px-0"
              >
                {t.lang === "es" ? "Cuéntamelo" : "Tell me about it"}
              </a>
            </p>
          </div>

          {/* Lámina fija (escritorio) */}
          <div className="hidden lg:col-span-6 lg:block">
            <div ref={plateRef} className="cap-plate" aria-hidden="true">
              <svg className="cap-plate-grid" viewBox="0 0 480 360" preserveAspectRatio="none" focusable="false">
                {Array.from({ length: 7 }, (_, i) => (
                  <path key={i} d={`M0,${60 + i * 44} C120,${48 + i * 44} 240,${74 + i * 44} 480,${56 + i * 44}`} />
                ))}
              </svg>
              {items.map((c, i) => (
                <div key={c.id} className="cap-plate-art" data-on={active === i}>
                  <CapabilityArtWrapper id={c.id} index={i} />
                </div>
              ))}
              <p className="cap-plate-label label-mono">{items[active]?.title}</p>
            </div>
          </div>
        </div>

        <CloudRow t={t} />
      </div>
    </section>
  );
}

function CapabilityArtWrapper({ id, index }: { id: string; index: number }) {
  return (
    <div data-art={index} className="h-full w-full">
      <CapabilityArt id={id} className="h-full w-full" />
    </div>
  );
}

/** Nube: una sola franja ligera sobre el mismo fondo. Logos oficiales opcionales (site.cloudLogos). */
function CloudRow({ t }: { t: Dictionary }) {
  const c = t.capabilities.cloud;
  return (
    <div role="region" aria-labelledby="cloud-title" className="mt-16 grid gap-6 border-t border-line pt-8 lg:grid-cols-12 lg:items-center lg:gap-10">
      <div className="lg:col-span-5">
        <h3 id="cloud-title" className="text-[1.1875rem] tracking-[-0.01em]">
          {c.title}
        </h3>
        <p className="mt-2 text-[0.9844rem] leading-relaxed text-ink-2">{c.lead}</p>
      </div>
      <ul className="flex flex-wrap items-center gap-x-10 gap-y-5 lg:col-span-7 lg:justify-end">
        {c.platforms.map((p, i) => (
          <li key={p.id} className="flex flex-col gap-1">
            {site.cloudLogos[p.id] ? (
              <span className={`cloud-logo cloud-logo-${p.id}`} role="img" aria-label={p.name} />
            ) : (
              <span className={`font-display font-bold leading-none tracking-[-0.02em] ${i === 0 ? "text-[2rem]" : "text-[1.375rem]"}`}>{p.name}</span>
            )}
            <span className="label-mono flex items-center gap-1.5">
              {i === 0 && <span aria-hidden="true" className="size-1.5 rounded-full bg-accent" />}
              {p.role}
            </span>
          </li>
        ))}
      </ul>
      <p className="text-[0.8125rem] text-muted lg:col-span-12">{c.note}</p>
    </div>
  );
}
