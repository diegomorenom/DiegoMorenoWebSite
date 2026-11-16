# Seguridad

Revisión del 15 de noviembre de 2026, basada en las skills `security-best-practices` (React frontend), `owasp-security` (OWASP Top 10:2025), `supply-chain-risk-auditor` y `sharp-edges`.

## Arquitectura y superficie de ataque
- El sitio es **HTML estático**. No hay base de datos, sesiones, cookies, login ni PHP. Tras php2shell (CVE-2026-109618/109619, en el catálogo KEV), el `.htaccess` desactiva PHP y CGI y deniega `.php`, `.env`, `.sql` y similares.
- La única parte dinámica es `POST /api/contact`, una función serverless aislada y sin estado persistente.
- No hay secretos en el cliente. Las variables `VITE_*` son públicas por diseño. Las claves de Resend y Turnstile solo existen en la función.

## Cabeceras (las genera el build: `_headers`, `vercel.json` y `.htaccess`)
- **CSP estricta:** `default-src 'self'`, `script-src 'self'` sin `unsafe-inline` ni `unsafe-eval` (la inicialización del tema es un archivo externo), `style-src 'self'`, `object-src 'none'`, `frame-ancestors 'none'`, `base-uri 'self'`, `form-action 'self'` y `upgrade-insecure-requests`. Si se activa Turnstile, solo se añade `challenges.cloudflare.com`.
- HSTS (2 años, preload), `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` restrictiva, COOP y CORP.
- La CSP también va en `<meta>` para hostings sin cabeceras.

## Formulario (`server/contact-core.ts`)
| Riesgo | Control |
|---|---|
| CSRF / uso desde otros sitios | Exige `Origin` dentro de `ALLOWED_ORIGINS`. Sin cookies (`credentials: omit`) |
| Spam / bots | Honeypot, tiempo mínimo de 2,5 s, Cloudflare Turnstile verificado en el servidor (opcional) |
| Abuso / DoS | Cuerpo máximo de 16 KB, `Content-Type` JSON obligatorio, 5 envíos cada 10 min por IP, regla WAF recomendada |
| Inyección de cabeceras de email | Se eliminan CR/LF en nombre y asunto; destinatario y remitente solo desde la configuración |
| XSS en el email | Escape HTML de todos los campos y versión texto plano |
| Duplicados | `Idempotency-Key` en el cliente, en memoria y en Resend |
| Validación | Esquema estricto: enum de intención, longitudes, regex de email, caracteres de control y bidi eliminados |
| Fugas de información | Errores genéricos, `Cache-Control: no-store`, logs sin datos personales |
| Confirmación falsa | El cliente solo muestra éxito si el servidor responde `{ ok: true }` |

## Frontend
- Sin `dangerouslySetInnerHTML`, `innerHTML`, `eval` ni `new Function` en el código propio (verificado con reglas de Semgrep locales).
- Los enlaces externos llevan `rel="noopener noreferrer"`.
- `localStorage` guarda solo tres preferencias técnicas, siempre dentro de `try/catch` y validadas al leerlas.
- Fuentes e imágenes autoalojadas: sin peticiones a terceros ni rastreo.
- JSON-LD serializado con `<` escapado.
- Sin source maps en producción.

## Cadena de suministro
- 7 dependencias directas, versiones exactas y `package-lock.json`.
- `.npmrc` con `ignore-scripts=true`: ninguna dependencia ejecuta scripts al instalarse.
- `npm audit`: **0 vulnerabilidades** (React 19.3.1, Vite 8.3.8, Tailwind 4.3.5, GSAP 3.15.1).
- Mantenimiento: ejecutar `npm audit` y `npm outdated` cada mes. Activar Dependabot o Renovate si el repo vive en GitHub.

## Pendiente al desplegar
- Activar Turnstile y la regla de rate limiting del WAF.
- Enviar el dominio a hstspreload.org solo cuando HTTPS esté estable en todos los subdominios.
- Ejecutar `semgrep --config p/react --config p/secrets` (los registros públicos no estaban accesibles desde el entorno de desarrollo).
