// Sube a Cloudflare Workers Static Assets los archivos pendientes de una sesión de carga.
// Uso: node scripts/cf-upload-assets.mjs <upload-jwt> '<buckets-json>'   → imprime el completion JWT.
// La sesión (manifest) se crea con la API autenticada; este script solo usa el token temporal de carga.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";

const [jwt, bucketsJson] = process.argv.slice(2);
const root = "dist";
const types = { html: "text/html", css: "text/css", js: "application/javascript", woff2: "font/woff2", woff: "font/woff", webp: "image/webp", jpg: "image/jpeg", png: "image/png", svg: "image/svg+xml", txt: "text/plain", xml: "application/xml", webmanifest: "application/manifest+json", ico: "image/x-icon" };
const byHash = {};
(function walk(d) {
  for (const f of fs.readdirSync(d)) {
    const p = path.join(d, f);
    if (fs.statSync(p).isDirectory()) walk(p);
    else if (f !== ".htaccess") byHash[crypto.createHash("sha256").update(fs.readFileSync(p)).digest("hex").slice(0, 32)] = p;
  }
})(root);
const tmp = fs.mkdtempSync("/tmp/cfa-");
let last = "";
for (const bucket of JSON.parse(bucketsJson)) {
  const args = ["-sS", "-X", "POST", `https://api.cloudflare.com/client/v4/accounts/${process.env.CF_ACCOUNT_ID}/workers/assets/upload?base64=true`, "-H", `Authorization: Bearer ${jwt}`];
  for (const h of bucket) {
    const p = byHash[h];
    if (!p) throw new Error(`hash sin archivo: ${h}`);
    fs.writeFileSync(path.join(tmp, h), fs.readFileSync(p).toString("base64"));
    const t = path.basename(p) === "_headers" ? "application/octet-stream" : types[p.split(".").pop()] || "application/octet-stream";
    args.push("-F", `${h}=@${path.join(tmp, h)};type=${t};filename=${h}`);
  }
  const res = JSON.parse(execFileSync("curl", args, { encoding: "utf8" }));
  if (!res.success) throw new Error(JSON.stringify(res.errors));
  last = res.result?.jwt || last;
}
console.log(last);
