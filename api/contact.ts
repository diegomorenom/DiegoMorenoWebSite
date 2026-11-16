// Vercel Function (runtime Node, API web estándar): POST /api/contact
// Variables en Project › Settings › Environment Variables (marcadas como Sensitive).
import { handleContact } from "../server/contact-core";

function clientIp(req: Request) {
  // x-real-ip lo establece Vercel; no confiar en valores arbitrarios de x-forwarded-for.
  return req.headers.get("x-real-ip") || "";
}

const env = () => ({
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  CONTACT_TO_EMAIL: process.env.CONTACT_TO_EMAIL,
  CONTACT_FROM_EMAIL: process.env.CONTACT_FROM_EMAIL,
  TURNSTILE_SECRET_KEY: process.env.TURNSTILE_SECRET_KEY,
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS,
});

export async function POST(req: Request) {
  return handleContact(req, env(), clientIp(req));
}
export async function OPTIONS(req: Request) {
  return handleContact(req, env(), clientIp(req));
}
