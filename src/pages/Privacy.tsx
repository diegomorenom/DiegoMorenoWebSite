import type { Dictionary } from "../content/types";
import { site } from "../content/site";

export function Privacy({ t }: { t: Dictionary }) {
  return (
    <article className="wrap max-w-[48rem] py-16 md:py-24">
      <h1 className="text-section">{t.privacy.title}</h1>
      <p className="label-mono mt-4">{t.privacy.updated}</p>
      <div className="mt-10 grid gap-10">
        {t.privacy.sections.map((s) => (
          <section key={s.heading} aria-labelledby={`pv-${s.heading}`}>
            <h2 id={`pv-${s.heading}`} className="text-[1.375rem]">
              {s.heading}
            </h2>
            {s.body.map((b) => (
              <p key={b.slice(0, 20)} className="mt-3 max-w-[65ch] text-muted">
                {b}
              </p>
            ))}
          </section>
        ))}
      </div>
      <a href={site.routes.home[t.lang]} className="link mt-12 inline-flex min-h-11 items-center font-semibold">
        {t.privacy.back}
      </a>
    </article>
  );
}
