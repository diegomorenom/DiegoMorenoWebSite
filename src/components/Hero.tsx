import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";
import type { Dictionary } from "../content/types";
import { sectionIds } from "../content/ids";
import { usePrefs } from "../lib/prefs";

gsap.registerPlugin(useGSAP, MotionPathPlugin, SplitText);

/* Coordenadas medidas sobre los PNG 19 / 19L (1536×1024): la animación se registra sobre la ruta dibujada. */
const MAIN_ROUTE =
  "M422,700 C432,640 470,590 550,565 S700,525 748,492 C800,470 880,430 935,371 C980,345 1040,335 1100,335 S1210,320 1248,263 C1300,225 1360,170 1388,97";
/* El sendero cobre sobre las rocas hasta el caminante, y desde su mano la misma ruta hacia la estrella */
const JOURNEY =
  "M1040,945 C980,950 900,955 840,960 C780,962 750,920 700,905 C640,888 560,885 500,866 C450,850 400,842 370,834 C345,820 360,800 395,790 C415,782 428,770 428,760 L422,700 " +
  MAIN_ROUTE.slice(MAIN_ROUTE.indexOf("C"));
const GLOWS = [
  { x: 748, y: 492, r: 16 },
  { x: 935, y: 371, r: 16 },
  { x: 1248, y: 263, r: 14 },
  { x: 1388, y: 97, r: 26 },
];
const HAND = { x: 422, y: 700 };

/** Fracción (0–1) del trazado más cercana a un punto: para detener el pulso exactamente en cada nodo. */
function fractionAt(path: SVGPathElement, x: number, y: number) {
  const len = path.getTotalLength();
  let best = 0;
  let bestD = Infinity;
  for (let i = 0; i <= 600; i++) {
    const pt = path.getPointAtLength((len * i) / 600);
    const d = (pt.x - x) ** 2 + (pt.y - y) ** 2;
    if (d < bestD) {
      bestD = d;
      best = i / 600;
    }
  }
  return best;
}

export function Hero({ t }: { t: Dictionary }) {
  const ids = sectionIds(t.lang);
  const root = useRef<HTMLElement>(null);
  const sceneRef = useRef<SVGSVGElement>(null);
  const { ready, motionOn } = usePrefs();

  /*
   * Entrada del sitio, una vez por sesión:
   * 1. El paisaje ocupa la pantalla y se acerca muy despacio.
   * 2. Un pulso recorre el sendero de las rocas hasta el caminante (el recorrido) y sigue por la constelación;
   *    cada estrella se enciende con su palabra: problema de negocio → estrategia → valor agregado → solución en producción.
   * 3. Las palabras se apagan, la imagen se congela y baja a su lugar mientras aparece el texto.
   * Cualquier scroll, toque o tecla acelera la secuencia hasta el final. Visitas siguientes: entrada corta.
   */
  useGSAP(
    () => {
      if (!ready) return;
      const html = document.documentElement;
      if (!motionOn) {
        html.classList.remove("intro-pending");
        return;
      }
      const q = gsap.utils.selector(root);
      const header = document.querySelector<HTMLElement>("body > div header, header");
      const title = root.current?.querySelector<HTMLElement>("[data-split]");
      const split = title ? SplitText.create(title, { type: "lines", mask: "lines", linesClass: "reveal-line", aria: "auto" }) : null;
      const art = root.current?.querySelector<HTMLElement>(".hero-art");
      const scene = sceneRef.current;
      const journey = scene?.querySelector<SVGPathElement>("#hero-journey");
      const pulse = scene?.querySelector<SVGGElement>(".pulse");
      const labels = q(".hero-label-chip");
      const glows = q(".scene .glow");

      const textIn = (tl: gsap.core.Timeline, at: number) =>
        tl
          .set("[data-intro]", { opacity: 1 }, at)
          .from("[data-intro='name']", { y: 12, opacity: 0, duration: 1.1, ease: "power3.out" }, at)
          .from(split ? split.lines : [], { yPercent: 105, duration: 1.5, ease: "power4.out", stagger: 0.14 }, at + 0.15)
          .from("[data-intro='rest']", { y: 16, opacity: 0, duration: 1.2, ease: "power3.out", stagger: 0.12 }, at + 0.75);

      const full = window.scrollY < 40 && !location.hash && !!art && !!journey && !!pulse && !sessionStorageFlag("hero-intro");

      if (!full || !art || !journey || !pulse) {
        // Entrada corta (visitas siguientes o si se entra a mitad de página)
        const tl = gsap.timeline();
        if (art) tl.fromTo(art, { clipPath: "inset(100% 0% 0% 0%)", scale: 1.05 }, { clipPath: "inset(0% 0% 0% 0%)", scale: 1, duration: 2, ease: "power3.inOut", clearProps: "clipPath,transform" }, 0);
        textIn(tl, 0.15);
        html.classList.remove("intro-pending");
        return;
      }

      // Geometría FLIP: de pantalla completa a su posición final en la composición
      const r = art.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const wide = vw >= 1024;
      // Ver la ilustración completa (de la estrella a las montañas) en cualquier pantalla: ajuste por altura en
      // pantallas anchas y bajas (p. ej. portátiles 1366×768 o 1536×864); los bordes laterales se funden con el fondo.
      // Teléfonos y tabletas en vertical: la imagen llena la altura de la pantalla y la cámara sigue el recorrido.
      const portrait = !wide && vw / vh < 1.2;
      const s = wide ? Math.min(vw / r.width, (vh * 0.98) / r.height) : portrait ? vh / r.height : 1;
      const fadeTop = getComputedStyle(art).getPropertyValue("--fade-top").trim() || "22%";
      const dx = vw / 2 - (r.left + r.width / 2);
      const dy = vh / 2 - (r.top + r.height / 2);
      // Cámara (solo vertical): desplazamiento horizontal que centra un punto x del dibujo (0–1536), sin dejar bordes vacíos.
      const crop = Math.max(0, (1 - r.width / r.height / 1.5) / 2); // recorte lateral de "cover" en el contenedor
      const maxPan = Math.max(0, (r.width * s - vw) / 2);
      const camX = (px: number) => {
        const fc = (px / 1536 - crop) / (1 - 2 * crop);
        // el pulso queda un poco a la derecha del centro: las palabras (a su izquierda) caben completas
        return dx + gsap.utils.clamp(-maxPan, maxPan, -(fc - 0.5) * r.width * s + vw * 0.16);
      };

      const fr = [fractionAt(journey, HAND.x, HAND.y), ...GLOWS.map((g) => fractionAt(journey, g.x, g.y))];
      const tl = gsap.timeline({ defaults: { ease: "power2.inOut" } });

      tl.set([header, "[data-intro]"], { opacity: 0 })
        .set(art, { x: portrait ? camX(1040) : dx, y: dy, scale: s * 1.05, "--ls": portrait ? s : 1, opacity: 0, clipPath: "inset(0% 0% 0% 0%)", transformOrigin: "50% 50%", zIndex: 20, "--fade-top": "3%", "--fade-x": wide ? "7%" : "0%" })
        .set(labels, { opacity: 0, y: 6 })
        .set(pulse, { opacity: 0 });
      html.classList.remove("intro-pending");
      scene?.classList.add("scene-intro");

      // 1. El paisaje aparece y se acerca lentamente
      tl.to(art, { opacity: 1, duration: 1.8, ease: "sine.out" }, 0)
        .to(art, { scale: s, duration: 8.5, ease: "sine.out" }, 0);

      // 2. El recorrido: rocas → caminante → constelación
      tl.fromTo(pulse, { opacity: 0 }, { opacity: 1, duration: 0.8, ease: "sine.out" }, 1.3)
        .to(pulse, { motionPath: { path: journey, align: journey, alignOrigin: [0.5, 0.5], start: 0, end: fr[0] }, duration: 2.6, ease: "sine.inOut" }, 1.3);
      let at = 3.9;
      const seg = [1.1, 0.95, 0.95, 0.95];
      for (let i = 0; i < 4; i++) {
        tl.to(pulse, { motionPath: { path: journey, align: journey, alignOrigin: [0.5, 0.5], start: fr[i], end: fr[i + 1] }, duration: seg[i], ease: "sine.inOut" }, at);
        at += seg[i];
        tl.fromTo(glows[i], { attr: { r: GLOWS[i].r }, opacity: 0.2 }, { attr: { r: GLOWS[i].r * (i === 3 ? 1.4 : 2) }, opacity: i === 3 ? 0.4 : 0.5, duration: 0.6, ease: "sine.inOut", yoyo: true, repeat: 1 }, at - 0.15)
          .to(labels[i] ?? [], { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" }, at - 0.15);
      }
      // 3. Pausa, se apagan las palabras y la imagen baja a su lugar
      const settle = at + 1.1;
      // Cámara en vertical: sigue al pulso con suavidad hasta la pausa final
      if (portrait) {
        const follow = gsap.quickTo(art, "x", { duration: 1.1, ease: "power2.out" });
        tl.eventCallback("onUpdate", () => {
          if (tl.time() < 1.3 || tl.time() > settle) return;
          follow(camX(Number(gsap.getProperty(pulse, "x")) || 1040));
        });
      }
      tl.to(labels, { opacity: 0, y: -4, duration: 0.8, ease: "sine.inOut", stagger: 0.08 }, settle)
        .to(pulse, { opacity: 0, duration: 0.8, ease: "sine.inOut" }, settle)
        .to(art, { x: 0, y: 0, scale: 1, "--fade-top": fadeTop, "--fade-x": "0%", duration: 2.4, ease: "power3.inOut", overwrite: "auto", clearProps: "transform,opacity,clipPath,zIndex,transformOrigin,--fade-top,--fade-x,--ls" }, settle + 0.4)
        .to(header, { opacity: 1, duration: 1, ease: "sine.out", clearProps: "opacity" }, settle + 1.8);
      textIn(tl, settle + 1.6);

      // Saltar: cualquier intención del visitante acelera hasta el final
      const skip = () => {
        if (tl.progress() < 1) gsap.to(tl, { timeScale: 5, duration: 0.6, ease: "sine.in" });
        off();
      };
      const evs: (keyof WindowEventMap)[] = ["wheel", "touchstart", "keydown", "pointerdown"];
      const off = () => evs.forEach((e) => window.removeEventListener(e, skip));
      evs.forEach((e) => window.addEventListener(e, skip, { passive: true, once: true }));
      tl.eventCallback("onComplete", () => {
        off();
        gsap.set(glows, { clearProps: "opacity" });
        glows.forEach((g, i) => g.setAttribute("r", String(GLOWS[i]?.r ?? 16)));
        scene?.classList.remove("scene-intro");
      });
      return off;
    },
    { scope: root, dependencies: [ready, motionOn] },
  );

  // Pausa la respiración de las estrellas fuera de pantalla.
  useEffect(() => {
    const el = sceneRef.current;
    if (!el || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(([e]) => el.classList.toggle("scene-paused", !e.isIntersecting), { rootMargin: "100px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section ref={root} id={ids.top} aria-labelledby="hero-title" className="relative overflow-x-clip">
      <div className="wrap relative z-10 pt-10 sm:pt-14 lg:pt-20">
        <div className="max-w-[36rem] xl:max-w-[38rem]">
          <h1 id="hero-title" className="text-ink">
            <span data-intro="name" className="block font-display text-[clamp(1.25rem,1.1rem+0.5vw,1.5rem)] font-semibold tracking-[-0.015em]">
              {t.hero.name}
              <span aria-hidden="true" className="ml-[0.1em] inline-block size-[0.28em] rounded-full bg-accent" />
              <span className="sr-only">: </span>
            </span>
            <span data-intro="title" data-split className="mt-3 block text-display font-bold">
              {t.hero.title}
            </span>
          </h1>
          <p data-intro="rest" className="mt-6 max-w-[34rem] text-lead text-ink-2">
            {t.hero.support}
          </p>
          <div data-intro="rest" className="mt-8 flex flex-wrap items-center gap-3">
            <a href={`#${ids.contact}`} className="btn btn-primary" data-cta="hero">
              {t.hero.cta}
              <svg aria-hidden="true" viewBox="0 0 20 20" className="btn-arrow size-[18px]">
                <path d="M4 10h11M11 5.5 15.5 10 11 14.5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
            <a href={`#${ids.projects}`} className="btn btn-secondary">
              {t.hero.secondary}
            </a>
          </div>
          <p data-intro="rest" className="mt-4 max-w-[30rem] text-[0.9375rem] leading-relaxed text-ink-2">
            {t.hero.ctaSupport}
          </p>
          <div data-intro="rest" className="mt-9">
            <h2 className="sr-only">{t.hero.areasLabel}</h2>
            <ul className="flex flex-wrap gap-x-6 gap-y-2 font-mono text-[0.8125rem] text-muted">
              {t.hero.areas.map((a) => (
                <li key={a} className="flex items-center gap-2.5">
                  <span aria-hidden="true" className="size-1 rounded-full bg-accent" />
                  {a}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Arte emparejado: se elige por data-effective-theme vía CSS (una sola descarga). Decorativo. */}
      <div className="relative mt-10 sm:mt-14 lg:mt-[-25.5vw] lg:max-[1100px]:mt-[-21vw]">
        <div className="hero-art" role="presentation">
          <svg ref={sceneRef} className="scene" viewBox="0 0 1536 1024" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
            <path id="hero-journey" d={JOURNEY} fill="none" stroke="none" />
            {GLOWS.map((g, i) => (
              <circle key={`${g.x}-${g.y}`} className={`glow glow-${i + 1}`} cx={g.x} cy={g.y} r={g.r} />
            ))}
            <g className="pulse">
              <circle className="pulse-halo" r="22" cx="0" cy="0" />
              <circle className="pulse-core" r="7" cx="0" cy="0" />
            </g>
          </svg>
          <div className="hero-labels" aria-hidden="true">
            {t.hero.journey.map((w, i) => (
              <span key={w} className={`hero-label hero-label-${i + 1}`}>
                <span className="hero-label-chip">{w}</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function sessionStorageFlag(key: string): boolean {
  try {
    const k = `dm-${key}`;
    if (window.sessionStorage.getItem(k)) return true;
    window.sessionStorage.setItem(k, "1");
    return false;
  } catch {
    return false;
  }
}
