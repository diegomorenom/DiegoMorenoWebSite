import { StrictMode } from "react";
import { renderToString } from "react-dom/server";
import { App } from "./App";
import type { Lang } from "./content/types";
import { dictionaries, type Page } from "./content/site";

export function render(lang: Lang, page: Page) {
  return renderToString(
    <StrictMode>
      <App lang={lang} page={page} />
    </StrictMode>,
  );
}

export { dictionaries };
