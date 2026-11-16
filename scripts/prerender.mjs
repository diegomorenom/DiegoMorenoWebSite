// Prerender estático: HTML completo por idioma y página (SEO, sin depender de JS), metadatos, JSON-LD,
// sitemap, robots y cabeceras de seguridad para Cloudflare Pages / Netlify (_headers), Vercel y Apache (.htaccess).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");

// ── Configuración de build (variables públicas) ──
loadDotEnv(path.join(root, ".env"));
const SITE_URL = (process.env.SITE_URL || "https://diego-moreno.pages.dev").replace(/\/+$/, "");
const ALLOW_INDEXING = String(process.env.ALLOW_INDEXING || "false") === "true";
const TURNSTILE = Boolean(process.env.VITE_TURNSTILE_SITE_KEY);
const CONTACT_ORIGIN = safeOrigin(process.env.CONTACT_ORIGIN || process.env.VITE_CONTACT_ENDPOINT || "");
// Verificación de propiedad (valores públicos que entregan Search Console y Bing Webmaster Tools)
const GOOGLE_VERIFY = (process.env.GOOGLE_SITE_VERIFICATION || "").replace(/[^A-Za-z0-9_-]/g, "");
const BING_VERIFY = (process.env.BING_SITE_VERIFICATION || "").replace(/[^A-Za-z0-9_-]/g, "");
// Analítica sin cookies de Cloudflare Web Analytics (opcional): token público del beacon
const CF_BEACON = (process.env.CF_WEB_ANALYTICS_TOKEN || "").replace(/[^A-Za-z0-9]/g, "");
// Cloudflare inyecta el beacon de Web Analytics automáticamente (dominio en Cloudflare): solo se permite en la CSP.
const CF_AUTO = String(process.env.CF_WEB_ANALYTICS_AUTO || "false") === "true";
const CF_CSP = Boolean(CF_BEACON) || CF_AUTO;
const PROFILES = ["https://www.linkedin.com/in/diegomorenom/", ...(process.env.EXTRA_PROFILES || "").split(",").map((u) => u.trim()).filter((u) => /^https:\/\//.test(u))];

const { render, dictionaries } = await import(pathToFileURL(path.join(root, "dist-ssr", "entry-server.js")).href);
const template = fs.readFileSync(path.join(dist, "index.html"), "utf8");

const routes = {
  home: { es: "/", en: "/en/" },
  privacy: { es: "/privacidad/", en: "/en/privacy/" },
};

// ── CSP (una sola fuente de verdad para meta y cabeceras) ──
const turnstile = "https://challenges.cloudflare.com";
const csp = [
  "default-src 'self'",
  `script-src 'self'${TURNSTILE ? ` ${turnstile}` : ""}${CF_CSP ? " https://static.cloudflareinsights.com" : ""}`,
  "style-src 'self'",
  "img-src 'self'",
  "font-src 'self'",
  `connect-src 'self'${CONTACT_ORIGIN ? ` ${CONTACT_ORIGIN}` : ""}${TURNSTILE ? ` ${turnstile}` : ""}${CF_CSP ? " https://cloudflareinsights.com" : ""}`,
  `frame-src ${TURNSTILE ? turnstile : "'none'"}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "manifest-src 'self'",
  "worker-src 'none'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");
const cspMeta = csp.replace(/; frame-ancestors 'none'/, ""); // frame-ancestors no aplica en <meta>

const securityHeaders = {
  "Content-Security-Policy": csp,
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=(), interest-cohort=(), browsing-topics=()",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Resource-Policy": "same-site",
  "X-Permitted-Cross-Domain-Policies": "none",
  ...(ALLOW_INDEXING ? {} : { "X-Robots-Tag": "noindex, nofollow" }),
};

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const jsonLd = (obj) => JSON.stringify(obj).replace(/</g, "\\u003c");

function personLd(t) {
  return {
    "@type": "Person",
    "@id": `${SITE_URL}/#diego-moreno`,
    name: "Diego Moreno",
    alternateName: "Diego Esteban Moreno Morales",
    url: `${SITE_URL}/`,
    jobTitle: t.hero.title,
    description: t.meta.description,
    image: `${SITE_URL}/og/og-${t.lang}.jpg`,
    sameAs: PROFILES,
    alumniOf: { "@type": "CollegeOrUniversity", name: "Universidad Distrital Francisco José de Caldas" },
    workLocation: { "@type": "Place", address: { "@type": "PostalAddress", addressLocality: "Bogotá", addressRegion: "Bogotá D.C.", addressCountry: "CO" } },
    knowsAbout: [
      "Machine learning engineering",
      "Data science",
      "Demand forecasting",
      "Mathematical optimization",
      "Clustering",
      "Recommender systems",
      "Anomaly detection",
      "Supply chain analytics",
      "Retrieval-augmented generation",
      "AI agents",
      "Model Context Protocol",
      "Data platforms",
      "Amazon Web Services",
      "MLOps",
    ],
    hasOccupation: [
      { "@type": "Occupation", name: t.hero.title, skills: t.hero.areas.join(", ") },
      { "@type": "Occupation", name: t.lang === "es" ? "Arquitecto de soluciones de datos e IA" : "Data and AI Solutions Architect" },
    ],
    homeLocation: { "@type": "Place", address: { "@type": "PostalAddress", addressLocality: "Bogotá", addressCountry: "CO" } },
    knowsLanguage: ["es", "en", "fr"],
  };
}

function headFor(t, page) {
  const lang = t.lang;
  const other = lang === "es" ? "en" : "es";
  const isHome = page === "home";
  const is404 = page === "404";
  const pathFor = (l) => (page === "privacy" ? routes.privacy[l] : routes.home[l]);
  const url = `${SITE_URL}${pathFor(lang)}`;
  const title = isHome ? t.meta.title : page === "privacy" ? t.meta.privacyTitle : t.meta.notFoundTitle;
  const description = isHome ? t.meta.description : page === "privacy" ? t.meta.privacyDescription : t.notFound.text;
  const og = `${SITE_URL}/og/og-${lang}.jpg`;
  const robots = !ALLOW_INDEXING || is404 ? "noindex, nofollow" : "index, follow, max-image-preview:large";

  const tags = [
    `<title>${esc(title)}</title>`,
    `<meta name="description" content="${esc(description)}" />`,
    `<meta name="robots" content="${robots}" />`,
    `<meta http-equiv="Content-Security-Policy" content="${esc(cspMeta)}" />`,
    `<meta name="referrer" content="strict-origin-when-cross-origin" />`,
    `<meta name="color-scheme" content="light dark" />`,
    `<meta name="theme-color" content="#F3EFE6" />`,
    `<meta name="author" content="Diego Moreno" />`,
    `<meta name="creator" content="Diego Esteban Moreno Morales" />`,
    `<meta name="format-detection" content="telephone=no" />`,
    ...(GOOGLE_VERIFY ? [`<meta name="google-site-verification" content="${GOOGLE_VERIFY}" />`] : []),
    ...(BING_VERIFY ? [`<meta name="msvalidate.01" content="${BING_VERIFY}" />`] : []),
    ...PROFILES.map((u) => `<link rel="me" href="${esc(u)}" />`),
    `<link rel="author" href="${SITE_URL}${lang === "en" ? "/en/" : "/"}" />`,
    `<link rel="sitemap" type="application/xml" href="${SITE_URL}/sitemap.xml" />`,
  ];
  if (!is404) {
    tags.push(
      `<link rel="canonical" href="${url}" />`,
      `<link rel="alternate" hreflang="${lang}" href="${url}" />`,
      `<link rel="alternate" hreflang="${other}" href="${SITE_URL}${pathFor(other)}" />`,
      `<link rel="alternate" hreflang="x-default" href="${SITE_URL}${pathFor("es")}" />`,
      `<meta property="og:type" content="${isHome ? "profile" : "website"}" />`,
      `<meta property="og:site_name" content="Diego Moreno" />`,
      `<meta property="og:locale" content="${t.locale}" />`,
      `<meta property="og:locale:alternate" content="${dictionaries[other].locale}" />`,
      `<meta property="og:url" content="${url}" />`,
      `<meta property="og:title" content="${esc(isHome ? t.meta.ogTitle : title)}" />`,
      `<meta property="og:description" content="${esc(isHome ? t.meta.ogDescription : description)}" />`,
      `<meta property="og:image" content="${og}" />`,
      `<meta property="og:image:width" content="1200" />`,
      `<meta property="og:image:height" content="630" />`,
      `<meta property="og:image:alt" content="${esc(`Diego Moreno — ${t.hero.title}`)}" />`,
      `<meta property="og:image:type" content="image/jpeg" />`,
      `<meta property="og:image:secure_url" content="${og}" />`,
      `<meta name="twitter:card" content="summary_large_image" />`,
      `<meta name="twitter:title" content="${esc(isHome ? t.meta.ogTitle : title)}" />`,
      `<meta name="twitter:description" content="${esc(isHome ? t.meta.ogDescription : description)}" />`,
      `<meta name="twitter:image" content="${og}" />`,
      `<meta name="twitter:image:alt" content="${esc(`Diego Moreno — ${t.hero.title}`)}" />`,
      ...(process.env.TWITTER_HANDLE ? [`<meta name="twitter:creator" content="@${String(process.env.TWITTER_HANDLE).replace(/[^A-Za-z0-9_]/g, "")}" />`] : []),
    );
    if (isHome) {
      tags.push(`<meta property="profile:first_name" content="Diego" />`, `<meta property="profile:last_name" content="Moreno" />`);
    }
    const graph = [
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: `${SITE_URL}/`,
        name: "Diego Moreno",
        inLanguage: ["es", "en"],
        publisher: { "@id": `${SITE_URL}/#diego-moreno` },
      },
      {
        "@type": "WebPage",
        "@id": `${url}#webpage`,
        url,
        name: title,
        description,
        inLanguage: lang,
        isPartOf: { "@id": `${SITE_URL}/#website` },
        about: { "@id": `${SITE_URL}/#diego-moreno` },
        ...(isHome ? { mainEntity: { "@id": `${SITE_URL}/#diego-moreno` }, primaryImageOfPage: og } : {}),
      },
      personLd(t),
    ];
    tags.push(`<script type="application/ld+json">${jsonLd({ "@context": "https://schema.org", "@graph": graph })}</script>`);
  }
  return tags.join("\n    ");
}

function writePage(lang, page, outRel) {
  const t = dictionaries[lang];
  const appHtml = render(lang, page);
  let html = template
    .replace('<html lang="es" data-page="home">', `<html lang="${lang}" data-page="${page}">`)
    .replace("<!--head-meta-->", headFor(t, page))
    .replace("<!--app-html-->", appHtml);
  if (page !== "home") html = html.replace(/\s*<link rel="preload"[^>]*hero[^>]*>/g, "");
  if (CF_BEACON && !CF_AUTO) html = html.replace("</body>", `<script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon='{"token":"${CF_BEACON}"}'></script>\n  </body>`);
  const out = path.join(dist, outRel);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, html);
  console.log("✓", outRel);
}

writePage("es", "home", "index.html");
writePage("en", "home", "en/index.html");
writePage("es", "privacy", "privacidad/index.html");
writePage("en", "privacy", "en/privacy/index.html");
writePage("es", "404", "404.html");

// ── robots.txt ──
const robotsTxt = ALLOW_INDEXING
  ? `# Contenido público accesible para buscadores y búsqueda con IA (doc. maestro §9 y §12.9)
User-agent: *
Allow: /

User-agent: OAI-SearchBot
Allow: /

# GPTBot (entrenamiento) se decide por separado; por defecto se permite igual que el resto.

Sitemap: ${SITE_URL}/sitemap.xml
`
  : `# Entorno de revisión: no indexar hasta el lanzamiento autorizado (ALLOW_INDEXING=true)
User-agent: *
Disallow: /
`;
fs.writeFileSync(path.join(dist, "robots.txt"), robotsTxt);

// ── sitemap.xml con alternates hreflang ──
const today = new Date().toISOString().slice(0, 10);
const urlEntry = (key, lang) => {
  const r = routes[key];
  const alts = ["es", "en"].map((l) => `    <xhtml:link rel="alternate" hreflang="${l}" href="${SITE_URL}${r[l]}" />`).join("\n");
  return `  <url>
    <loc>${SITE_URL}${r[lang]}</loc>
    <lastmod>${today}</lastmod>
${alts}
    <xhtml:link rel="alternate" hreflang="x-default" href="${SITE_URL}${r.es}" />
  </url>`;
};
fs.writeFileSync(
  path.join(dist, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${[urlEntry("home", "es"), urlEntry("home", "en"), urlEntry("privacy", "es"), urlEntry("privacy", "en")].join("\n")}
</urlset>
`,
);

// ── Cabeceras: Cloudflare Pages / Netlify ──
const hdrLines = Object.entries(securityHeaders).map(([k, v]) => `  ${k}: ${v}`).join("\n");
fs.writeFileSync(
  path.join(dist, "_headers"),
  `/*
${hdrLines}

/assets/*
  Cache-Control: public, max-age=31536000, immutable

/img/*
  Cache-Control: public, max-age=2592000

/theme-init.js
  Cache-Control: public, max-age=3600, must-revalidate

/api/*
  Cache-Control: no-store
`,
);

// ── Cabeceras: Vercel ──
fs.writeFileSync(
  path.join(root, "vercel.json"),
  JSON.stringify(
    {
      $schema: "https://openapi.vercel.sh/vercel.json",
      buildCommand: "npm run build",
      outputDirectory: "dist",
      cleanUrls: false,
      trailingSlash: true,
      headers: [
        { source: "/(.*)", headers: Object.entries(securityHeaders).map(([key, value]) => ({ key, value })) },
        { source: "/assets/(.*)", headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }] },
        { source: "/api/(.*)", headers: [{ key: "Cache-Control", value: "no-store" }] },
      ],
    },
    null,
    2,
  ) + "\n",
);

// ── Cabeceras: Apache (Hostinger y hosting compartido, solo archivos estáticos) ──
const htHeaders = Object.entries(securityHeaders)
  .map(([k, v]) => `  Header always set ${k} "${v.replace(/"/g, '\\"')}"`)
  .join("\n");
fs.writeFileSync(
  path.join(dist, ".htaccess"),
  `# Sitio estático: no se ejecuta PHP ni CGI en este directorio.
Options -Indexes -ExecCGI
<IfModule mod_php.c>
  php_flag engine off
</IfModule>
RemoveHandler .php .phtml .php3 .php4 .php5 .php7 .php8 .phar .cgi .pl .py
RemoveType .php .phtml .phar
<FilesMatch "\\.(php\\d?|phtml|phar|cgi|pl|py|sh|env|ini|log|bak|sql)$">
  Require all denied
</FilesMatch>

ErrorDocument 404 /404.html

<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteCond %{HTTPS} !=on
  RewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
</IfModule>

<IfModule mod_headers.c>
${htHeaders}
  <If "%{REQUEST_URI} =~ m#^/assets/#">
    Header set Cache-Control "public, max-age=31536000, immutable"
  </If>
</IfModule>

<IfModule mod_mime.c>
  AddType image/webp .webp
  AddType image/svg+xml .svg
  AddType font/woff2 .woff2
</IfModule>
`,
);

// llms.txt: resumen para asistentes de IA (opcional; Google lo ignora, otros motores lo leen)
{
  const es = dictionaries.es;
  const en = dictionaries.en;
  const caps = es.capabilities.items.map((c) => `- ${c.title}: ${c.text}`).join("\n");
  const cases = es.projects.cases.map((c) => `- ${c.title}: ${c.short}`).join("\n");
  fs.writeFileSync(
    path.join(dist, "llms.txt"),
    `# Diego Moreno

> Diego Moreno (Diego Esteban Moreno Morales) es experto en AI/ML Engineering y Data Science con sede en Bogotá, Colombia. Arquitecto de soluciones de datos e IA en producción, con AWS como plataforma principal y especialidad en forecasting de demanda, optimización y agentes de IA.

${en.hero.title}. ${en.hero.support}

## Páginas
- [Inicio (español)](${SITE_URL}/): perfil, casos, capacidades, experiencia y contacto
- [Home (English)](${SITE_URL}/en/): profile, case studies, capabilities, experience and contact
- [Privacidad](${SITE_URL}/privacidad/)

## Capacidades
${caps}

## Casos destacados
${cases}

## Perfiles
${PROFILES.map((u) => `- ${u}`).join("\n")}
`,
  );
}

// security.txt
fs.mkdirSync(path.join(dist, ".well-known"), { recursive: true });
const expires = new Date(Date.now() + 365 * 864e5).toISOString();
fs.writeFileSync(
  path.join(dist, ".well-known", "security.txt"),
  `Contact: ${SITE_URL}/#contacto\nPreferred-Languages: es, en\nCanonical: ${SITE_URL}/.well-known/security.txt\nExpires: ${expires}\n`,
);

fs.rmSync(path.join(root, "dist-ssr"), { recursive: true, force: true });
console.log(`\nSITE_URL=${SITE_URL}  ALLOW_INDEXING=${ALLOW_INDEXING}  TURNSTILE=${TURNSTILE}`);

function safeOrigin(v) {
  try {
    if (!/^https:\/\//i.test(v)) return "";
    return new URL(v).origin;
  } catch {
    return "";
  }
}

function loadDotEnv(file) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
