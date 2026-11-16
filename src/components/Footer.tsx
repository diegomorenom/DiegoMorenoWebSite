import type { Dictionary } from "../content/types";
import { site } from "../content/site";
import { Wordmark } from "./Wordmark";

export function Footer({ t }: { t: Dictionary }) {
  return (
    <footer className="border-t border-line">
      <div className="wrap grid gap-8 py-12 md:grid-cols-12 md:items-end">
        <div className="md:col-span-6">
          <a href={site.routes.home[t.lang]} aria-label={t.a11y.home} className="inline-flex min-h-11 items-center text-ink">
            <Wordmark className="h-6 w-auto" />
          </a>
          <p className="mt-2 text-[0.9375rem] text-muted">
            {t.footer.tagline} · {t.footer.rights}
          </p>
        </div>
        <nav aria-label="Footer" className="md:col-span-6 md:justify-self-end">
          <ul className="flex flex-wrap gap-x-6 gap-y-1 text-[0.9375rem]">
            <li>
              <a className="link inline-flex min-h-11 items-center" href={site.linkedin} rel="noopener noreferrer me" target="_blank">
                {t.footer.linkedin}
              </a>
            </li>
            <li>
              <a className="link inline-flex min-h-11 items-center" href={site.routes.privacy[t.lang]}>
                {t.footer.privacy}
              </a>
            </li>
          </ul>
        </nav>
        <p className="text-[0.8125rem] leading-relaxed text-muted md:col-span-12">
          © {new Date().getFullYear()} Diego Moreno. {t.footer.artNote}
        </p>
      </div>
    </footer>
  );
}
