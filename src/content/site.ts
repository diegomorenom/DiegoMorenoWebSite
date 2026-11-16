import type { Lang } from "./types";
import { es } from "./es";
import { en } from "./en";

export const dictionaries = { es, en } as const;

export const site = {
  /** Se sobrescribe en build con SITE_URL. */
  url: "https://diego-moreno.pages.dev",
  linkedin: "https://www.linkedin.com/in/diegomorenom/",
  /** Ruta del CV en /public. null = el enlace no se muestra (regla: no mostrar recursos inexistentes). */
  cvUrl: null as string | null,
  /**
   * Logos oficiales (versión monocroma del kit de marca de cada proveedor) en /public/logos/aws.svg, azure.svg, databricks.svg.
   * false = se muestra el nombre en texto. true = se muestra el logo teñido con el color de texto del tema.
   */
  cloudLogos: { aws: false, azure: false, databricks: false } as Record<"aws" | "azure" | "databricks", boolean>,
  routes: {
    home: { es: "/", en: "/en/" },
    privacy: { es: "/privacidad/", en: "/en/privacy/" },
  } satisfies Record<string, Record<Lang, string>>,
};

export type Page = "home" | "privacy" | "404";
