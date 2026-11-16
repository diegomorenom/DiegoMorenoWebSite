import type { Lang } from "./types";

export function sectionIds(lang: Lang) {
  return lang === "es"
    ? { top: "inicio", projects: "proyectos", capabilities: "capacidades", process: "forma-de-trabajo", experience: "experiencia", contact: "contacto" }
    : { top: "top", projects: "projects", capabilities: "capabilities", process: "how-i-work", experience: "experience", contact: "contact" };
}
