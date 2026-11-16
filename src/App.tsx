import { useRef } from "react";
import type { Lang } from "./content/types";
import { dictionaries, type Page } from "./content/site";
import { PrefsProvider } from "./lib/prefs";
import { Header } from "./components/Header";
import { Hero } from "./components/Hero";
import { Projects } from "./components/Projects";
import { Capabilities } from "./components/Capabilities";
import { Process } from "./components/Process";
import { Experience } from "./components/Experience";
import { Contact } from "./components/Contact";
import { Footer } from "./components/Footer";
import { MobileCta } from "./components/MobileCta";
import { Route } from "./components/Route";
import { SectionBreak } from "./components/SectionBreak";
import { useHeadingReveal, useScrollRefresh } from "./lib/useHeadingReveal";
import { Privacy } from "./pages/Privacy";
import { NotFound } from "./pages/NotFound";

export function App({ lang, page }: { lang: Lang; page: Page }) {
  return (
    <PrefsProvider>
      <Shell lang={lang} page={page} />
    </PrefsProvider>
  );
}

function Shell({ lang, page }: { lang: Lang; page: Page }) {
  const t = dictionaries[lang];
  const routeRef = useRef<HTMLDivElement>(null);
  useHeadingReveal(routeRef);
  useScrollRefresh();
  return (
    <>
      <a href="#main" className="sr-only z-50 rounded-md bg-action px-4 py-3 font-semibold text-action-ink focus:not-sr-only focus:fixed focus:left-4 focus:top-4">
        {t.a11y.skip}
      </a>
      <Header t={t} page={page} />
      <main id="main" tabIndex={-1} className="relative outline-none">
        {page === "home" && (
          <>
            <Hero t={t} />
            <div ref={routeRef} className="relative">
              <Projects t={t} />
              <SectionBreak />
              <Capabilities t={t} />
              <SectionBreak />
              <Process t={t} />
              <SectionBreak />
              <Experience t={t} />
              <SectionBreak />
              <Contact t={t} />
              <Route mainRef={routeRef} sectionSelector="[data-route]" />
            </div>
          </>
        )}
        {page === "privacy" && <Privacy t={t} />}
        {page === "404" && <NotFound t={t} />}
      </main>
      <Footer t={t} />
      {page === "home" && <MobileCta t={t} />}
    </>
  );
}
