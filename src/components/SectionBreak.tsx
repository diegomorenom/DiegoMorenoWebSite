import { useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";
import { useGSAP } from "@gsap/react";
import { usePrefs } from "../lib/prefs";

gsap.registerPlugin(useGSAP, ScrollTrigger, MotionPathPlugin);

/**
 * Cambio de sección: curvas de nivel como las de la base de la ilustración del hero.
 * Las líneas se trazan con el scroll y un pulso cobre las recorre una vez, continuando el sendero de la entrada.
 * Delimita las secciones sin bloques de color. Decorativo (aria-hidden).
 */
function wave(base: number, amp: number, freq: number, phase: number) {
  const pts: string[] = [];
  for (let x = 0; x <= 1440; x += 24) pts.push(`${x},${(base + amp * Math.sin(x * freq + phase) + amp * 0.35 * Math.sin(x * freq * 2.3 + phase * 1.7)).toFixed(1)}`);
  return "M" + pts.join(" L");
}
const LINES = [wave(24, 9, 0.0042, 0.3), wave(44, 12, 0.0038, 1.1), wave(62, 14, 0.0034, 2.0), wave(80, 12, 0.004, 2.8), wave(98, 9, 0.0046, 3.6)];
const TRAIL = 2;

export function SectionBreak() {
  const ref = useRef<HTMLDivElement>(null);
  const { ready, motionOn } = usePrefs();

  useGSAP(
    () => {
      if (!ready || !motionOn || !ref.current) return;
      const el = ref.current;
      const lines = el.querySelectorAll<SVGPathElement>(".sb-line");
      const trail = el.querySelector<SVGPathElement>(".sb-trail");
      const pulse = el.querySelector<HTMLElement>(".sb-pulse");
      gsap.fromTo(
        [...lines, trail],
        { strokeDasharray: 1, strokeDashoffset: 1 },
        { strokeDashoffset: 0, ease: "none", stagger: 0.08, scrollTrigger: { trigger: el, start: "top 96%", end: "top 55%", scrub: 0.8 } },
      );
      if (pulse && trail) {
        gsap
          .timeline({ scrollTrigger: { trigger: el, start: "top 70%", once: true } })
          .set(pulse, { opacity: 0 })
          .to(pulse, { opacity: 0.95, duration: 0.4, ease: "sine.out" })
          .to(pulse, { motionPath: { path: trail, align: trail, alignOrigin: [0.5, 0.5] }, duration: 2.4, ease: "sine.inOut" }, 0)
          .to(pulse, { opacity: 0, duration: 0.5, ease: "sine.in" }, ">-0.5");
      }
    },
    { scope: ref, dependencies: [ready, motionOn] },
  );

  return (
    <div ref={ref} className="section-break" aria-hidden="true">
      <svg viewBox="0 0 1440 120" preserveAspectRatio="none" focusable="false">
        {LINES.map((d, i) => (
          <path key={i} className={`sb-line sb-line-${i + 1}`} d={d} pathLength={1} vectorEffect="non-scaling-stroke" />
        ))}
        <path className="sb-trail" d={LINES[TRAIL]} pathLength={1} vectorEffect="non-scaling-stroke" />
      </svg>
      <span className="sb-pulse" />
    </div>
  );
}
