import { useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import type { Dictionary } from "../content/types";
import { sectionIds } from "../content/ids";
import { site } from "../content/site";
import { usePrefs } from "../lib/prefs";
import { track } from "../lib/track";

gsap.registerPlugin(useGSAP, ScrollTrigger);

function Venn({ t }: { t: Dictionary }) {
  const v = t.experience.venn;
  const ref = useRef<SVGSVGElement>(null);
  const { ready, motionOn } = usePrefs();

  // Los tres conjuntos se trazan cuando el diagrama ya está a la vista (al menos 45 % visible), una sola vez;
  // la órbita de la creatividad los une al final. Se usa IntersectionObserver para no depender de posiciones
  // calculadas al cargar (la página cambia de alto con la entrada, el recorrido de casos y los desplegables).
  useGSAP(
    () => {
      const svg = ref.current;
      if (!ready || !motionOn || !svg) return;
      const sets = svg.querySelectorAll<SVGCircleElement>("circle.set");
      const fades = svg.querySelectorAll(".venn-fade");
      const tl = gsap.timeline({ paused: true });
      sets.forEach((c, i) => {
        const len = c.getTotalLength();
        tl.fromTo(c, { strokeDasharray: len, strokeDashoffset: len }, { strokeDashoffset: 0, duration: 1.3, ease: "power2.inOut", clearProps: "strokeDasharray,strokeDashoffset" }, i * 0.28);
      });
      tl.fromTo(fades, { opacity: 0 }, { opacity: 1, duration: 0.6, ease: "sine.out", stagger: 0.07 }, ">-0.35");
      tl.progress(0).pause(); // estado inicial: conjuntos sin trazar
      const io = new IntersectionObserver(
        ([e]) => {
          if (e.isIntersecting) {
            tl.play();
            io.disconnect();
          }
        },
        { threshold: 0.45 },
      );
      io.observe(svg);
      return () => io.disconnect();
    },
    { scope: ref, dependencies: [ready, motionOn] },
  );

  return (
    <svg ref={ref} viewBox="0 0 520 500" role="img" aria-label={v.label} className="venn mx-auto h-auto w-full max-w-[30rem]">
      <ellipse className="orbit venn-fade" cx="260" cy="248" rx="248" ry="232" />
      <circle className="core venn-fade" cx="260" cy="16" r="5" />
      <text className="venn-muted venn-fade" x="272" y="21" fontSize="13">
        {v.creativity}
      </text>
      <circle className="set" cx="192" cy="200" r="142" />
      <circle className="set" cx="328" cy="200" r="142" />
      <circle className="set" cx="260" cy="318" r="142" />
      <g className="venn-fade" fontWeight="700" fontSize="19">
        <text x="140" y="150" textAnchor="middle">{v.business}</text>
        <text x="380" y="150" textAnchor="middle">{v.science}</text>
        <text x="260" y="408" textAnchor="middle">{v.tech}</text>
      </g>
      <g className="venn-fade venn-muted" fontSize="12" textAnchor="middle">
        <text x="260" y="128">1</text>
        <text x="330" y="300">2</text>
        <text x="190" y="300">3</text>
      </g>
      <circle className="core venn-fade" cx="260" cy="242" r="6" />
      <text className="venn-fade" x="260" y="272" textAnchor="middle" fontWeight="700" fontSize="15">
        Diego
      </text>
    </svg>
  );
}

export function Experience({ t }: { t: Dictionary }) {
  const ids = sectionIds(t.lang);
  const e = t.experience;
  return (
    <section id={ids.experience} aria-labelledby="exp-title" data-route className="py-20 md:py-24">
      <div className="wrap">
        <div className="grid gap-12 md:grid-cols-12 md:gap-10">
          <div className="md:col-span-6">
            <h2 id="exp-title" data-reveal className="text-section max-w-[18ch]">
              {e.title}
            </h2>
            <div className="mt-8 grid max-w-[62ch] gap-5">
              {e.paragraphs.map((p) => (
                <p key={p.slice(0, 24)}>{p}</p>
              ))}
              <p className="text-muted">{e.nameNote}</p>
            </div>
          </div>
          <div className="md:col-span-6">
            <Venn t={t} />
            <ol className="mt-8 grid gap-5">
              {e.venn.intersections.map((x, i) => (
                <li key={x.title} className="grid grid-cols-[1.5rem_1fr] gap-x-3">
                  <span aria-hidden="true" className="font-mono text-[0.8125rem] leading-7 text-muted">
                    {i + 1}
                  </span>
                  <div>
                    <h3 className="text-[1.0625rem] leading-7">{x.title}</h3>
                    <p className="mt-1 text-[0.9688rem] text-ink-2">{x.text}</p>
                  </div>
                </li>
              ))}
            </ol>
            <p className="mt-6 border-l-[1.5px] border-accent pl-4 text-[0.9688rem]">{e.venn.summary}</p>
          </div>
        </div>

        <div className="mt-20 grid gap-10 md:grid-cols-12 md:gap-10">
          <div className="md:col-span-4">
            <h3 className="text-[1.375rem] tracking-[-0.015em]">{e.jobsTitle}</h3>
            <h4 className="label-mono mt-8">{e.industriesLabel}</h4>
            <ul className="mt-3 grid gap-1.5 text-[0.9688rem]">
              {e.industries.map((i) => (
                <li key={i}>{i}</li>
              ))}
            </ul>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2">
              {site.cvUrl && (
                <a href={site.cvUrl} download onClick={() => track("cv_download")} className="link inline-flex min-h-11 items-center font-semibold">
                  {e.cv}
                </a>
              )}
              <a
                href={site.linkedin}
                rel="noopener noreferrer me"
                target="_blank"
                onClick={() => track("linkedin_click")}
                className="link inline-flex min-h-11 items-center gap-1.5 font-semibold"
              >
                {e.linkedin}
                <svg aria-hidden="true" viewBox="0 0 16 16" className="size-3.5">
                  <path d="M6 3h7v7M13 3 4 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="sr-only">{t.lang === "es" ? "(se abre en una pestaña nueva)" : "(opens in a new tab)"}</span>
              </a>
            </div>
          </div>
          <ol className="md:col-span-8">
            {e.jobs.map((j) => (
              <li key={j.org} className="grid gap-1 border-t border-line py-5 sm:grid-cols-[minmax(0,15rem)_1fr] sm:gap-6">
                <div>
                  <p className="font-display font-semibold">{j.org}</p>
                  <p className="text-[0.9375rem] text-muted">{j.role}</p>
                </div>
                <p className="text-[0.9688rem] text-ink-2 sm:pt-0.5">{j.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
