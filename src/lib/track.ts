// Eventos de medición sin datos personales (sección 10). Si no hay herramienta de analítica, no hace nada.
type EventName = "case_view" | "cv_download" | "contact_start" | "contact_success" | "linkedin_click";

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
  }
}

export function track(event: EventName, params: Record<string, string> = {}) {
  try {
    if (Array.isArray(window.dataLayer)) window.dataLayer.push({ event, ...params });
  } catch {
    /* no-op */
  }
}
