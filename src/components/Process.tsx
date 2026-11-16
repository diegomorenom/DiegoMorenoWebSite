import type { Dictionary } from "../content/types";
import { sectionIds } from "../content/ids";

export function Process({ t }: { t: Dictionary }) {
  const ids = sectionIds(t.lang);
  return (
    <section id={ids.process} aria-labelledby="process-title" data-route className="py-20 md:py-24">
      <div className="wrap grid items-center gap-12 md:grid-cols-12 md:gap-10">
        <div className="md:order-2 md:col-span-7 lg:col-span-6 lg:col-start-7">
          <h2 id="process-title" data-reveal className="text-section">
            {t.process.title}
          </h2>
          <ol className="relative mt-10 grid gap-8 before:absolute before:bottom-3 before:left-[7px] before:top-3 before:w-px before:bg-line">
            {t.process.steps.map((s, i) => (
              <li key={s.title} className="relative grid grid-cols-[16px_1fr] gap-x-5">
                <span
                  aria-hidden="true"
                  className={`relative z-[1] mt-[0.45rem] size-[15px] rounded-full border-[1.5px] border-accent ${i === t.process.steps.length - 1 ? "bg-accent" : "bg-bg"}`}
                />
                <div>
                  <h3 className="text-[1.1875rem] leading-snug">{s.title}</h3>
                  <p className="mt-1.5 max-w-[46ch] text-ink-2">{s.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
        {/* Ilustración 22 «La arquitectura del criterio», sin fondo y con variante oscura propia. Decorativa. */}
        <div className="md:order-1 md:col-span-5 lg:col-span-6" aria-hidden="true">
          <div className="criterio">
            <div className="criterio-light">
              <span className="criterio-ink" />
              <span className="criterio-cu" />
            </div>
            <div className="criterio-dark" />
          </div>
        </div>
      </div>
    </section>
  );
}
