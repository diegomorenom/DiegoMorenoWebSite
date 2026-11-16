import { useEffect, useState } from "react";
import type { Dictionary } from "../content/types";
import { sectionIds } from "../content/ids";

/** Barra discreta en móvil: aparece cuando el CTA del hero sale de pantalla y desaparece al llegar al formulario. */
export function MobileCta({ t }: { t: Dictionary }) {
  const ids = sectionIds(t.lang);
  const [show, setShow] = useState(false);
  useEffect(() => {
    const hero = document.querySelector('[data-cta="hero"]');
    const contact = document.getElementById(ids.contact);
    if (!hero || !contact || !("IntersectionObserver" in window)) return;
    let heroVisible = true;
    let contactVisible = false;
    const sync = () => setShow(!heroVisible && !contactVisible);
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.target === hero) heroVisible = e.isIntersecting || e.boundingClientRect.top > 0;
        if (e.target === contact) contactVisible = e.isIntersecting;
      }
      sync();
    });
    io.observe(hero);
    io.observe(contact);
    return () => io.disconnect();
  }, [ids.contact]);

  return (
    <div
      className={`mobile-cta fixed inset-x-0 bottom-0 z-30 border-t border-line bg-bg px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] transition-[translate,opacity] duration-300 ease-[var(--ease-out)] md:hidden ${
        show ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-full opacity-0"
      }`}
      inert={!show}
    >
      <a href={`#${ids.contact}`} className="btn btn-primary w-full">
        {t.mobileCta}
      </a>
    </div>
  );
}
