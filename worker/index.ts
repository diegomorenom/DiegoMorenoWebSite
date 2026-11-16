/**
 * Cloudflare Worker (plan gratuito): sirve los archivos estáticos de /dist y atiende POST /api/contact.
 * El formulario se entrega con Cloudflare Email Routing (binding send_email) a una dirección verificada.
 * No hay claves de terceros ni datos personales en el código: el destino vive en la configuración del binding.
 */
import { EmailMessage } from "cloudflare:email";
import { handleContact, type ContactEnv, type ContactMail } from "../server/contact-core";

interface Env extends ContactEnv {
  ASSETS: { fetch(req: Request): Promise<Response> };
  SEND_EMAIL: { send(msg: EmailMessage): Promise<void> };
  MAIL_FROM: string; // p. ej. web@diegomorenom.com (dominio con Email Routing)
  MAIL_TO: string; // dirección verificada en Email Routing
  MAIL_FROM_NAME?: string;
}

const enc = new TextEncoder();
function b64(s: string) {
  const bytes = enc.encode(s);
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}
const wrap = (s: string) => s.replace(/.{1,76}/g, "$&\r\n");
const word = (s: string) => `=?UTF-8?B?${b64(s.replace(/[\r\n]+/g, " "))}?=`;
const addr = (s: string) => s.replace(/[\r\n<>",;\s]/g, "");

function mime(env: Env, m: ContactMail, domain: string) {
  const boundary = `b_${crypto.randomUUID()}`;
  const from = addr(env.MAIL_FROM);
  const to = addr(env.MAIL_TO);
  return [
    `From: ${word(env.MAIL_FROM_NAME || "Sitio web")} <${from}>`,
    `To: <${to}>`,
    `Reply-To: <${addr(m.replyTo)}>`,
    `Subject: ${word(m.subject)}`,
    `Message-ID: <contact-${m.key}@${domain}>`,
    `Date: ${new Date().toUTCString()}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
    "",
    wrap(b64(m.text)),
    `--${boundary}`,
    "Content-Type: text/html; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
    "",
    wrap(b64(m.html)),
    `--${boundary}--`,
    "",
  ].join("\r\n");
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === "/api/contact") {
      const ip = request.headers.get("CF-Connecting-IP") || "";
      const domain = addr(env.MAIL_FROM).split("@")[1] || url.hostname;
      return handleContact(request, env, ip, async (m) => {
        await env.SEND_EMAIL.send(new EmailMessage(addr(env.MAIL_FROM), addr(env.MAIL_TO), mime(env, m, domain)));
        return true;
      });
    }
    return env.ASSETS.fetch(request);
  },
};
