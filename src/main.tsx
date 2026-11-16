import { StrictMode } from "react";
import { hydrateRoot, createRoot } from "react-dom/client";
import "./fonts";
import "./styles.css";
import { App } from "./App";
import type { Lang } from "./content/types";
import type { Page } from "./content/site";

const html = document.documentElement;
const lang: Lang = html.lang.startsWith("en") ? "en" : "es";
const page = (html.dataset.page as Page) || "home";
const root = document.getElementById("root")!;
const tree = (
  <StrictMode>
    <App lang={lang} page={page} />
  </StrictMode>
);

if (root.hasChildNodes()) hydrateRoot(root, tree);
else createRoot(root).render(tree); // modo desarrollo (sin prerender)
