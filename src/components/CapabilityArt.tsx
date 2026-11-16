/**
 * Láminas del cuaderno de campo: un dibujo de línea por capacidad, con el mismo vocabulario del hero
 * (estratos, rutas, constelaciones, nodos y relieve). Decorativas: explican la idea, no una arquitectura real.
 * Todos los trazos usan pathLength=1 para poder dibujarse con GSAP sin medir.
 */
import type { ReactNode } from "react";

const W = 480;
const H = 360;

function wave(base: number, amp: number, freq: number, phase: number, x0 = 40, x1 = 440, step = 8) {
  const pts: [number, number][] = [];
  for (let x = x0; x <= x1; x += step) pts.push([x, +(base + amp * Math.sin(x * freq + phase)).toFixed(1)]);
  return { d: "M" + pts.map((p) => p.join(",")).join(" L"), y: (x: number) => +(base + amp * Math.sin(x * freq + phase)).toFixed(1) };
}

/* Generador determinista (mismo resultado en servidor y cliente) */
function rng(seed: number) {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
}

function Plataformas() {
  const layers = [wave(92, 9, 0.021, 0.4), wave(170, 11, 0.018, 1.7), wave(246, 8, 0.024, 2.6)];
  const cols = [110, 240, 360];
  return (
    <>
      {layers.map((l, i) => (
        <path key={i} className="art-draw" d={l.d} pathLength={1} />
      ))}
      {cols.map((x) => (
        <line key={x} className={x === 240 ? "art-accent art-draw" : "art-faint art-fade"} x1={x} y1={layers[0].y(x)} x2={x} y2={300} strokeDasharray={x === 240 ? undefined : "2 6"} pathLength={x === 240 ? 1 : undefined} />
      ))}
      {cols.flatMap((x) => layers.map((l, j) => <circle key={`${x}-${j}`} className={`art-node art-pop ${x === 240 ? "is-accent" : ""}`} cx={x} cy={l.y(x)} r={4.5} />))}
      {[150, 108, 66].map((rx, i) => (
        <ellipse key={rx} className={`art-fade ${i === 0 ? "art-line" : "art-faint"}`} cx={240} cy={312} rx={rx} ry={22 - i * 6} />
      ))}
      <circle className="art-node art-pop is-accent is-solid" cx={240} cy={312} r={5} />
    </>
  );
}

function Prediccion() {
  const hist = "M40,232 L78,214 L104,238 L140,196 L172,210 L206,176 L240,188";
  return (
    <>
      <line className="art-faint art-fade" x1={40} y1={300} x2={440} y2={300} />
      {Array.from({ length: 11 }, (_, i) => (
        <line key={i} className="art-faint art-fade" x1={40 + i * 40} y1={296} x2={40 + i * 40} y2={304} />
      ))}
      <path className="art-cone art-fade" d="M240,188 C310,170 380,120 440,78 L440,176 C380,180 310,192 240,188 Z" />
      <path className="art-draw" d={hist} pathLength={1} />
      <path className="art-faint art-fade" d="M240,188 C310,176 380,140 440,126" strokeDasharray="5 6" />
      <line className="art-faint art-fade" x1={240} y1={188} x2={240} y2={300} strokeDasharray="2 5" />
      <path className="art-accent art-draw" d="M240,188 C310,176 380,140 440,126" pathLength={1} />
      <circle className="art-node art-pop is-accent is-solid" cx={240} cy={188} r={5.5} />
      <circle className="art-node art-pop is-accent" cx={440} cy={126} r={8} />
      <text className="art-label art-fade" x={240} y={326} textAnchor="middle">t₀</text>
    </>
  );
}

function Ciencia() {
  const r = rng(7);
  const centers: [number, number, number][] = [
    [130, 132, 46],
    [318, 112, 40],
    [258, 252, 50],
  ];
  const dots: ReactNode[] = [];
  centers.forEach(([cx, cy, rad], k) => {
    for (let i = 0; i < 11; i++) {
      const a = r() * Math.PI * 2;
      const d = Math.sqrt(r()) * rad * 0.82;
      dots.push(<circle key={`${k}-${i}`} className="art-node art-pop" cx={+(cx + Math.cos(a) * d).toFixed(1)} cy={+(cy + Math.sin(a) * d * 0.8).toFixed(1)} r={3.2} />);
    }
  });
  return (
    <>
      {centers.map(([cx, cy, rad], k) => (
        <ellipse key={k} className="art-draw" cx={cx} cy={cy} rx={rad + 14} ry={(rad + 14) * 0.8} pathLength={1} />
      ))}
      {dots}
      {centers.map(([cx, cy], k) => (
        <g key={`c${k}`} className="art-pop">
          <line className="art-accent" x1={cx - 7} y1={cy} x2={cx + 7} y2={cy} />
          <line className="art-accent" x1={cx} y1={cy - 7} x2={cx} y2={cy + 7} />
        </g>
      ))}
      {[
        [62, 268],
        [410, 214],
        [420, 300],
      ].map(([x, y]) => (
        <circle key={`o${x}`} className="art-node art-pop is-hollow" cx={x} cy={y} r={3.5} />
      ))}
    </>
  );
}

function IA() {
  const sys: [number, number][] = [
    [72, 74],
    [408, 74],
    [60, 286],
    [420, 280],
    [240, 322],
  ];
  const paths = [
    "M214,180 H140 L104,144 V86",
    "M266,180 H330 L396,114 V86",
    "M222,198 L170,250 H72 V274",
    "M258,198 L300,240 H420 V268",
    "M240,206 V310",
  ];
  return (
    <>
      <circle className="art-faint art-fade" cx={240} cy={180} r={62} strokeDasharray="2 6" />
      {paths.map((d, i) => (
        <path key={i} className={`art-draw ${i === 1 ? "art-accent" : ""}`} d={d} pathLength={1} />
      ))}
      {sys.map(([x, y], i) => (
        <rect key={i} className={`art-node art-pop ${i === 1 ? "is-accent" : ""}`} x={x - 12} y={y - 12} width={24} height={24} rx={5} />
      ))}
      <circle className="art-node art-pop is-accent is-solid" cx={240} cy={180} r={9} />
      <circle className="art-line art-fade" cx={240} cy={180} r={26} />
    </>
  );
}

function Arquitectura() {
  const ridge = "M30,300 L118,222 L166,252 L250,140 L312,204 L362,172 L450,300";
  const trail = "M66,300 C112,292 142,276 170,264 C200,252 226,236 214,206 C204,182 236,170 250,140";
  return (
    <>
      <path className="art-draw" d={ridge} pathLength={1} />
      <path className="art-faint art-fade" d="M70,300 L132,246 L170,270 L250,170 L306,226 L350,204 L414,300" strokeDasharray="2 6" />
      <path className="art-accent art-draw" d={trail} pathLength={1} />
      <ellipse className="art-accent-faint art-fade" cx={250} cy={140} rx={78} ry={22} strokeDasharray="3 6" />
      {[
        [170, 264, "dev"],
        [214, 206, "test"],
        [250, 140, "prod"],
      ].map(([x, y, l], i) => (
        <g key={l as string}>
          <circle className={`art-node art-pop ${i === 2 ? "is-accent is-solid" : "is-accent"}`} cx={x as number} cy={y as number} r={i === 2 ? 6 : 4.5} />
          <text className="art-label art-fade" x={(x as number) + 12} y={(y as number) + 4}>
            {l}
          </text>
        </g>
      ))}
    </>
  );
}

const ART: Record<string, () => ReactNode> = {
  plataformas: Plataformas,
  prediccion: Prediccion,
  "ciencia-datos": Ciencia,
  ia: IA,
  arquitectura: Arquitectura,
};

export function CapabilityArt({ id, className = "" }: { id: string; className?: string }) {
  const Art = ART[id] ?? Plataformas;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={`cap-art ${className}`} aria-hidden="true" focusable="false">
      <Art />
    </svg>
  );
}
