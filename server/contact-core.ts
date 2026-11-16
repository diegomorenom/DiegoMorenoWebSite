/**
 * Lógica del formulario de contacto, independiente de la plataforma (Cloudflare Pages Functions, Vercel, Workers).
 * Solo APIs web estándar (Request/Response/fetch). Sin dependencias de terceros.
 *
 * Controles: método y tipo de contenido, tamaño máximo, Origin permitido, validación estricta de esquema,
 * honeypot + tiempo mínimo, Cloudflare Turnstile (si hay secreto), límite por IP, idempotencia,
 * escape de HTML y de cabeceras en el email, respuestas sin datos internos y sin registrar datos personales.
 */

export interface ContactEnv {
  RESEND_API_KEY?: string;
  CONTACT_TO_EMAIL?: string;
  CONTACT_FROM_EMAIL?: string;
  TURNSTILE_SECRET_KEY?: string;
  /** Lista separada por comas de orígenes permitidos, p. ej. "https://diegomoreno.dev,https://www.diegomoreno.dev" */
  ALLOWED_ORIGINS?: string;
}

type Intent = "project" | "contractor" | "job";
const INTENTS: Record<Intent, { es: string; en: string }> = {
  project: { es: "Proyecto o consultoría", en: "Project or consulting" },
  contractor: { es: "Contractor", en: "Contractor" },
  job: { es: "Oportunidad laboral", en: "Job opportunity" },
};

const MAX_BODY = 16 * 1024;
const MIN_ELAPSED_MS = 2500;
const RATE = { windowMs: 10 * 60 * 1000, max: 5 };
const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{2,}$/;
// Caracteres de control salvo salto de línea y tabulador
// eslint-disable-next-line no-control-regex
const CONTROL_RE = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F‪-‮⁦-⁩]/g;

// Estado en memoria del isolate: defensa de mejor esfuerzo. Complementar con una regla de rate limiting del WAF.
const hits = new Map<string, number[]>();
const seenKeys = new Map<string, number>();

function json(status: number, body: Record<string, unknown>, extra: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer",
      ...extra,
    },
  });
}

function allowedOrigins(env: ContactEnv, req: Request): string[] {
  const list = (env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((s) => s.trim().replace(/\/+$/, ""))
    .filter(Boolean);
  // Mismo origen siempre permitido
  list.push(new URL(req.url).origin);
  return list;
}

function corsHeaders(origin: string | null, allowed: string[]): Record<string, string> {
  if (!origin || !allowed.includes(origin)) return {};
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Accept",
    "Access-Control-Max-Age": "600",
    Vary: "Origin",
  };
}

function clean(v: unknown, max: number, multiline = false): string | null {
  if (typeof v !== "string") return null;
  let s = v.replace(CONTROL_RE, "").trim();
  if (!multiline) s = s.replace(/[\r\n]+/g, " ");
  if (s.length > max) return null;
  return s;
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

function rateLimited(ip: string, now: number) {
  const arr = (hits.get(ip) || []).filter((t) => now - t < RATE.windowMs);
  arr.push(now);
  hits.set(ip, arr);
  if (hits.size > 5000) hits.clear(); // evita crecimiento ilimitado
  return arr.length > RATE.max;
}

async function verifyTurnstile(secret: string, token: string, ip: string, key: string) {
  if (!token || token.length > 2048) return false;
  const form = new FormData();
  form.append("secret", secret);
  form.append("response", token);
  if (ip) form.append("remoteip", ip);
  form.append("idempotency_key", key);
  try {
    const r = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body: form });
    const data = (await r.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    return false;
  }
}

/** Mensaje ya validado y saneado que se entrega al proveedor de correo. */
export interface ContactMail {
  subject: string;
  text: string;
  html: string;
  replyTo: string;
  intent: string;
  key: string;
}

/** Entrega alternativa (p. ej. Cloudflare Email Routing). Devuelve true si se envió. */
export type Deliver = (mail: ContactMail) => Promise<boolean>;

export async function handleContact(req: Request, env: ContactEnv, ip: string, deliver?: Deliver): Promise<Response> {
  const origin = req.headers.get("Origin");
  const allowed = allowedOrigins(env, req);
  const cors = corsHeaders(origin, allowed);

  if (req.method === "OPTIONS") return new Response(null, { status: origin && cors["Access-Control-Allow-Origin"] ? 204 : 403, headers: cors });
  if (req.method !== "POST") return json(405, { ok: false, error: "method" }, { Allow: "POST, OPTIONS" });
  if (!origin || !allowed.includes(origin)) return json(403, { ok: false, error: "origin" });
  if (!(req.headers.get("Content-Type") || "").toLowerCase().startsWith("application/json")) return json(415, { ok: false, error: "type" }, cors);

  const len = Number(req.headers.get("Content-Length") || "0");
  if (len > MAX_BODY) return json(413, { ok: false, error: "size" }, cors);
  const raw = await req.text();
  if (raw.length > MAX_BODY) return json(413, { ok: false, error: "size" }, cors);

  const now = Date.now();
  if (rateLimited(ip || "unknown", now)) return json(429, { ok: false, error: "rate" }, { ...cors, "Retry-After": "600" });

  let body: Record<string, unknown>;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error();
    body = parsed as Record<string, unknown>;
  } catch {
    return json(400, { ok: false, error: "json" }, cors);
  }

  // Honeypot y tiempo mínimo: respuesta neutra, no se envía nada.
  const honeypot = typeof body.website === "string" ? body.website : "";
  const elapsed = typeof body.elapsed === "number" ? body.elapsed : 0;
  if (honeypot.length > 0 || elapsed < MIN_ELAPSED_MS) return json(200, { ok: true }, cors);

  const intent = body.intent;
  const name = clean(body.name, 120);
  const email = clean(body.email, 254);
  const company = clean(body.company ?? "", 160);
  const message = clean(body.message, 4000, true);
  const originLabel = clean(body.origin ?? "", 160) ?? "";
  const page = clean(body.page ?? "", 120) ?? "";
  const lang = body.lang === "en" ? "en" : "es";
  const key = clean(body.idempotencyKey, 64) || "";
  const token = typeof body.turnstileToken === "string" ? body.turnstileToken : "";

  if (typeof intent !== "string" || !(intent in INTENTS) || !name || !email || !EMAIL_RE.test(email) || company === null || !message || message.length < 10 || !/^[A-Za-z0-9-]{8,64}$/.test(key)) {
    return json(400, { ok: false, error: "validation" }, cors);
  }

  // Idempotencia: un reintento con la misma clave no duplica el mensaje.
  for (const [k, t] of seenKeys) if (now - t > 30 * 60 * 1000) seenKeys.delete(k);
  if (seenKeys.has(key)) return json(200, { ok: true, duplicate: true }, cors);

  if (env.TURNSTILE_SECRET_KEY) {
    const ok = await verifyTurnstile(env.TURNSTILE_SECRET_KEY, token, ip, key);
    if (!ok) return json(400, { ok: false, error: "captcha" }, cors);
  }

  if (!deliver && (!env.RESEND_API_KEY || !env.CONTACT_TO_EMAIL || !env.CONTACT_FROM_EMAIL)) return json(503, { ok: false, error: "not_configured" }, cors);

  const label = INTENTS[intent as Intent][lang];
  const subject = `[Web] ${label} — ${name}`.replace(/[\r\n]+/g, " ").slice(0, 180);
  const meta = [
    `${lang === "es" ? "Intención" : "Intent"}: ${label}`,
    `Nombre / Name: ${name}`,
    `Email: ${email}`,
    company ? `Empresa / Company: ${company}` : null,
    originLabel ? `Origen / Origin: ${originLabel}` : null,
    `Página / Page: ${page || "/"} (${lang})`,
  ].filter((l): l is string => l !== null);
  const lines = [...meta, "", message];
  const text = lines.join("\n");
  const html = `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.55;color:#172B2D">${lines
    .map((l) => (l ? `<p style="margin:0 0 6px">${escapeHtml(l).replace(/\n/g, "<br>")}</p>` : "<br>"))
    .join("")}</div>`;

  if (deliver) {
    let sent = false;
    try {
      sent = await deliver({ subject, text, html, replyTo: email, intent, key });
    } catch {
      sent = false;
    }
    if (!sent) {
      console.error("contact: delivery failed"); // sin datos personales
      return json(502, { ok: false, error: "provider" }, cors);
    }
    seenKeys.set(key, now);
    return json(200, { ok: true }, cors);
  }

  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY!}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `contact-${key}`,
      },
      body: JSON.stringify({
        from: env.CONTACT_FROM_EMAIL!,
        to: env.CONTACT_TO_EMAIL!.split(",").map((s) => s.trim()).filter(Boolean),
        reply_to: email,
        subject,
        text,
        html,
        tags: [{ name: "intent", value: intent }],
      }),
    });
    if (!r.ok) {
      console.error("contact: provider error", r.status); // sin datos personales
      return json(502, { ok: false, error: "provider" }, cors);
    }
  } catch {
    console.error("contact: provider unreachable");
    return json(502, { ok: false, error: "provider" }, cors);
  }

  seenKeys.set(key, now);
  return json(200, { ok: true }, cors);
}
