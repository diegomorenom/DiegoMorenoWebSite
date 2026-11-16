export type Lang = "es" | "en";
export type Intent = "project" | "contractor" | "job";

export interface CaseStudy {
  id: string;
  title: string;
  sector: string;
  /** Una frase: lo que se lee sin desplegar. */
  short: string;
  /** Flujo de la solución en tres pasos (diagrama simplificado, no arquitectura). */
  flow: [string, string, string];
  summary: string;
  contributionLabel: string;
  contribution: string;
  /** Tecnologías publicables (sin cuentas, nombres de clientes ni arquitectura identificable). */
  stack: string[];
  /** Estado de entrega: solo se muestra cuando Diego lo valida (PoC, piloto, producción…). */
  status: string | null;
  detail: { label: string; text: string }[];
  contactPrompt: string;
  intent: Intent;
}

export interface Capability {
  id: string;
  title: string;
  text: string;
  tags: string[];
  /** Caso relacionado (id) para vincular capacidad con evidencia. */
  relatedCase: string | null;
  relatedLabel: string;
}

export interface Dictionary {
  lang: Lang;
  locale: string;
  meta: {
    title: string;
    description: string;
    ogTitle: string;
    ogDescription: string;
    privacyTitle: string;
    privacyDescription: string;
    notFoundTitle: string;
  };
  a11y: {
    skip: string;
    nav: string;
    menuOpen: string;
    menuClose: string;
    home: string;
    prefs: string;
    langLabel: string;
    sceneNote: string;
  };
  nav: { projects: string; capabilities: string; experience: string; cta: string };
  prefs: {
    theme: string;
    system: string;
    light: string;
    dark: string;
    motion: string;
    on: string;
    off: string;
    reducedNote: string;
    language: string;
    noStorage: string;
  };
  hero: {
    name: string;
    title: string;
    support: string;
    cta: string;
    ctaSupport: string;
    secondary: string;
    areasLabel: string;
    areas: string[];
    /** Etiquetas de la constelación durante la entrada: del problema a la solución en producción. */
    journey: [string, string, string, string];
  };
  projects: {
    title: string;
    intro: string;
    open: string;
    close: string;
    flowLabel: string;
    afterCta: string;
    moreButton: string;
    moreClose: string;
    moreTitle: string;
    moreIntro: string;
    inventory: { title: string; sector: string; text: string; stack: string[]; status: string | null }[];
    cases: CaseStudy[];
  };
  capabilities: {
    title: string;
    items: Capability[];
    cloud: {
      title: string;
      lead: string;
      platforms: { id: "aws" | "azure" | "databricks"; name: string; role: string; services: string[] }[];
      note: string;
    };
  };
  process: {
    title: string;
    steps: { title: string; text: string }[];
    imageAlt: string;
  };
  experience: {
    title: string;
    paragraphs: string[];
    nameNote: string;
    venn: {
      label: string;
      business: string;
      science: string;
      tech: string;
      center: string;
      creativity: string;
      intersections: { title: string; text: string }[];
      summary: string;
    };
    industriesLabel: string;
    industries: string[];
    jobsTitle: string;
    jobs: { org: string; role: string; text: string }[];
    cv: string;
    linkedin: string;
  };
  contact: {
    title: string;
    intro: string;
    intentLegend: string;
    intents: Record<Intent, string>;
    intentHelp: Record<Intent, string>;
    name: string;
    email: string;
    company: string;
    optional: string;
    message: string;
    messageHelp: string;
    originLabel: string;
    submit: string;
    sending: string;
    privacy: string;
    privacyLink: string;
    privacyExtra: string;
    success: string;
    nextStep: string;
    error: string;
    errorRate: string;
    errorConfig: string;
    vName: string;
    vEmail: string;
    vMessage: string;
    vIntent: string;
    vCaptcha: string;
    honeypot: string;
  };
  footer: { tagline: string; linkedin: string; privacy: string; rights: string; artNote: string };
  mobileCta: string;
  privacy: { title: string; updated: string; sections: { heading: string; body: string[] }[]; back: string };
  notFound: { title: string; text: string; back: string };
}
