/* Diego Moreno — inicialización previa al primer pintado.
   Archivo externo (no inline) para permitir una CSP estricta sin 'unsafe-inline'.
   1. Idioma: solo en la raíz "/" y sin elección guardada, redirige a /en/ si el navegador no prefiere español.
   2. Tema: system | light | dark  -> data-theme + data-effective-theme (contrato kit v3).
   3. Animación de fondo: on | off, siempre subordinada a prefers-reduced-motion.
   4. Precarga solo la variante del hero del tema efectivo, del tamaño que usará el CSS. */
(function () {
  var d = document.documentElement;
  var store = null;
  try { store = window.localStorage; } catch (e) { store = null; }
  function read(key) { try { return store ? store.getItem(key) : null; } catch (e) { return null; } }

  // 1. Idioma
  try {
    var path = location.pathname;
    var bot = /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|linkedin|embedly|lighthouse|headless/i.test(navigator.userAgent);
    if (!bot && (path === "/" || path === "/index.html")) {
      var savedLang = read("diego-moreno-lang");
      var wantsEn = false;
      if (savedLang === "en") wantsEn = true;
      else if (savedLang !== "es") {
        var langs = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || "es"];
        wantsEn = String(langs[0] || "es").toLowerCase().indexOf("es") !== 0;
      }
      if (wantsEn) { location.replace("/en/" + location.search + location.hash); return; }
    }
  } catch (e) { /* continuar en español */ }

  // 2. Tema
  var pref = read("diego-moreno-theme");
  if (pref !== "light" && pref !== "dark" && pref !== "system") pref = "system";
  var mqDark = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;
  var effective = pref === "system" ? (mqDark && mqDark.matches ? "dark" : "light") : pref;
  d.setAttribute("data-theme", pref);
  d.setAttribute("data-effective-theme", effective);
  d.style.colorScheme = effective;

  // 3. Animación de fondo
  var motion = read("diego-moreno-background-motion");
  if (motion !== "on" && motion !== "off") motion = "on";
  var reduce = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)").matches : false;
  d.setAttribute("data-motion-pref", motion);
  d.setAttribute("data-motion", reduce || motion === "off" ? "off" : "on");
  d.classList.add("js");

  // Entrada del sitio: se oculta el hero solo si habrá animación; nunca más de 2,5 s aunque falle el JS.
  if (d.getAttribute("data-motion") === "on" && d.getAttribute("data-page") === "home") {
    d.classList.add("intro-pending");
    setTimeout(function () { d.classList.remove("intro-pending"); }, 2500);
  }

  // 4. Precarga del arte del hero (una sola variante)
  if (d.getAttribute("data-page") === "home") {
    [["(min-width: 64rem)", 2560], ["(max-width: 63.99rem)", 1280]].forEach(function (v) {
      var link = document.createElement("link");
      link.rel = "preload";
      link.as = "image";
      link.type = "image/webp";
      link.media = v[0];
      link.setAttribute("fetchpriority", "high");
      link.href = "/img/hero-" + effective + "-" + v[1] + ".webp";
      document.head.appendChild(link);
    });
  }
})();
