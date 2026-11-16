import { useEffect, useRef, useState, type RefObject } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { usePrefs } from "../lib/prefs";

gsap.registerPlugin(ScrollTrigger);

interface Geometry {
  h: number;
  d: string;
  points: { y: number; x: number }[];
}

/**
 * Sendero de la página: un trazo en el margen que conecta las secciones como una ruta en un mapa de campo.
 * Se revela con el progreso nativo del scroll (sin capturar rueda ni gestos). Cada hito emite un pulso, una sola vez.
 * Decorativo: aria-hidden, sin eventos de puntero. Con la animación desactivada se muestra completo y estático.
 */
export function Route({ mainRef, sectionSelector }: { mainRef: RefObject<HTMLDivElement | null>; sectionSelector: string }) {
  const { ready, motionOn } = usePrefs();
  const [geo, setGeo] = useState<Geometry | null>(null);
  const liveRef = useRef<SVGPathElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Geometría a partir de la posición real de cada sección
  useEffect(() => {
    const main = mainRef.current;
    if (!main) return;
    const measure = () => {
      const h = main.offsetHeight;
      const secs = Array.from(main.querySelectorAll<HTMLElement>(sectionSelector));
      const points = secs.map((s, i) => ({ y: Math.round(s.offsetTop + parseFloat(getComputedStyle(s).paddingTop) + 16), x: i % 2 === 0 ? 8 : 16 }));
      let d = `M12,0`;
      let prev = { x: 12, y: 0 };
      for (const p of [...points, { x: 12, y: h }]) {
        const dy = p.y - prev.y;
        const bend = (prev.x === 8 ? 1 : -1) * 9;
        d += ` C${prev.x + bend},${prev.y + dy * 0.35} ${p.x - bend},${prev.y + dy * 0.65} ${p.x},${p.y}`;
        prev = p;
      }
      setGeo({ h, d, points });
    };
    measure();
    const ro = new ResizeObserver(() => measure());
    ro.observe(main);
    return () => ro.disconnect();
  }, [mainRef, sectionSelector]);

  // Revelado ligado al scroll + pulsos únicos en los hitos
  useEffect(() => {
    const live = liveRef.current;
    const main = mainRef.current;
    if (!geo || !live || !main || !ready) return;
    const len = live.getTotalLength();
    live.style.strokeDasharray = `${len}`;
    if (!motionOn) {
      live.style.strokeDashoffset = "0";
      return;
    }
    live.style.strokeDashoffset = `${len}`;
    const fired = new Set<number>();
    const rings = Array.from(svgRef.current?.querySelectorAll<SVGCircleElement>(".ring") ?? []);
    let active = 0;
    const st = ScrollTrigger.create({
      trigger: main,
      start: "top 65%",
      end: "bottom 85%",
      scrub: 0.4,
      onUpdate: (self) => {
        live.style.strokeDashoffset = `${len * (1 - self.progress)}`;
        const reachedY = self.progress * geo.h;
        geo.points.forEach((p, i) => {
          if (reachedY >= p.y && !fired.has(i) && active < 2) {
            fired.add(i);
            const ring = rings[i];
            if (!ring) return;
            active++;
            gsap.fromTo(
              ring,
              { attr: { r: 5 }, opacity: 0.55 },
              { attr: { r: 15 }, opacity: 0, duration: 1, ease: "power2.out", onComplete: () => void active-- },
            );
          }
        });
      },
    });
    return () => st.kill();
  }, [geo, ready, motionOn, mainRef]);

  if (!geo) return null;
  return (
    <div className="route" aria-hidden="true">
      <svg ref={svgRef} viewBox={`0 0 24 ${geo.h}`} preserveAspectRatio="none" focusable="false">
        <path d={geo.d} fill="none" className="route-base" strokeWidth="1.25" strokeDasharray="1 6" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        <path ref={liveRef} d={geo.d} fill="none" className="route-live" strokeWidth="1.5" strokeLinecap="round" />
        {geo.points.map((p, i) => (
          <g key={i}>
            <circle className="ring" cx={p.x} cy={p.y} r="5" />
            <circle className="waypoint" cx={p.x} cy={p.y} r="4.5" strokeWidth="1.5" />
          </g>
        ))}
      </svg>
    </div>
  );
}
