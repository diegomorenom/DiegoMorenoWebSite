import type { Dictionary } from "../content/types";
import { site } from "../content/site";

export function NotFound({ t }: { t: Dictionary }) {
  return (
    <section className="wrap grid min-h-[60vh] content-center py-20">
      <p className="label-mono">404</p>
      <h1 className="mt-3 max-w-[20ch] text-display">{t.notFound.title}</h1>
      <p className="mt-5 max-w-[48ch] text-lead text-muted">{t.notFound.text}</p>
      <a href={site.routes.home[t.lang]} className="btn btn-primary mt-8 justify-self-start">
        {t.notFound.back}
      </a>
    </section>
  );
}
