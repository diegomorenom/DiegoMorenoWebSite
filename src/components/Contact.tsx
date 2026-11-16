import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import type { Dictionary, Intent } from "../content/types";
import { sectionIds } from "../content/ids";
import { site } from "../content/site";
import { onContactRequest } from "../lib/contactBus";
import { track } from "../lib/track";

const ENDPOINT = import.meta.env.VITE_CONTACT_ENDPOINT || "/api/contact";
const TURNSTILE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY || "";
const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{2,}$/;
const LIMITS = { name: 120, email: 254, company: 160, message: 4000 };

type Status = "idle" | "sending" | "success" | "error" | "rate" | "config";
type Errors = Partial<Record<"intent" | "name" | "email" | "message" | "captcha", string>>;

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string;
      reset: (id?: string) => void;
    };
  }
}

/** Carga Turnstile solo cuando el visitante empieza a usar el formulario (privacidad y rendimiento). */
function useTurnstile(container: React.RefObject<HTMLDivElement | null>, lang: string) {
  const [token, setToken] = useState("");
  const widgetId = useRef<string | null>(null);
  const started = useRef(false);

  const start = () => {
    if (!TURNSTILE_KEY || started.current) return;
    started.current = true;
    const render = () => {
      if (!window.turnstile || !container.current) return;
      widgetId.current = window.turnstile.render(container.current, {
        sitekey: TURNSTILE_KEY,
        language: lang,
        appearance: "interaction-only",
        callback: (tk: string) => setToken(tk),
        "expired-callback": () => setToken(""),
        "error-callback": () => setToken(""),
      });
    };
    if (window.turnstile) return render();
    const s = document.createElement("script");
    s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    s.async = true;
    s.defer = true;
    s.crossOrigin = "anonymous";
    s.referrerPolicy = "strict-origin-when-cross-origin";
    s.onload = render;
    document.head.appendChild(s);
  };
  const reset = () => {
    setToken("");
    if (widgetId.current && window.turnstile) window.turnstile.reset(widgetId.current);
  };
  return { enabled: Boolean(TURNSTILE_KEY), token, start, reset };
}

function newKey() {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
}

export function Contact({ t }: { t: Dictionary }) {
  const ids = sectionIds(t.lang);
  const c = t.contact;
  const uid = useId();
  const [intent, setIntent] = useState<Intent | "">("");
  const [origin, setOrigin] = useState("");
  const [values, setValues] = useState({ name: "", email: "", company: "", message: "", website: "" });
  const [errors, setErrors] = useState<Errors>({});
  const [submitted, setSubmitted] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const startedAt = useRef<number>(0);
  const idemKey = useRef<string>("");
  const startedTracking = useRef(false);
  const tsBox = useRef<HTMLDivElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  const ts = useTurnstile(tsBox, t.lang);
  const refs = {
    intent: useRef<HTMLInputElement>(null),
    name: useRef<HTMLInputElement>(null),
    email: useRef<HTMLInputElement>(null),
    message: useRef<HTMLTextAreaElement>(null),
  };

  useEffect(() => {
    startedAt.current = Date.now();
    return onContactRequest((p) => {
      setIntent(p.intent);
      setOrigin(p.origin);
    });
  }, []);

  const validate = (v = values, i = intent): Errors => {
    const e: Errors = {};
    if (!i) e.intent = c.vIntent;
    if (!v.name.trim()) e.name = c.vName;
    if (!EMAIL_RE.test(v.email.trim())) e.email = c.vEmail;
    if (v.message.trim().length < 10) e.message = c.vMessage;
    if (ts.enabled && !ts.token) e.captcha = c.vCaptcha;
    return e;
  };

  const onFirstInteraction = () => {
    ts.start();
    if (!startedTracking.current) {
      startedTracking.current = true;
      track("contact_start", { intent: intent || "none" });
    }
  };

  const update = (k: keyof typeof values, val: string) => {
    const next = { ...values, [k]: val };
    setValues(next);
    if (submitted) setErrors(validate(next));
  };

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (status === "sending") return; // evita reintentos involuntarios
    setSubmitted(true);
    const errs = validate();
    setErrors(errs);
    const first = (["intent", "name", "email", "message"] as const).find((k) => errs[k]);
    if (first) {
      refs[first].current?.focus();
      return;
    }
    if (errs.captcha) return;

    if (!idemKey.current) idemKey.current = newKey();
    setStatus("sending");
    const ctrl = new AbortController();
    const timer = window.setTimeout(() => ctrl.abort(), 15000);
    try {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        credentials: "omit",
        referrerPolicy: "strict-origin-when-cross-origin",
        signal: ctrl.signal,
        body: JSON.stringify({
          intent,
          name: values.name.trim().slice(0, LIMITS.name),
          email: values.email.trim().slice(0, LIMITS.email),
          company: values.company.trim().slice(0, LIMITS.company),
          message: values.message.trim().slice(0, LIMITS.message),
          origin: origin.slice(0, 160),
          page: window.location.pathname.slice(0, 120),
          lang: t.lang,
          website: values.website, // honeypot
          elapsed: Date.now() - startedAt.current,
          idempotencyKey: idemKey.current,
          turnstileToken: ts.token,
        }),
      });
      let ok = false;
      try {
        const data = (await res.json()) as { ok?: boolean };
        ok = res.ok && data.ok === true; // la confirmación solo llega si el servidor aceptó el mensaje
      } catch {
        ok = false;
      }
      if (ok) {
        setStatus("success");
        track("contact_success", { intent: intent || "none" });
        setValues({ name: "", email: "", company: "", message: "", website: "" });
        setOrigin("");
        setSubmitted(false);
        idemKey.current = "";
      } else if (res.status === 429) setStatus("rate");
      else if (res.status === 503) setStatus("config");
      else setStatus("error");
    } catch {
      setStatus("error");
    } finally {
      window.clearTimeout(timer);
      ts.reset();
    }
  }

  useEffect(() => {
    if (status === "success" || status === "error" || status === "rate" || status === "config") statusRef.current?.focus();
  }, [status]);

  const fid = (k: string) => `${uid}-${k}`;
  const errId = (k: string) => `${uid}-${k}-err`;
  const helpText = intent ? c.intentHelp[intent] : c.messageHelp;

  return (
    <section id={ids.contact} aria-labelledby="contact-title" data-route className="py-20 md:py-24">
      <div className="wrap grid gap-12 md:grid-cols-12 md:gap-10">
        <div className="md:col-span-5">
          <h2 id="contact-title" data-reveal className="text-section max-w-[16ch]">
            {c.title}
          </h2>
          <p className="mt-6 max-w-[44ch] text-lead text-ink-2">{c.intro}</p>
        </div>

        <div className="md:col-span-7">
          <div ref={statusRef} tabIndex={-1} aria-live="polite" className="outline-none">
            {status === "success" && (
              <div className="mb-8 rounded-xl border border-line bg-surface p-6">
                <p className="flex items-start gap-3 font-display text-[1.125rem] font-semibold">
                  <svg aria-hidden="true" viewBox="0 0 24 24" className="mt-0.5 size-6 shrink-0 text-accent-ink">
                    <path d="M5 12.5l4.2 4.2L19 7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {c.success}
                </p>
                <p className="mt-2 pl-9 text-muted">{c.nextStep}</p>
              </div>
            )}
            {(status === "error" || status === "rate" || status === "config") && (
              <div role="alert" className="mb-8 flex items-start gap-3 rounded-xl border border-error bg-surface p-5">
                <svg aria-hidden="true" viewBox="0 0 24 24" className="mt-0.5 size-5 shrink-0 text-error">
                  <g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 7.5v5.5M12 16.5v.01" />
                  </g>
                </svg>
                <p>
                  {status === "rate" ? c.errorRate : status === "config" ? c.errorConfig : c.error}{" "}
                  {status === "config" && (
                    <a className="link" href={site.linkedin} rel="noopener noreferrer" target="_blank">
                      LinkedIn
                    </a>
                  )}
                </p>
              </div>
            )}
          </div>

          <form noValidate onSubmit={onSubmit} onFocus={onFirstInteraction} className="grid gap-6" aria-describedby={`${uid}-privacy`}>
            <fieldset aria-describedby={errors.intent ? errId("intent") : undefined}>
              <legend className="mb-3 font-semibold">{c.intentLegend}</legend>
              <div className="grid gap-2">
                {(Object.keys(c.intents) as Intent[]).map((k, i) => (
                  <label
                    key={k}
                    className="flex min-h-12 cursor-pointer items-center gap-3 rounded-lg border border-line bg-surface px-4 py-2.5 transition-colors duration-200 hover:border-border has-[:checked]:border-action has-[:checked]:shadow-[inset_0_0_0_1px_var(--dm-action)]"
                  >
                    <input
                      ref={i === 0 ? refs.intent : undefined}
                      type="radio"
                      name="intent"
                      value={k}
                      checked={intent === k}
                      onChange={() => {
                        setIntent(k);
                        if (submitted) setErrors(validate(values, k));
                      }}
                      className="size-[18px] shrink-0 accent-[var(--dm-action)]"
                    />
                    <span>{c.intents[k]}</span>
                  </label>
                ))}
              </div>
              {errors.intent && <ErrorText id={errId("intent")}>{errors.intent}</ErrorText>}
            </fieldset>

            {origin && (
              <p className="flex flex-wrap items-center gap-2 text-[0.9375rem] text-muted">
                {c.originLabel}:
                <span className="inline-flex items-center gap-1 rounded-md border border-line bg-surface py-0.5 pl-2.5 pr-1 text-ink">
                  {origin}
                  <button type="button" onClick={() => setOrigin("")} className="inline-flex size-8 items-center justify-center rounded" aria-label={t.lang === "es" ? "Quitar origen" : "Remove origin"}>
                    <svg aria-hidden="true" viewBox="0 0 16 16" className="size-3.5">
                      <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </button>
                </span>
              </p>
            )}

            <div className="grid gap-6 sm:grid-cols-2">
              <Field id={fid("name")} label={c.name} error={errors.name} errorId={errId("name")}>
                <input
                  ref={refs.name}
                  id={fid("name")}
                  name="name"
                  autoComplete="name"
                  maxLength={LIMITS.name}
                  value={values.name}
                  onChange={(e) => update("name", e.target.value)}
                  aria-invalid={Boolean(errors.name)}
                  aria-describedby={errors.name ? errId("name") : undefined}
                  className="field"
                />
              </Field>
              <Field id={fid("email")} label={c.email} error={errors.email} errorId={errId("email")}>
                <input
                  ref={refs.email}
                  id={fid("email")}
                  name="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  spellCheck={false}
                  maxLength={LIMITS.email}
                  value={values.email}
                  onChange={(e) => update("email", e.target.value)}
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={errors.email ? errId("email") : undefined}
                  className="field"
                />
              </Field>
            </div>
            <Field id={fid("company")} label={`${c.company}`} hint={c.optional}>
              <input
                id={fid("company")}
                name="organization"
                autoComplete="organization"
                maxLength={LIMITS.company}
                value={values.company}
                onChange={(e) => update("company", e.target.value)}
                className="field"
              />
            </Field>
            <Field id={fid("message")} label={c.message} error={errors.message} errorId={errId("message")}>
              <p id={`${uid}-help`} className="-mt-0.5 mb-2 text-[0.9375rem] leading-snug text-muted">
                {helpText}
              </p>
              <textarea
                ref={refs.message}
                id={fid("message")}
                name="message"
                rows={6}
                maxLength={LIMITS.message}
                value={values.message}
                onChange={(e) => update("message", e.target.value)}
                aria-invalid={Boolean(errors.message)}
                aria-describedby={`${uid}-help${errors.message ? ` ${errId("message")}` : ""}`}
                className="field min-h-40 resize-y"
              />
            </Field>

            {/* Honeypot: invisible para personas, atractivo para bots */}
            <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
              <label htmlFor={fid("website")}>{c.honeypot}</label>
              <input id={fid("website")} name="website" tabIndex={-1} autoComplete="off" value={values.website} onChange={(e) => update("website", e.target.value)} />
            </div>

            {ts.enabled && (
              <div>
                <div ref={tsBox} />
                {errors.captcha && <ErrorText id={errId("captcha")}>{errors.captcha}</ErrorText>}
              </div>
            )}

            <div className="grid gap-4">
              <p id={`${uid}-privacy`} className="max-w-[60ch] text-[0.9375rem] text-muted">
                {c.privacy}{" "}
                <a className="link" href={site.routes.privacy[t.lang]}>
                  {c.privacyLink}
                </a>
                . {c.privacyExtra}
              </p>
              <div>
                <button type="submit" className="btn btn-primary" disabled={status === "sending"} aria-disabled={status === "sending"}>
                  {status === "sending" ? (
                    <>
                      <svg aria-hidden="true" viewBox="0 0 24 24" className="size-[18px] animate-spin">
                        <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="42 60" strokeLinecap="round" />
                      </svg>
                      {c.sending}
                    </>
                  ) : (
                    c.submit
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}

function Field({
  id,
  label,
  hint,
  error,
  errorId,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  errorId?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block font-semibold">
        {label}
        {hint && <span className="font-normal text-muted"> ({hint})</span>}
      </label>
      {children}
      {error && errorId && <ErrorText id={errorId}>{error}</ErrorText>}
    </div>
  );
}

function ErrorText({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <p id={id} className="mt-2 flex items-start gap-1.5 text-[0.9375rem] font-semibold text-error">
      <svg aria-hidden="true" viewBox="0 0 16 16" className="mt-[0.2rem] size-4 shrink-0">
        <path d="M8 2.5 14 13H2z" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
        <path d="M8 6.5v3M8 11.3v.01" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
      {children}
    </p>
  );
}
