# diego-moreno-website

Landing de marca personal de **Diego Moreno**: AI/ML Engineering y Data Science. Español e inglés, temas Sistema/Claro/Oscuro, animación de fondo controlable, formulario de contacto serverless y HTML prerenderizado para SEO.

- **Stack:** React 19, Vite 8, Tailwind CSS v4 y GSAP 3.15 (ScrollTrigger y MotionPath) con @gsap/react, todo en TypeScript.
- **Sin PHP ni servidor propio.** El build genera HTML estático, y el formulario corre en una función serverless (Cloudflare Pages Functions o Vercel).
- **Dependencias:** 7 de producción y 54 paquetes en total. `npm audit` da 0 vulnerabilidades (15 nov 2026).

## Empezar

```bash
npm ci                # usa package-lock.json; .npmrc bloquea scripts de instalación
cp .env.example .env  # ajusta SITE_URL y, opcionalmente, Turnstile
npm run dev           # http://localhost:5173 (sin prerender; el formulario necesita la función)
npm run build         # typecheck + build + prerender  →  dist/
npm run preview
```

`npm run build` produce en `dist/`:

| Archivo | Para qué |
|---|---|
| `index.html`, `en/index.html` | Home ES / EN prerenderizadas (contenido completo sin JS) |
| `privacidad/`, `en/privacy/`, `404.html` | Páginas legales y de error |
| `sitemap.xml`, `robots.txt` | Con `hreflang` recíproco. `robots` bloquea todo mientras `ALLOW_INDEXING=false` |
| `_headers` | CSP y cabeceras de seguridad para **Cloudflare Pages / Netlify** |
| `.htaccess` | Lo mismo para **Apache / Hostinger**, y además desactiva PHP/CGI en el directorio |
| `.well-known/security.txt` | Contacto de seguridad |

`vercel.json` (en la raíz) se regenera en cada build con las mismas cabeceras.

## Desplegar

### Opción recomendada: Cloudflare Pages (gratis)
1. Sube el repo a GitHub y crea un proyecto en Cloudflare Pages. Build command: `npm run build`. Output: `dist`.
2. En **Settings › Variables and Secrets** define:
   - Build: `SITE_URL`, `ALLOW_INDEXING` y `VITE_TURNSTILE_SITE_KEY` (opcional).
   - Secretos: `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL` y `ALLOWED_ORIGINS`. Si usas Turnstile, también `TURNSTILE_SECRET_KEY`.
3. `functions/api/contact.ts` se publica solo como `POST /api/contact`.
4. Recomendado: una regla de **Rate limiting** del WAF para `/api/contact` (por ejemplo, 5 peticiones cada 10 min por IP). El límite en memoria de la función es solo una defensa de mejor esfuerzo.

### Vercel
Importa el repo. `vercel.json` ya define el build, la salida y las cabeceras, y `api/contact.ts` es la función. Configura las mismas variables marcadas como *Sensitive*.

### Hostinger u otro hosting compartido
Sube el contenido de `dist/` (incluido `.htaccess`) a `public_html`. El hosting solo sirve archivos estáticos y no ejecuta PHP. Para el formulario, despliega la función en Cloudflare o Vercel y en el build define:
```
VITE_CONTACT_ENDPOINT=https://<tu-proyecto>.pages.dev/api/contact
CONTACT_ORIGIN=https://<tu-proyecto>.pages.dev
```
En la función, `ALLOWED_ORIGINS` debe incluir el dominio de Hostinger.

### Email (Resend)
Crea una cuenta en resend.com, verifica tu dominio (registros SPF y DKIM) y usa un remitente de ese dominio en `CONTACT_FROM_EMAIL`. El mensaje llega con `reply_to` = el email del visitante.

## Lanzamiento: checklist
- [ ] Dominio definitivo en `SITE_URL` y en `ALLOWED_ORIGINS`.
- [ ] `ALLOW_INDEXING=true` solo cuando Diego apruebe el lanzamiento.
- [ ] Turnstile activo (clave pública en el build, secreto en la función).
- [ ] Prueba real del formulario con las tres intenciones: correcto, error y reintento.
- [ ] Revisar la política de privacidad con los proveedores reales.
- [ ] Search Console y Bing Webmaster Tools: verificar el sitio y enviar `sitemap.xml`.
- [ ] Revisar el contenido pendiente (ver abajo).

## Contenido que debe validar Diego
- **Caso «Asistente operativo»:** confirmar que se puede publicar el stack AWS (Lambda, Lex V2, Bedrock). Es la evidencia AWS que pide el documento maestro.
- **Estado de cada caso** (PoC, piloto o producción): campo `status` en `src/content/es.ts` y `en.ts`. Con `null` no se muestra.
- **CV:** guárdalo en `public/cv/` y define `site.cvUrl` en `src/content/site.ts`. Con `null`, el enlace no aparece.
- Denominaciones de Frubana, el grupo floricultor y Florexpo, y los cargos formales.
- WhatsApp, agenda y testimonios quedan fuera hasta que existan.

## Estructura
```
src/content/      copy ES/EN (fuente única), ids de secciones y configuración del sitio
src/components/   Header, Hero (escena), Projects, Capabilities, Process, Experience (Venn), Contact, Route (sendero)
src/lib/          preferencias (tema y movimiento), almacenamiento tolerante a fallos, eventos sin PII
public/           theme-init.js (antes del primer pintado), arte del hero 19/19L en WebP, iconos y OG
server/           lógica del formulario, independiente de la plataforma
functions/api/    adaptador de Cloudflare Pages
api/              adaptador de Vercel
scripts/          prerender, SEO y cabeceras
```

Más detalle en [SECURITY.md](SECURITY.md) y [DESIGN.md](DESIGN.md).
