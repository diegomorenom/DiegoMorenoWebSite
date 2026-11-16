// Cloudflare Pages Function: POST /api/contact
// Secretos en Pages › Settings › Variables and Secrets: RESEND_API_KEY, CONTACT_TO_EMAIL, CONTACT_FROM_EMAIL,
// TURNSTILE_SECRET_KEY (opcional), ALLOWED_ORIGINS.
import { handleContact, type ContactEnv } from "../../server/contact-core";

export const onRequest: PagesFunction<ContactEnv> = async ({ request, env }) => {
  const ip = request.headers.get("CF-Connecting-IP") || "";
  return handleContact(request, env, ip);
};
