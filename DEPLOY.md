# Despliegue — diegomorenom.com

**Hosting:** Cloudflare Workers con Static Assets, en el plan gratuito. El Worker se llama `diego-moreno`.
Sirve `dist/` y atiende `POST /api/contact`.

## Lo que está configurado en Cloudflare

| Pieza | Configuración |
|---|---|
| Dominios | `diegomorenom.com` (principal) y `www.diegomorenom.com`, conectados como Workers Custom Domains |
| www → raíz | Regla de redirección 301 (Single Redirect) |
| SSL | Universal SSL automático, modo Full (strict), Always Use HTTPS, TLS ≥ 1.2, TLS 1.3 |
| Cabeceras de seguridad | CSP, HSTS, X-Frame-Options, etc. como regla de zona (Response Header Transform Rules), más la CSP en `<meta>`. Incluye caché larga para `/assets/*` y `/img/*` |
| `*.workers.dev` | Desactivado para evitar contenido duplicado |
| Formulario | Email Routing activo (MX + SPF + DKIM). Binding `send_email` (`SEND_EMAIL`) con destino verificado; remitente `web@diegomorenom.com` |
| Analítica | Cloudflare Web Analytics, inyectado automáticamente y permitido en la CSP (`CF_WEB_ANALYTICS_AUTO=true`) |

**Variables del Worker** (texto plano, no son secretos):

- `MAIL_FROM`
- `MAIL_TO`
- `MAIL_FROM_NAME`
- `ALLOWED_ORIGINS`

## Actualizar el sitio

1. Compila el sitio con `npm run build`. Lee `.env`: `SITE_URL`, `ALLOW_INDEXING=true` y `CF_WEB_ANALYTICS_AUTO=true`.
2. Si cambió el Worker, compílalo:
   `npx rolldown worker/index.ts --format esm --platform neutral --external cloudflare:email --minify -o worker-dist/index.min.js`
3. Crea una sesión de carga con el manifest de `dist/`: `POST /accounts/:id/workers/scripts/diego-moreno/assets-upload-session`.
4. Sube los archivos que pida la sesión:
   `CF_ACCOUNT_ID=… node scripts/cf-upload-assets.mjs <jwt> '<buckets>'`
5. Publica una nueva versión:
   `PUT /accounts/:id/workers/scripts/diego-moreno`, con el completion JWT y los mismos bindings.

**Alternativa con Wrangler:** `npx wrangler deploy` usando un `wrangler.jsonc` equivalente con `assets.directory = "dist"`, `run_worker_first = ["/api/*"]` y `send_email`.
