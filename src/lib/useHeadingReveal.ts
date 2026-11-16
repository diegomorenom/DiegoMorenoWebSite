import type { RefObject } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";
import { usePrefs } from "./prefs";

gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText);

/**
 * Transición entre secciones: cada titular [data-reveal] emerge línea a línea desde una máscara
 * cuando entra en pantalla (una sola vez). Mismo gesto que el titular del hero, para que el sitio tenga un único idioma de movimiento.
 */
/** Recalcula las posiciones de ScrollTrigger cuando cambia el alto de la página (entrada, fuentes, desplegables). */
export function useScrollRefresh() {
  useGSAP(() => {
    let t = 0;
    const refresh = () => {
      window.clearTimeout(t);
      t = window.setTimeout(() => ScrollTrigger.refresh(), 150);
    };
    const ro = new ResizeObserver(refresh);
    ro.observe(document.body);
    document.fonts?.ready.then(refresh).catch(() => undefined);
    window.addEventListener("load", refresh);
    return () => {
      ro.disconnect();
      window.removeEventListener("load", refresh);
      window.clearTimeout(t);
    };
  });
}

export function useHeadingReveal(scope: RefObject<HTMLElement | null>) {
  const { ready, motionOn } = usePrefs();
  useGSAP(
    () => {
      if (!ready || !motionOn || !scope.current) return;
      scope.current.querySelectorAll<HTMLElement>("[data-reveal]").forEach((el) => {
        const split = SplitText.create(el, { type: "lines", mask: "lines", linesClass: "reveal-line", aria: "auto" });
        gsap.from(split.lines, {
          yPercent: 105,
          duration: 0.9,
          ease: "expo.out",
          stagger: 0.08,
          scrollTrigger: { trigger: el, start: "top 88%", once: true },
        });
      });
    },
    { scope, dependencies: [ready, motionOn] },
  );
}
